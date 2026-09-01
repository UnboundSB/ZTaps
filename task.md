# Project: Zero-Trust Agentic Payment Sentinel (Z-TAPS)
**Target:** Razorpay Buildathon 2026 (Track 01 - AI Growth & Agentic Commerce)
**Developer:** Solo Build
**Deadline:** September 4, 2026

---

## 1. Environment & Architecture (Day 1)
- [ ] Initialize backend repository (Node.js/Express or Python/FastAPI).
- [ ] Configure environment variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
- [ ] Set up local Model Context Protocol (MCP) server instance.
- [ ] Create `catalog.json` synthetic dataset:
  - [ ] Item 1: Standard Item (e.g., ₹2,500).
  - [ ] Item 2: High-Value Item (e.g., ₹85,000 - triggers policy limit).
  - [ ] Item 3: Poisoned Item (Contains embedded prompt injection in description).
- [ ] Create `policy.json` (e.g., `MAX_TRANSACTION_LIMIT = 50000`, `ALLOWED_CATEGORIES = ["electronics"]`).

## 2. Ingress & Interception Layer (Day 2)
- [ ] Define the `create_checkout_order` MCP tool schema (Requires: `item_id`, `quantity`, `amount`).
- [ ] Expose an internal API route to intercept JSON-RPC tool calls from the AI Agent.
- [ ] Build a mock AI Agent script (client-side) to send standard, high-value, and poisoned payloads to the interceptor.
- [ ] Implement initial payload parsing and basic error handling for malformed JSON.

## 3. Deterministic Validation Engine (Day 3)
- [ ] Implement structural validation: Reject payloads containing unauthorized parameters.
- [ ] Implement deterministic business rules:
  - [ ] Calculate `total_value = price × quantity`.
  - [ ] Flag transaction if `total_value > MAX_TRANSACTION_LIMIT`.
  - [ ] Flag transaction if requested price diverges from `catalog.json` (prevent discount hallucination).
- [ ] Implement semantic anomaly detection (Regex/Lightweight LLM judge) to flag hidden commands or system overrides in the payload.

## 4. Razorpay Execution & Escalation (Day 4)
- [ ] Integrate Razorpay official SDK.
- [ ] **Standard Flow (Safe):**
  - [ ] Implement `POST /v1/orders`.
  - [ ] Return `order_id` to the agent for seamless checkout.
- [ ] **Escalation Flow (Flagged/Unsafe):**
  - [ ] Implement `POST /v1/payment_links`.
  - [ ] Generate a notification/link for human-in-the-loop authorization instead of executing the order.
  - [ ] Return `short_url` to the agent.

## 5. Webhooks & Idempotency (Day 5)
- [ ] Expose `/webhook/razorpay` endpoint for asynchronous updates.
- [ ] Implement HMAC SHA-256 signature verification using the raw request body.
- [ ] Extract the `x-razorpay-event-id` header from incoming webhooks.
- [ ] Implement a local idempotency cache (in-memory or SQLite) to block duplicate webhook processing.
- [ ] Write logic to update the transaction state to `CAPTURED` upon receiving the `payment.captured` event.

## 6. Visualization & Metrics (Day 6)
- [x] Build a lightweight CLI logger or static HTML dashboard.
- [x] Ensure the dashboard distinctly visualizes:
  - [x] The raw incoming AI prompt.
  - [x] The intercepted JSON-RPC payload.
  - [x] The policy evaluation result (Approved vs. Blocked).
  - [x] The resulting Razorpay action (Order vs. Payment Link).
- [x] Calculate and display evaluation metrics (Invalid Actions Blocked, System Latency).

## 7. Submission Preparation (Day 7)
- [x] **Code Freeze:** No new features after September 2.
- [x] Write `README.md` (What it is, Why Razorpay needs it, Setup instructions).
- [x] Write `ARCHITECTURE.md` (System data flow diagram).
- [x] Write `SECURITY.md` (Explanation of the prompt injection defense).
- [ ] Record the 5-minute end-to-end demo video:
  - [ ] 0:00 - 1:30: Show safe transaction (Orders API).
  - [ ] 1:30 - 3:15: Show hijacked transaction intercepted (Payment Links API).
  - [ ] 3:15 - 4:15: Show successful webhook resolution.
  - [ ] 4:15 - 5:00: Explain business value to judges.