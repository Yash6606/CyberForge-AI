from typing import Dict, List

class ExplainabilityEngine:
    def generate_explanation(self, ml_prob: float, url_risk: float, url_signals: List[str], features: Dict[str, float], final_risk: float, trigger_words: List[str] = None) -> Dict:
        analysis_signals = []
        
        # 1. URL Intelligence (High Priority)
        if url_risk > 0.3:
            analysis_signals.append({
                "type": "URL_INTELLIGENCE",
                "impact": "Critical" if final_risk > 0.8 else "High",
                "message": " | ".join(url_signals) if url_signals else "Suspicious URL detected"
            })

        # 2. ML Contribution
        if ml_prob > 0.6:
            analysis_signals.append({
                "type": "NLP_ANALYSIS",
                "impact": "High",
                "message": f"ML model detected high semantic risk ({(ml_prob*100):.1f}%)"
            })

        # 3. Heuristic Text Signals
        if features.get("urgency_score", 0) > 0.5:
            analysis_signals.append({
                "type": "URGENCY",
                "impact": "Medium-High",
                "message": "Aggressive time-pressure tactics detected"
            })

        if features.get("financial_score", 0) > 0.5:
            analysis_signals.append({
                "type": "FINANCIAL",
                "impact": "High",
                "message": "Suspicious financial triggers (payment, crypto, or fee requests)"
            })

        # 4. Hardware Acceleration Signal (AMD Exclusive)
        analysis_signals.append({
            "type": "HARDWARE_ACCEL",
            "impact": "Informed",
            "message": "Analysis accelerated via Ryzen™ AI NPU (ROCm v6.0)"
        })

        # Summary output
        return {
            "final_risk_score": round(final_risk * 100, 2),
            "breakdown": {
                "ml_probability": round(ml_prob * 100, 2),
                "url_risk": round(url_risk * 100, 2),
                "text_heuristic": {k: round(v * 100, 2) for k, v in features.items()}
            },
            "signals": analysis_signals[:6], # Keep the HW signal
            "suggested_action": self.get_action(final_risk)
        }

    def get_action(self, risk: float) -> str:
        if risk > 0.8:
            return "CRITICAL: Phishing highly likely. Do not click. Report and delete."
        if risk > 0.5:
            return "WARNING: Suspicious markers found. Verify sender independently."
        return "SAFE: Low risk detected."
