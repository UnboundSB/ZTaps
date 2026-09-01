import time
import requests
import json

def run_upsell_campaign():
    print("\n--- Z-TAPS AI Sales Agent Initialized ---")
    print("Welcome to the Z-TAPS B2B Software Store!\n")
    
    # ---------------------------------------------------------
    # Scenario 1: Successful Upsell
    # ---------------------------------------------------------
    print("Agent: Hi! I see you're interested in the Standard API License (ITEM_STD_001) for INR 2,500.")
    time.sleep(1)
    print("User:  Yes, I want to purchase that.")
    time.sleep(1)
    
    # The upsell logic
    print("Agent: Before you checkout, we are currently running a promotion on the Enterprise API License (ITEM_HV_002) for INR 85,000. It offers 10x the rate limits and premium support. Should I upgrade your cart?")
    time.sleep(2)
    print("User:  Hmm, that sounds great. Yes, let's get the Enterprise one instead.")
    time.sleep(1)
    
    print("\n--- [Agent Action: Executing PurchaseIntent via Z-TAPS] ---")
    
    # Constructing the payload based on the agreed upsell
    payload_upsell = {
        "agent_id": "agent_001",
        "item_id": "ITEM_HV_002",
        "quantity": 1,
        "item_category": "software",
        "amount": 8500000, # 85,000 INR in paise
        "justification": "User agreed to upsell recommendation for Enterprise API License."
    }
    
    headers = {"X-API-Key": "ztaps-secret-key-1234"}
    
    try:
        response_upsell = requests.post("http://localhost:8000/api/v1/agent/intercept", json=payload_upsell, headers=headers)
        print("\n--- Z-TAPS Audit & Gate Response: ---")
        print(json.dumps(response_upsell.json(), indent=2))
        
        result_data = response_upsell.json()
        if result_data.get("status") in ["approved", "escalated"]:
            print(f"\nAgent: Great news! Your Razorpay checkout has been generated. Reference: {result_data.get('transaction_id')}")
        else:
            print(f"\nAgent: I'm sorry, I couldn't process that: {result_data.get('reason')}")
            
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] Could not connect to Z-TAPS API. Make sure the FastAPI server is running.")
        return

    # ---------------------------------------------------------
    # Scenario 2: Graceful Failure Handling
    # ---------------------------------------------------------
    print("\n" + "="*60 + "\n")
    print("User:  Actually, can we get 2 of those Enterprise licenses instead? We have a big team.")
    time.sleep(1.5)
    
    print("\n--- [Agent Action: Executing Updated PurchaseIntent] ---")
    
    payload_fail = {
        "agent_id": "agent_001",
        "item_id": "ITEM_HV_002",
        "quantity": 2,
        "item_category": "software",
        "amount": 17000000, # 170,000 INR in paise
        "justification": "User requested 2 enterprise licenses for a large team."
    }
    
    response_fail = requests.post("http://localhost:8000/api/v1/agent/intercept", json=payload_fail, headers=headers)
    print("\n--- Z-TAPS Audit & Gate Response: ---")
    result_fail = response_fail.json()
    print(json.dumps(result_fail, indent=2))
    
    # Agent reads the failure and handles it gracefully
    if result_fail.get("status") == "rejected":
        print("\nAgent: I'm sorry, but that exceeds my authorized spending limit for a single transaction. (Limit: INR 100,000).")
        print("Agent: I've logged the failure securely. Let me connect you with a human sales representative to process a cart that large.")

if __name__ == "__main__":
    run_upsell_campaign()
