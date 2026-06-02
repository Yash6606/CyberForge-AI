from typing import Dict

class RiskEngine:
    def __init__(self):
        # Updated weight distribution
        self.weights = {
            "ml_weight": 0.4,
            "url_weight": 0.35,
            "text_heuristic_weight": 0.25
        }

    def calculate_risk(self, ml_prob: float, url_risk: float, text_features: Dict[str, float], url_override: bool) -> float:
        """
        Final Risk = (ML_Probability * 0.4) + (URL_Risk * 0.35) + (Heuristic_Text_Risk * 0.25)
        """
        
        # Calculate aggregate text heuristic risk (urgency + financial + impersonation signals)
        # We don't include url_risk here as it's separate now
        text_heuristic_risk = (
            text_features.get("urgency_score", 0.0) * 0.3 +
            text_features.get("financial_score", 0.0) * 0.2 +
            text_features.get("impersonation_score", 0.0) * 0.5
        )
        # Adjust weight within the 0-1 range
        text_heuristic_risk = min(text_heuristic_risk, 1.0)

        # Base hybrid score
        weighted_score = (
            (ml_prob * self.weights["ml_weight"]) +
            (url_risk * self.weights["url_weight"]) +
            (text_heuristic_risk * self.weights["text_heuristic_weight"])
        )

        # 34. Hard Override Rule (Brand impersonation + Suspicious TLD/Typo/Keywords)
        if url_override:
            weighted_score = max(weighted_score, 0.95)
        
        # New: Heavy penalty for brand impersonation mismatch
        if text_features.get("impersonation_score", 0) > 0.8:
            weighted_score = max(weighted_score, 0.88)

        # High-Confidence Text Override Rule (Legacy from last step)
        if (text_features.get("urgency_score", 0) > 0.7 and 
            text_features.get("financial_score", 0) > 0.7 and 
            text_features.get("impersonation_score", 0) > 0.7):
            weighted_score = max(weighted_score, 0.85)

        # Ensure normalized range 0.0 - 1.0
        final_score = max(0.0, min(weighted_score, 1.0))
        
        return final_score
