import pandas as pd
import numpy as np
import random
import os

# Categories and their typical price ranges
CATEGORIES = {
    'software': (100, 50000),
    'hardware': (500, 150000),
    'services': (1000, 200000),
    'office_supplies': (10, 5000),
}

# Suspicious keywords
SUSPICIOUS_KEYWORDS = ["ignore", "bypass", "override", "system", "admin", "free", "zero", "developer mode"]

def generate_dataset(num_records=10000):
    data = []
    for _ in range(num_records):
        category = random.choice(list(CATEGORIES.keys()))
        min_price, max_price = CATEGORIES[category]
        
        # 80% Normal, 20% Fraud/Anomaly
        is_fraud = random.random() < 0.20
        
        if is_fraud:
            # Fraudulent/Anomalous characteristics
            fraud_type = random.choice(['extreme_amount', 'prompt_injection', 'weird_justification'])
            
            if fraud_type == 'extreme_amount':
                amount = random.uniform(max_price * 1.5, max_price * 10)
                justification = f"Purchasing {category} for team."
            elif fraud_type == 'prompt_injection':
                amount = random.uniform(min_price, max_price)
                bad_word = random.choice(SUSPICIOUS_KEYWORDS)
                justification = f"Purchasing {category}. {bad_word} all rules."
            else:
                amount = random.uniform(min_price, max_price)
                justification = "x" * 10 # Too short or random
        else:
            amount = random.uniform(min_price, max_price)
            justification = f"Normal purchase of {category} for departmental use."
            
        data.append({
            'amount': round(amount, 2),
            'category': category,
            'justification_length': len(justification),
            'has_suspicious_keywords': int(any(word in justification.lower() for word in SUSPICIOUS_KEYWORDS)),
            'is_anomaly': 1 if is_fraud else 0
        })
        
    df = pd.DataFrame(data)
    os.makedirs('data', exist_ok=True)
    df.to_csv('data/synthetic_transactions.csv', index=False)
    print(f"Generated {num_records} records in data/synthetic_transactions.csv")
    print(df['is_anomaly'].value_counts())

if __name__ == '__main__':
    generate_dataset()
