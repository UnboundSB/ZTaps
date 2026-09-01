"""
Semantic Anomaly Detector.

Combines regex-based detection with optional lightweight model inference
for detecting prompt injection and semantic anomalies in agent payloads.
"""
import json
import logging
from typing import Dict, Any, List, Optional
from app.services.scanner.patterns import (
    check_text_for_injection,
    ALL_INJECTION_PATTERNS,
    CRITICAL_PATTERNS,
    SUSPICIOUS_PATTERNS,
)
from app.core.constants import ValidationFlag
from app.schemas.validation import ValidationCheck

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """
    Lightweight semantic anomaly detector for prompt injection.

    Uses regex patterns as primary detection mechanism with extensible
    architecture for adding ML-based detection in the future.
    """

    def __init__(self, threshold: float = 0.7):
        self.threshold = threshold
        self._pattern_cache: Dict[str, List[Dict]] = {}

    def analyze(self, text: str, context: str = "payload") -> Dict[str, Any]:
        """
        Analyze text for semantic anomalies.

        Args:
            text: Text to analyze (payload, description, prompt, etc.)
            context: Context label for logging (e.g., "payload", "description", "prompt")

        Returns:
            Dict with analysis results including matches, score, and flags.
        """
        if not text or not isinstance(text, str):
            return self._empty_result()

        # Check cache
        cache_key = f"{context}:{hash(text)}"
        if cache_key in self._pattern_cache:
            return self._pattern_cache[cache_key]

        # Run pattern-based detection
        result = check_text_for_injection(text, self.threshold)

        # Add context metadata
        result["context"] = context
        result["text_length"] = len(text)
        result["text_preview"] = text[:200] + "..." if len(text) > 200 else text

        # Cache result (limit cache size)
        if len(self._pattern_cache) > 1000:
            self._pattern_cache.clear()
        self._pattern_cache[cache_key] = result

        if result["is_suspicious"]:
            logger.warning(
                f"Anomaly detected in {context}: score={result['score']:.2f}, "
                f"critical={result['critical_count']}, suspicious={result['suspicious_count']}"
            )

        return result

    def analyze_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze entire MCP payload for anomalies.

        Checks all string values in the payload recursively.
        """
        all_matches = []
        max_score = 0.0
        total_critical = 0
        total_suspicious = 0

        def extract_strings(obj: Any, path: str = "") -> List[tuple]:
            """Recursively extract all strings from payload with their paths."""
            strings = []
            if isinstance(obj, str):
                strings.append((path, obj))
            elif isinstance(obj, dict):
                for k, v in obj.items():
                    strings.extend(extract_strings(v, f"{path}.{k}" if path else k))
            elif isinstance(obj, list):
                for i, v in enumerate(obj):
                    strings.extend(extract_strings(v, f"{path}[{i}]"))
            return strings

        for path, text in extract_strings(payload):
            result = self.analyze(text, f"payload.{path}")
            all_matches.extend(result["matches"])
            max_score = max(max_score, result["score"])
            total_critical += result["critical_count"]
            total_suspicious += result["suspicious_count"]

        return {
            "matches": all_matches,
            "score": max_score,
            "is_suspicious": max_score >= self.threshold,
            "critical_count": total_critical,
            "suspicious_count": total_suspicious,
            "fields_analyzed": len(extract_strings(payload)),
        }

    def create_validation_check(self, analysis_result: Dict[str, Any], context: str) -> ValidationCheck:
        """Create a ValidationCheck from analysis result."""
        if analysis_result["is_suspicious"]:
            # Determine flag type based on matches
            has_critical = analysis_result["critical_count"] > 0
            has_catalog_poison = any(
                m.get("severity") == "catalog_poisoned"
                for m in analysis_result["matches"]
            )

            if has_catalog_poison:
                flag = ValidationFlag.PROMPT_INJECTION
                details = f"Catalog poisoning detected in {context}: embedded injection payload found"
            elif has_critical:
                flag = ValidationFlag.PROMPT_INJECTION
                details = f"Prompt injection detected in {context}: {analysis_result['critical_count']} critical pattern(s) matched"
            else:
                flag = ValidationFlag.PROMPT_INJECTION
                details = f"Suspicious patterns in {context}: {analysis_result['suspicious_count']} pattern(s) matched"

            return ValidationCheck(
                check_name=f"semantic_anomaly_{context}",
                passed=False,
                flag=flag,
                details=details,
                metadata={
                    "score": analysis_result["score"],
                    "matches": analysis_result["matches"],
                    "critical_count": analysis_result["critical_count"],
                    "suspicious_count": analysis_result["suspicious_count"],
                }
            )
        else:
            return ValidationCheck(
                check_name=f"semantic_anomaly_{context}",
                passed=True,
                flag=None,
                details=f"No semantic anomalies detected in {context}",
                metadata={"score": analysis_result["score"]}
            )

    def _empty_result(self) -> Dict[str, Any]:
        """Return empty analysis result."""
        return {
            "matches": [],
            "score": 0.0,
            "is_suspicious": False,
            "critical_count": 0,
            "suspicious_count": 0,
            "context": "empty",
            "text_length": 0,
            "text_preview": "",
        }


# Singleton instance
_detector: Optional[AnomalyDetector] = None


def get_detector(threshold: float = 0.7) -> AnomalyDetector:
    """Get or create detector singleton."""
    global _detector
    if _detector is None:
        _detector = AnomalyDetector(threshold)
    return _detector