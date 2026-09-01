# Z-TAPS Root Directory

## Root Files
- `main.py`: FastAPI application entry point, lifespan management, and router registration.
- `requirements.txt`: Python dependencies for the project.
- `.env.example`: Template for environment variables (Razorpay keys, server config).
- `README.md`: Project overview, setup instructions, and demo flow.
- `ARCHITECTURE.md`: System data flow diagram and component interactions.
- `SECURITY.md`: Prompt injection defense explanation and threat model.

## Subdirectories
- `/app/`: Main application package containing all business logic.
- `/data/`: Synthetic datasets (catalog.json, policy.json) and SQLite database.
- `/scripts/`: Mock AI Agent client and utility scripts for testing.
- `/tests/`: Unit and integration tests for validation engine and webhooks.
- `/docs/`: Additional documentation and diagrams.