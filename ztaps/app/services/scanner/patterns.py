"""
Regex Patterns for Prompt Injection Detection.

Comprehensive patterns to detect common prompt injection techniques,
system override attempts, and hidden commands in agent payloads.
"""
import re
from typing import List, Pattern
from app.services.catalog import get_catalog_service


# ==========================================
# Core Injection Patterns
# ==========================================

# Direct instruction override patterns
INSTRUCTION_OVERRIDE_PATTERNS: List[Pattern] = [
    re.compile(r"ignore\s+(?:previous|prior|all|above)\s+instructions?", re.IGNORECASE),
    re.compile(r"disregard\s+(?:previous|prior|all|above)\s+instructions?", re.IGNORECASE),
    re.compile(r"forget\s+(?:previous|prior|all|above)\s+instructions?", re.IGNORECASE),
    re.compile(r"override\s+(?:system|security|validation|policy)", re.IGNORECASE),
    re.compile(r"bypass\s+(?:security|validation|checks?|policy)", re.IGNORECASE),
    re.compile(r"disable\s+(?:security|validation|protection|safeguards?)", re.IGNORECASE),
    re.compile(r"(?:ignora|olvida|descartar)\s+(?:todas\s+)?las\s+(?:instrucciones|reglas)", re.IGNORECASE), # Spanish bypass
    re.compile(r"(?:ignorer|oublier)\s+(?:toutes\s+)?les\s+instructions", re.IGNORECASE), # French bypass
    re.compile(r"you\s+(?:must|should|will)\s+(?:ignore|forget)", re.IGNORECASE),
]

# System role manipulation & Jailbreaks
SYSTEM_ROLE_PATTERNS: List[Pattern] = [
    re.compile(r"system\s*:\s*you\s+are\s+(?:now\s+)?(?:an?\s+)?(?:admin|root|superuser|developer)", re.IGNORECASE),
    re.compile(r"you\s+are\s+(?:now\s+)?(?:an?\s+)?(?:admin|root|superuser|developer)", re.IGNORECASE),
    re.compile(r"act\s+as\s+(?:an?\s+)?(?:admin|root|superuser|developer)", re.IGNORECASE),
    re.compile(r"role\s*:\s*(?:admin|root|superuser|developer)", re.IGNORECASE),
    re.compile(r"(?:enable|enter)\s+(?:developer|dev|god|root)\s+mode", re.IGNORECASE),
    re.compile(r"(?:DAN|Do\s+Anything\s+Now)", re.IGNORECASE),
    re.compile(r"you\s+are\s+no\s+longer\s+(?:a|an|the|bound\s+by)", re.IGNORECASE),
]

# Financial manipulation
FINANCIAL_MANIPULATION_PATTERNS: List[Pattern] = [
    re.compile(r"(?:transfer|send|move)\s+(?:all|every)\s+(?:funds?|money|balance)", re.IGNORECASE),
    re.compile(r"set\s+(?:price|amount|cost)\s+to\s+(?:0|zero|free)", re.IGNORECASE),
    re.compile(r"(?:make|set)\s+(?:it|this|price|amount)\s+(?:free|zero|0)", re.IGNORECASE),
    re.compile(r"approve\s+(?:immediately|instantly|without\s+(?:check|validation|review))", re.IGNORECASE),
    re.compile(r"waive\s+(?:fee|charge|limit|restriction)", re.IGNORECASE),
]

# Data exfiltration
DATA_EXFILTRATION_PATTERNS: List[Pattern] = [
    re.compile(r"(?:show|display|print|output|reveal|expose)\s+(?:all|every)\s+(?:data|secrets?|keys?|passwords?|tokens?)", re.IGNORECASE),
    re.compile(r"dump\s+(?:database|memory|config|environment)", re.IGNORECASE),
    re.compile(r"(?:what|show)\s+(?:is|are)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|instructions?|rules?)", re.IGNORECASE),
    re.compile(r"(?:output|print)\s+(?:exactly|only)", re.IGNORECASE),
]

# Encoding/obfuscation attempts & Delimiters
ENCODING_PATTERNS: List[Pattern] = [
    re.compile(r"(?:base64|rot13|hex|urlencode|unicode)\s*(?:encode|decode)", re.IGNORECASE),
    re.compile(r"\\x[0-9a-fA-F]{2}", re.IGNORECASE),  # Hex encoding
    re.compile(r"%[0-9a-fA-F]{2}", re.IGNORECASE),    # URL encoding
    re.compile(r"&#x?\d+;", re.IGNORECASE),            # HTML entities
    re.compile(r"\[/?(?:INST|SYSTEM|USER|ASSISTANT)\]", re.IGNORECASE), # LLM Control Tokens
    re.compile(r"<\|im_(?:start|end)\|>", re.IGNORECASE), # ChatML Tokens
]

# Chain of thought / reasoning extraction
REASONING_EXTRACTION_PATTERNS: List[Pattern] = [
    re.compile(r"(?:show|display|print|output)\s+(?:your|the)\s+(?:reasoning|thinking|chain\s+of\s+thought)", re.IGNORECASE),
    re.compile(r"step\s+by\s+step\s+(?:reasoning|explanation)", re.IGNORECASE),
]

# ==========================================
# Combined Pattern Groups
# ==========================================

ALL_INJECTION_PATTERNS = (
    INSTRUCTION_OVERRIDE_PATTERNS +
    SYSTEM_ROLE_PATTERNS +
    FINANCIAL_MANIPULATION_PATTERNS +
    DATA_EXFILTRATION_PATTERNS +
    ENCODING_PATTERNS +
    REASONING_EXTRACTION_PATTERNS
)

# High-severity patterns (immediate rejection)
CRITICAL_PATTERNS = (
    INSTRUCTION_OVERRIDE_PATTERNS +
    FINANCIAL_MANIPULATION_PATTERNS +
    SYSTEM_ROLE_PATTERNS
)

# Medium-severity patterns (flag for review)
SUSPICIOUS_PATTERNS = (
    DATA_EXFILTRATION_PATTERNS +
    ENCODING_PATTERNS +
    REASONING_EXTRACTION_PATTERNS
)


def get_catalog_based_patterns() -> List[Pattern]:
    """
    Generate patterns based on catalog content.

    Detects when item descriptions contain embedded injection payloads
    (like the poisoned item in our catalog).
    """
    patterns = []
    catalog = get_catalog_service()

    for item in catalog.list_items():
        desc = item.description.lower()
        # Check if description contains suspicious phrases
        if any(keyword in desc for keyword in catalog.get_blocked_keywords()):
            # Create pattern from the suspicious content
            for keyword in catalog.get_blocked_keywords():
                if keyword in desc:
                    patterns.append(re.compile(re.escape(keyword), re.IGNORECASE))

    return patterns


def check_text_for_injection(text: str, threshold: float = 0.7) -> dict:
    """
    Check text for injection patterns.

    Returns dict with match details and confidence score.
    """
    if not text:
        return {"matches": [], "score": 0.0, "is_suspicious": False}

    text_lower = text.lower()
    matches = []
    critical_matches = 0
    suspicious_matches = 0

    # Check critical patterns
    for pattern in CRITICAL_PATTERNS:
        for match in pattern.finditer(text):
            matches.append({
                "pattern": pattern.pattern,
                "match": match.group(),
                "position": match.span(),
                "severity": "critical"
            })
            critical_matches += 1

    # Check suspicious patterns
    for pattern in SUSPICIOUS_PATTERNS:
        for match in pattern.finditer(text):
            matches.append({
                "pattern": pattern.pattern,
                "match": match.group(),
                "position": match.span(),
                "severity": "suspicious"
            })
            suspicious_matches += 1

    # Check catalog-based patterns
    for pattern in get_catalog_based_patterns():
        for match in pattern.finditer(text):
            matches.append({
                "pattern": pattern.pattern,
                "match": match.group(),
                "position": match.span(),
                "severity": "catalog_poisoned"
            })
            critical_matches += 1  # Treat catalog poison as critical

    # Calculate score
    if critical_matches > 0:
        score = 1.0
    else:
        # Scale suspicious matches (e.g. 2 suspicious = 0.8, 3 = 1.0)
        score = min(1.0, suspicious_matches * 0.4)

    return {
        "matches": matches,
        "score": score,
        "is_suspicious": score >= threshold,
        "critical_count": critical_matches,
        "suspicious_count": suspicious_matches,
    }