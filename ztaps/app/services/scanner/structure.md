# LLM Judge (Semantic Anomaly Detection)

## Files
- `__init__.py`: Package initialization.
- `patterns.py`: Regex patterns for prompt injection detection (system overrides, hidden commands, data exfiltration).
- `detector.py`: Anomaly detector class combining regex and optional lightweight model inference.