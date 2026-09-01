async function fetchDashboardData() {
    try {
        const res = await fetch('/api/v1/dashboard/data');
        const data = await res.json();
        
        // Update Metrics
        document.getElementById('metric-total').innerText = data.metrics.total_requests;
        document.getElementById('metric-approved').innerText = data.metrics.approved;
        document.getElementById('metric-escalated').innerText = data.metrics.escalated;
        document.getElementById('metric-rejected').innerText = data.metrics.rejected;
        
        // Update Table
        const tbody = document.getElementById('tx-body');
        tbody.innerHTML = '';
        
        data.transactions.forEach(tx => {
            const tr = document.createElement('tr');
            
            // Format time
            const time = tx.timestamp ? tx.timestamp.split('T')[1].substring(0,8) : 'N/A';
            
            // Format amount
            const amt = `₹${(tx.requested_amount / 100).toLocaleString()}`;
            
            // Determine Action Badge
            let actionBadge = '';
            let actionText = '';
            if (tx.action === 'APPROVED_ORDER') {
                actionBadge = 'safe';
                actionText = 'ORDER_CREATED';
            } else if (tx.action === 'ESCALATED_PAYMENT_LINK') {
                actionBadge = 'escalated';
                actionText = 'PAYMENT_LINK';
            } else {
                actionBadge = 'rejected';
                actionText = 'BLOCKED';
            }
            
            const flags = tx.flags && tx.flags.length > 0 ? tx.flags.join(', ') : 'None';
            
            tr.innerHTML = `
                <td style="color: var(--text-muted)">${time}</td>
                <td><span class="req-id">${tx.request_id.substring(0,8)}</span></td>
                <td>${tx.item_id}</td>
                <td>${amt}</td>
                <td class="flags">${flags}</td>
                <td><span class="badge ${actionBadge}">${actionText}</span></td>
            `;
            tbody.appendChild(tr);
        });
        
    } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
    }
}

// Initial fetch
fetchDashboardData();

// Poll every 1 seconds as requested
setInterval(fetchDashboardData, 1000);

async function simulateScenario(scenario) {
    const resDiv = document.getElementById('simulation-result');
    resDiv.innerText = `Simulating '${scenario}'...`;
    resDiv.style.color = 'var(--text-main)';
    
    try {
        const res = await fetch(`/api/v1/demo/simulate?scenario=${scenario}`, {
            method: 'POST',
            headers: {
                'X-API-Key': 'ztaps-secret-key-1234' // The default API key
            }
        });
        
        const data = await res.json();
        
        if (res.ok) {
            if (data.status === 'approved') {
                resDiv.style.color = 'var(--success)';
            } else if (data.status === 'rejected') {
                resDiv.style.color = 'var(--danger)';
            } else {
                resDiv.style.color = 'var(--warning)';
            }
            resDiv.innerText = `Result: [${data.status.toUpperCase()}] ${data.reason}`;
        } else {
            resDiv.style.color = 'var(--danger)';
            resDiv.innerText = `Error: ${JSON.stringify(data)}`;
        }
        
        // Force an immediate refresh of the dashboard
        fetchDashboardData();
    } catch (err) {
        resDiv.style.color = 'var(--danger)';
        resDiv.innerText = `Failed to simulate: ${err.message}`;
    }
}
