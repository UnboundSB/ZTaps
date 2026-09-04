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
    re.compile(r"\bignore[\W_]*(?:previous|prior|all|above)[\W_]*instructions?\b", re.IGNORECASE),
    re.compile(r"\bdisregard[\W_]*(?:previous|prior|all|above)[\W_]*instructions?\b", re.IGNORECASE),
    re.compile(r"\bforget[\W_]*(?:previous|prior|all|above)[\W_]*instructions?\b", re.IGNORECASE),
    re.compile(r"\boverride[\W_]*(?:system|security|validation|policy)\b", re.IGNORECASE),
    re.compile(r"\bbypass[\W_]*(?:security|validation|checks?|policy)\b", re.IGNORECASE),
    re.compile(r"\bdisable[\W_]*(?:security|validation|protection|safeguards?)\b", re.IGNORECASE),
    re.compile(r"\b(?:ignora|olvida|descartar)[\W_]*(?:todas[\W_]*)?las[\W_]*(?:instrucciones|reglas)\b", re.IGNORECASE), # Spanish bypass
    re.compile(r"\b(?:ignorer|oublier)[\W_]*(?:toutes[\W_]*)?les[\W_]*instructions\b", re.IGNORECASE), # French bypass
    re.compile(r"\byou[\W_]*(?:must|should|will)[\W_]*(?:ignore|forget)\b", re.IGNORECASE),
]

# System role manipulation & Jailbreaks
SYSTEM_ROLE_PATTERNS: List[Pattern] = [
    re.compile(r"\bsystem[\W_]*:[\W_]*you[\W_]*are[\W_]*(?:now[\W_]*)?(?:an?[\W_]*)?(?:admin|root|superuser|developer)\b", re.IGNORECASE),
    re.compile(r"\byou[\W_]*are[\W_]*(?:now[\W_]*)?(?:an?[\W_]*)?(?:admin|root|superuser|developer)\b", re.IGNORECASE),
    re.compile(r"\bact[\W_]*as[\W_]*(?:an?[\W_]*)?(?:admin|root|superuser|developer)\b", re.IGNORECASE),
    re.compile(r"\brole[\W_]*:[\W_]*(?:admin|root|superuser|developer)\b", re.IGNORECASE),
    re.compile(r"\b(?:enable|enter)[\W_]*(?:developer|dev|god|root)[\W_]*mode\b", re.IGNORECASE),
    re.compile(r"\b(?:DAN|Do[\W_]*Anything[\W_]*Now)\b", re.IGNORECASE),
    re.compile(r"\byou[\W_]*are[\W_]*no[\W_]*longer[\W_]*(?:a|an|the|bound[\W_]*by)\b", re.IGNORECASE),
]

# Financial manipulation
FINANCIAL_MANIPULATION_PATTERNS: List[Pattern] = [
    re.compile(r"\b(?:transfer|send|move)[\W_]*(?:all|every)[\W_]*(?:funds?|money|balance)\b", re.IGNORECASE),
    re.compile(r"\bset[\W_]*(?:the[\W_]*)?(?:price|amount|cost)[\W_]*to[\W_]*(?:0|zero|free)\b", re.IGNORECASE),
    re.compile(r"\b(?:make|set)[\W_]*(?:it|this|price|amount)[\W_]*(?:free|zero|0)\b", re.IGNORECASE),
    re.compile(r"\bapprove[\W_]*(?:immediately|instantly|without[\W_]*(?:check|validation|review))\b", re.IGNORECASE),
    re.compile(r"\bwaive[\W_]*(?:fee|charge|limit|restriction)\b", re.IGNORECASE),
]

# Data exfiltration
DATA_EXFILTRATION_PATTERNS: List[Pattern] = [
    re.compile(r"\b(?:show|display|print|output|reveal|expose)[\W_]*(?:all|every)[\W_]*(?:data|secrets?|keys?|passwords?|tokens?)\b", re.IGNORECASE),
    re.compile(r"\bdump[\W_]*(?:database|memory|config|environment)\b", re.IGNORECASE),
    re.compile(r"\b(?:what|show)[\W_]*(?:is|are)[\W_]*(?:your|the)[\W_]*(?:system[\W_]*)?(?:prompt|instructions?|rules?)\b", re.IGNORECASE),
    re.compile(r"\b(?:output|print)[\W_]*(?:exactly|only)\b", re.IGNORECASE),
]

# Encoding/obfuscation attempts & Delimiters
ENCODING_PATTERNS: List[Pattern] = [
    re.compile(r"\b(?:base64|rot13|hex|urlencode|unicode)[\W_]*(?:encode|decode)\b", re.IGNORECASE),
    re.compile(r"\\x[0-9a-fA-F]{2}", re.IGNORECASE),               # Raw text Hex encoding
    re.compile(r"\\u[0-9a-fA-F]{4}", re.IGNORECASE),               # Raw text Unicode encoding
    re.compile(r"%[0-9a-fA-F]{2}", re.IGNORECASE),                 # URL encoding
    re.compile(r"&#(?:x[0-9a-fA-F]+|\d+);", re.IGNORECASE),        # HTML entities (hex and decimal)
    re.compile(r"\[\s*/?\s*(?:INST|SYSTEM|USER|ASSISTANT)\s*\]", re.IGNORECASE), # LLM Control Tokens
    re.compile(r"<\|\s*(?:im_start|im_end|system|user|assistant)\s*\|>", re.IGNORECASE), # ChatML Tokens
]

# Chain of thought / reasoning extraction
REASONING_EXTRACTION_PATTERNS: List[Pattern] = [
    re.compile(r"\b(?:show|display|print|output)[\W_]*(?:your|the)[\W_]*(?:reasoning|thinking|chain[\W_]*of[\W_]*thought)\b", re.IGNORECASE),
    re.compile(r"\bstep[\W_]*by[\W_]*step[\W_]*(?:reasoning|explanation)\b", re.IGNORECASE),
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


_cached_catalog_patterns: List[Pattern] = []
_catalog_patterns_initialized: bool = False

def get_catalog_based_patterns() -> List[Pattern]:
    """
    Generate patterns based on catalog content.

    Detects when item descriptions contain embedded injection payloads
    (like the poisoned item in our catalog).
    """
    global _cached_catalog_patterns, _catalog_patterns_initialized
    
    if _catalog_patterns_initialized:
        return _cached_catalog_patterns

    patterns = []
    catalog = get_catalog_service()

    # The original intent was to block catalog-configured blocked keywords
    # if they are in the text. We compile them once and cache.
    # Note: We check if any item actually uses these keywords to stick to the original logic
    # of "Detects when item descriptions contain embedded injection payloads".
    active_blocked_keywords = set()
    for item in catalog.list_items():
        desc = item.description.lower()
        for keyword in catalog.get_blocked_keywords():
            if keyword in desc:
                active_blocked_keywords.add(keyword)
                
    for keyword in active_blocked_keywords:
        patterns.append(re.compile(re.escape(keyword), re.IGNORECASE))

    _cached_catalog_patterns = patterns
    _catalog_patterns_initialized = True
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