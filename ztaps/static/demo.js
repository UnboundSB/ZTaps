const chatHistory = document.getElementById('chat-history');
const logStream = document.getElementById('log-stream');
const inputField = document.getElementById('chat-input');

function fillPrompt(text, overrides = {}) {
    inputField.value = text;
    if (overrides.amount) document.getElementById('cfg-amount').value = overrides.amount;
    if (overrides.item_id) document.getElementById('cfg-item').value = overrides.item_id;
    if (overrides.category) document.getElementById('cfg-category').value = overrides.category;
    inputField.focus();
}

function handleEnter(e) {
    if (e.key === 'Enter') sendMessage();
}

function addMessage(sender, text) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    div.innerHTML = `
        <div class="avatar">${sender === 'user' ? 'U' : 'AI'}</div>
        <div class="bubble">${text}</div>
    `;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function addLog(type, content) {
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString();
    div.innerHTML = `
        <div class="log-time">${time}</div>
        <div class="log-content">${content}</div>
    `;
    logStream.appendChild(div);
    logStream.scrollTop = logStream.scrollHeight;
}

async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    inputField.value = '';
    addMessage('user', text);

    // Mock AI thinking
    setTimeout(() => {
        addMessage('ai', "Understood. Generating purchase intent payload...");
        
        // Fetch values from the manual configuration panel
        let payload = {
            agent_id: document.getElementById('cfg-agent').value.trim() || "agent_001",
            item_id: document.getElementById('cfg-item').value.trim() || "ITEM_STD_001",
            quantity: parseInt(document.getElementById('cfg-qty').value) || 1,
            item_category: document.getElementById('cfg-category').value.trim() || "software",
            amount: parseInt(document.getElementById('cfg-amount').value) || 250000,
            justification: text
        };

        setTimeout(() => {
            sendToZTaps(payload);
        }, 800);
        
    }, 600);
}

async function sendToZTaps(payload) {
    addLog('system', `Intercepted outgoing payload:<br/><code>${JSON.stringify(payload)}</code>`);
    
    try {
        const res = await fetch('/api/v1/agent/intercept', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'ztaps-secret-key-1234'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (data.status === 'approved') {
            addLog('approved', `<strong>[ACCEPTED]</strong> ${data.reason}<br/>Order ID: ${data.transaction_id}`);
            addMessage('ai', `Purchase successful. Order ID: ${data.transaction_id}`);
        } else if (data.status === 'escalated') {
            addLog('escalated', `<strong>[ESCALATED]</strong> ${data.reason}<br/>Payment Link generated for human review.`);
            addMessage('ai', `The purchase amount requires human approval. A payment link has been generated.`);
        } else {
            addLog('rejected', `<strong>[BLOCKED]</strong> ${data.reason}`);
            addMessage('ai', `Transaction blocked by Z-TAPS security layer.`);
        }
    } catch (err) {
        addLog('rejected', `<strong>[ERROR]</strong> Gateway failure: ${err.message}`);
    }
}
