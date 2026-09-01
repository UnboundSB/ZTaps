import concurrent.futures
import urllib.request
import urllib.error
import time

import json

URL = "http://127.0.0.1:8000/api/v1/agent/intercept"
HEADERS = {
    "X-API-Key": "ztaps-secret-key-1234",
    "Content-Type": "application/json"
}
NUM_REQUESTS = 1000
CONCURRENCY = 50

PAYLOAD = json.dumps({
    "agent_id": "agent_001",
    "item_category": "software",
    "amount": 15000,
    "justification": "Purchasing annual license for IDE software."
}).encode("utf-8")

def fetch():
    start = time.time()
    try:
        req = urllib.request.Request(URL, data=PAYLOAD, headers=HEADERS, method="POST")
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            response.read()
            return status, time.time() - start
    except urllib.error.HTTPError as e:
        return e.code, time.time() - start
    except Exception as e:
        return 500, time.time() - start

def main():
    print(f"Starting Z-TAPS Load Test (Synchronous Mode)...")
    print(f"Target: {URL}")
    print(f"Total Requests: {NUM_REQUESTS}")
    print(f"Concurrency level: {CONCURRENCY}")
    
    stats = {
        'success': 0,
        'rate_limited': 0,
        'errors': 0,
        'statuses': {},
        'times': []
    }
    
    start_time = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(fetch) for _ in range(NUM_REQUESTS)]
        for future in concurrent.futures.as_completed(futures):
            status, latency = future.result()
            stats['statuses'][status] = stats['statuses'].get(status, 0) + 1
            if status == 429:
                stats['rate_limited'] += 1
            elif status == 200:
                stats['success'] += 1
            else:
                stats['errors'] += 1
            stats['times'].append(latency)
        
    duration = time.time() - start_time
    rps = NUM_REQUESTS / duration
    
    avg_latency = sum(stats['times']) / len(stats['times']) * 1000 if stats['times'] else 0
    max_latency = max(stats['times']) * 1000 if stats['times'] else 0
    
    print("\n" + "="*40)
    print("LOAD TEST RESULTS")
    print("="*40)
    print(f"Total Time: {duration:.2f} seconds")
    print(f"Requests per Second (RPS): {rps:.2f}")
    print(f"Average Latency: {avg_latency:.2f} ms")
    print(f"Max Latency: {max_latency:.2f} ms")
    print("-" * 40)
    print(f"Successful Requests (200 OK): {stats['success']}")
    print(f"Rate Limited (429 Too Many Requests): {stats['rate_limited']}")
    print(f"Failed Requests (Other Errors): {stats['errors']}")
    print(f"Status Code Breakdown: {stats['statuses']}")
    print("="*40)

if __name__ == "__main__":
    main()
