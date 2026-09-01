import json
from pathlib import Path
from rich.console import Console
from rich.table import Table

def run_dashboard():
    console = Console()
    table = Table(title="Z-TAPS Live Transactions")
    table.add_column("Time", justify="left")
    table.add_column("Request ID", style="cyan")
    table.add_column("Item", style="magenta")
    table.add_column("Amount")
    table.add_column("Action", style="green")
    table.add_column("Flags", style="red")

    log_file = Path("data/transactions.jsonl")
    if not log_file.exists():
        console.print("No transactions logged yet. Run the mock_agent.py first!")
        return

    with open(log_file, "r") as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            time_str = data.get("timestamp", "")[:19].replace("T", " ")
            req_id = data.get("request_id", "")[:8]
            item = data.get("item_id", "")
            amt = f"₹{data.get('requested_amount', 0) / 100:,.0f}"
            action = data.get("action", "")
            flags = ", ".join(data.get("flags", [])) or "None"
            
            table.add_row(time_str, req_id, item, amt, action, flags)
            
    console.print(table)

if __name__ == "__main__":
    run_dashboard()
