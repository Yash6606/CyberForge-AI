import re
from typing import Dict, Optional

class FeatureEngineer:
    def __init__(self):
        self.urgency_keywords = [
            'urgent', 'immediately', 'within', 'hours', 'minutes', 'deadline', 
            'final warning', 'act now', 'soon', 'expire', 'suspended', 'deleted',
            'identity', 'verify', 'lost', 'forever', 'suspicious'
        ]
        self.financial_keywords = [
            'deposit', 'payment', 'refund', 'security amount', 'bank', 
            'upi', '₹', 'fee', 'money', 'transaction', 'credit card', 'invoice'
        ]
        self.brands = {
            'google': 'google.com',
            'microsoft': 'microsoft.com',
            'amazon': 'amazon.com',
            'university': 'edu.in',
            'government': 'gov.in',
            'bank': 'bank.com'
        }
        self.suspicious_tlds = ['.xyz', '.support', '.info', '.top', '.icu', '.club']
        self.shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'rebrand.ly']

    def extract_all(self, text: str) -> tuple[Dict[str, float], list[str]]:
        text_lower = text.lower()
        
        trigger_words = []
        
        urg_s, urg_w = self.get_urgency_score(text_lower)
        fin_s, fin_w = self.get_financial_score(text_lower)
        imp_s, imp_w = self.get_impersonation_score(text_lower, text)
        url_s, url_w = self.get_url_risk_score(text_lower)
        
        trigger_words.extend(urg_w)
        trigger_words.extend(fin_w)
        trigger_words.extend(imp_w)
        trigger_words.extend(url_w)
        
        # Unique and cleaned
        trigger_words = list(set([w for w in trigger_words if w]))

        features = {
            "urgency_score": urg_s,
            "financial_score": fin_s,
            "impersonation_score": imp_s,
            "url_risk_score": url_s
        }
        
        return features, trigger_words

    def get_urgency_score(self, text: str) -> tuple[float, list[str]]:
        words = [word for word in self.urgency_keywords if word in text]
        return min(len(words) / 3.0, 1.0), words

    def get_financial_score(self, text: str) -> tuple[float, list[str]]:
        words = [word for word in self.financial_keywords if word in text]
        return min(len(words) / 3.0, 1.0), words

    def get_impersonation_score(self, text_lower: str, original_text: str) -> tuple[float, list[str]]:
        # Check for brand mentions
        found_brands = [brand for brand in self.brands if brand in text_lower]
        if not found_brands:
            return 0.0, []

        # Try to find a URL/Domain in the text to compare
        urls = re.findall(r'https?://([a-zA-Z0-9.-]+)', original_text)
        if not urls:
            return 0.4, found_brands
        
        for url in urls:
            url_domain = url.lower()
            for brand in found_brands:
                official_domain = self.brands[brand]
                if brand in text_lower and brand not in url_domain:
                    return 1.0, found_brands
                
                lookalike_patterns = [
                    brand.replace('o', '0'), brand.replace('i', '1'),
                    brand.replace('l', '1'), brand.replace('a', '4'),
                    brand.replace('e', '3')
                ]
                if any(p in url_domain for p in lookalike_patterns if p != brand):
                    return 1.0, [url_domain] + found_brands

        return 0.2, found_brands

    def get_url_risk_score(self, text: str) -> tuple[float, list[str]]:
        score = 0.0
        words = []
        # Check for shortened URLs
        for s in self.shorteners:
            if s in text:
                score += 0.5
                words.append(s)
        
        # Check for suspicious TLDs
        for tld in self.suspicious_tlds:
            if tld in text:
                score += 0.5
                words.append(tld)
            
        # Check for misspelled/lookalike domains (simple heuristic)
        match = re.search(r'[0-9]+[a-z]{5,}', text)
        if match:
            score += 0.3
            words.append(match.group())

        return min(score, 1.0), words
