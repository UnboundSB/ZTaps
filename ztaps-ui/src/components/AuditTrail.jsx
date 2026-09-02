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
      <div className="claymorphic-panel w-full p-8 mb-8">
        <div className="w-full overflow-x-auto p-4">
          {loading ? (
            <div className="text-center py-10 text-[var(--text-secondary)] font-medium">Loading securely audited data...</div>
          ) : (
              <table className="w-full text-left border-separate border-spacing-y-4 min-w-[800px]">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">Timestamp</th>
                  <th className="px-6 py-4 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">Request ID</th>
                  <th className="px-6 py-4 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">Action</th>
                  <th className="px-6 py-4 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">Amount</th>
                  <th className="px-6 py-4 text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-[var(--text-secondary)]">No recent transactions found.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.request_id} className="claymorphic-row hover:scale-[1.01] transition-transform duration-300">
                      <td className="claymorphic-cell px-6 py-5 font-mono text-sm text-[var(--text-secondary)]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="claymorphic-cell px-6 py-5 text-[var(--color-primary)] font-mono font-bold">{log.request_id.substring(0, 8)}</td>
                      <td className="claymorphic-cell px-6 py-5 text-[var(--text-primary)] font-semibold">{log.action || 'Payment'}</td>
                      <td className="claymorphic-cell px-6 py-5 text-[var(--text-primary)] font-bold">₹{(log.requested_amount / 100).toFixed(2)}</td>
                      <td className="claymorphic-cell px-6 py-5">
                        {log.action === 'REJECTED' ? (
                          <span className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold shadow-[inset_2px_2px_4px_rgba(255,0,0,0.1),_inset_-2px_-2px_4px_rgba(0,0,0,0.05)] border border-red-500/20">
                            BLOCKED
                          </span>
                        ) : log.action === 'ESCALATED_PAYMENT_LINK' ? (
                          <span className="px-4 py-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-bold shadow-[inset_2px_2px_4px_rgba(255,200,0,0.1),_inset_-2px_-2px_4px_rgba(0,0,0,0.05)] border border-yellow-500/20">
                            PENDING
                          </span>
                        ) : (
                          <span className="px-4 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold shadow-[inset_2px_2px_4px_rgba(0,255,0,0.1),_inset_-2px_-2px_4px_rgba(0,0,0,0.05)] border border-emerald-500/20">
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
