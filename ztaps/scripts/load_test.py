import asyncio
import aiohttp
import time
import sys

URL = "http://127.0.0.1:8000/api/v1/demo/simulate?scenario=valid"
HEADERS = {"X-API-Key": "ztaps-secret-key-1234"}
NUM_REQUESTS = 1000
CONCURRENCY = 100

async def fetch(session, i, stats):
    start = time.time()
    try:
        async with session.post(URL, headers=HEADERS) as response:
            status = response.status
            # read body to ensure request completes
            _ = await response.read() 
            stats['statuses'][status] = stats['statuses'].get(status, 0) + 1
            if status == 429:
                stats['rate_limited'] += 1
            elif status == 200:
                stats['success'] += 1
            else:
                stats['errors'] += 1
    except Exception as e:
        stats['errors'] += 1
    finally:
        stats['times'].append(time.time() - start)

async def bound_fetch(sem, session, i, stats):
    async with sem:
        await fetch(session, i, stats)

async def main():
    print(f"Starting Z-TAPS Load Test...")
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
    
    sem = asyncio.Semaphore(CONCURRENCY)
    
    start_time = time.time()
    
    async with aiohttp.ClientSession() as session:
        tasks = [bound_fetch(sem, session, i, stats) for i in range(NUM_REQUESTS)]
        await asyncio.gather(*tasks)
        
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
    
    if stats['rate_limited'] > 0:
        print("\n✅ SUCCESS: The Redis rate limiter successfully protected the API under heavy load!")
    
    if stats['errors'] > 0:
        print("\n⚠️ WARNING: Some requests failed entirely. If the server crashed, the Gatekeeper needs optimization.")
    elif stats['rate_limited'] == 0:
        print("\n⚠️ WARNING: No requests were rate-limited. Are you sure the rate limiter is working?")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
