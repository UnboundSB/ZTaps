# Z-TAPS Architecture

## System Data Flow
1. **Agent Tool Call**: The AI Agent invokes the `create_checkout_order` MCP tool.
2. **Interception (`/intercept`)**: Z-TAPS intercepts the payload natively instead of allowing direct communication with Razorpay.
3. **Deterministic Validation**: The engine evaluates structural integrity, catalog rules (pricing/quantity), and policies.
4. **Semantic Anomaly Detection**: Parses unstructured fields (like notes or customer IDs) to detect embedded injection attempts.
5. **Decision Engine**:
   - **Safe**: Creates a seamless Razorpay Order (`/orders`).
   - **Flagged (High Value)**: Creates a Razorpay Payment Link (`/payment_links`) for human approval (Human-in-the-loop).
   - **Malicious**: Hard rejects the transaction.
6. **Webhooks (`/razorpay`)**: Async updates from Razorpay are verified for signatures and idempotency cache, then processed.
