import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/v1/dashboard/data', {
        headers: {
          'X-API-Key': 'dummy_api_key_for_testing'
        }
      });
      if (response.data && response.data.transactions) {
        setLogs(response.data.transactions);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 5 seconds
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-4xl font-bold mb-8 text-center text-[var(--text-primary)]">Live Audit Trail</h2>
      <div className="glass-panel w-full p-6">
        <div className="w-full overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-[var(--text-secondary)]">Loading securely audited data...</div>
          ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-[var(--bg-secondary)]">
                  <th className="p-4 text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-xs">Timestamp</th>
                  <th className="p-4 text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-xs">Request ID</th>
                  <th className="p-4 text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-xs">Action</th>
                  <th className="p-4 text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-xs">Amount</th>
                  <th className="p-4 text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-[var(--text-secondary)]">No recent transactions found.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.request_id} className="border-b border-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="p-4 font-mono text-sm text-[var(--text-secondary)]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-4 text-[var(--color-primary)] font-mono font-medium">{log.request_id.substring(0, 8)}</td>
                      <td className="p-4 text-[var(--text-primary)] font-medium">{log.action || 'Payment'}</td>
                      <td className="p-4 text-[var(--text-primary)] font-medium">₹{(log.requested_amount / 100).toFixed(2)}</td>
                      <td className="p-4">
                        {log.action === 'REJECTED' ? (
                          <span className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold shadow-sm">
                            BLOCKED
                          </span>
                        ) : log.action === 'ESCALATED_PAYMENT_LINK' ? (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold shadow-sm">
                            PENDING
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold shadow-sm">
                            APPROVED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
