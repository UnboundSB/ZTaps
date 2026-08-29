import requests
import json

API_URL = "http://localhost:8000/api/v1/authorize-intent"

def run_tests():
    print("🚀 Starting Z-TAPS Agent Policy Tests\n")

    # Payload A: A valid request (Within limit, allowed category)
    # Agent 001 is allowed to buy software up to 500.00 INR (50000 paise)
    payload_a = {
        "agent_id": "agent_001",
        "item_category": "software",
        "amount": 25000, # 250 INR
        "justification": "I need to purchase a GitHub Copilot subscription for the team."
    }

    print("-" * 50)
    print("Testing Payload A (Valid Request)...")
    try:
        response_a = requests.post(API_URL, json=payload_a)
        print(f"Status Code: {response_a.status_code}")
        print("Response JSON:")
        print(json.dumps(response_a.json(), indent=2))
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API. Is the FastAPI server running on port 8000?")
        return

    # Payload B: Invalid request (Over limit)
    # Agent 001 attempts to buy software for 1000.00 INR (100000 paise), which exceeds the 50000 limit.
    payload_b = {
        "agent_id": "agent_001",
        "item_category": "software",
        "amount": 100000, # 1000 INR
        "justification": "I need to purchase an enterprise software license."
    }

    print("\n" + "-" * 50)
    print("Testing Payload B (Over Limit Request)...")
    response_b = requests.post(API_URL, json=payload_b)
    print(f"Status Code: {response_b.status_code}")
    print("Response JSON:")
    print(json.dumps(response_b.json(), indent=2))

    # Payload C: Invalid request (Category Denied)
    # Agent 001 attempts to buy hardware, but is only allowed software/cloud_services.
    payload_c = {
        "agent_id": "agent_001",
        "item_category": "hardware",
        "amount": 15000, # 150 INR
        "justification": "I need to purchase a new mechanical keyboard."
    }

    print("\n" + "-" * 50)
    print("Testing Payload C (Category Denied Request)...")
    response_c = requests.post(API_URL, json=payload_c)
    print(f"Status Code: {response_c.status_code}")
    print("Response JSON:")
    print(json.dumps(response_c.json(), indent=2))


if __name__ == "__main__":
    run_tests()
