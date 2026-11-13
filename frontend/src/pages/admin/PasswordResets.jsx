import { useState, useEffect } from 'react';
import API from '../../api/axios';
import Loading from '../../components/Loading';

export default function PasswordResets() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [comments, setComments] = useState({});
    const [newPasswordModal, setNewPasswordModal] = useState(null);

    useEffect(() => {
        API.get('/admin/password-resets')
            .then((res) => setRequests(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleApprove = async (id) => {
        try {
            const res = await API.post(`/admin/password-resets/${id}/approve`, {
                comment: comments[id] || '',
            });
            setNewPasswordModal(res.data.newPassword);
            setRequests(requests.map((r) =>
                r._id === id ? { ...r, status: 'approved', adminComment: comments[id] || '', resolvedAt: new Date().toISOString() } : r
            ));
            setMessage({ type: 'success', text: 'Password reset approved!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
        }
    };

    const handleReject = async (id) => {
        try {
            await API.post(`/admin/password-resets/${id}/reject`, {
                comment: comments[id] || '',
            });
            setRequests(requests.map((r) =>
                r._id === id ? { ...r, status: 'rejected', adminComment: comments[id] || '', resolvedAt: new Date().toISOString() } : r
            ));
            setMessage({ type: 'success', text: 'Password reset request rejected.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
        }
    };

    if (loading) return <Loading />;

    const pending = requests.filter((r) => r.status === 'pending');
    const resolved = requests.filter((r) => r.status !== 'pending');

    const categoryLabels = { club: '🎭 Club', council: '🏛️ Council', fest_team: '🎉 Fest Team' };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Password Reset Requests</h1>
                <p>Review and manage organizer password reset requests</p>
            </div>

            {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

            {/* New Password Modal */}
            {newPasswordModal && (
                <div className="modal-overlay"
                    onClick={() => setNewPasswordModal(null)}
                >
                    <div className="modal-content" role="dialog" aria-modal="true" style={{ maxWidth: 420, padding: '1.75rem', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <h3 className="card-title" style={{ color: '#6be3ad', marginBottom: '0.5rem' }}>✅ Password Reset Approved</h3>
                        <p className="text-sm text-secondary" style={{ marginBottom: '1.25rem' }}>
                            The new password has been auto-generated. Please share it with the organizer securely.
                        </p>
                        <span className="code-display" style={{ fontSize: '1.35rem', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>{newPasswordModal}</span>
                        <button className="btn btn-primary" onClick={() => {
                            navigator.clipboard.writeText(newPasswordModal);
                            setNewPasswordModal(null);
                        }}>
                            📋 Copy & Close
                        </button>
                    </div>
                </div>
            )}

            {/* Pending Requests */}
            <h2 className="section-title">Pending <span className="count">{pending.length}</span></h2>

            {pending.length === 0 ? (
                <div className="empty-state mb-page" style={{ padding: '2rem' }}>
                    <p>✅ No pending requests</p>
                </div>
            ) : (
                <div className="stack mb-page">
                    {pending.map((req) => (
                        <div key={req._id} className="glass-card fade-in stack-lg">
                            <div className="page-header-row">
                                <div>
                                    <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600 }}>{req.organizer?.name || 'Unknown'}</h3>
                                    <div className="meta-row">
                                        <span>🏷️ {categoryLabels[req.organizer?.category] || req.organizer?.category || 'N/A'}</span>
                                        <span>📧 {req.organizer?.loginEmail}</span>
                                        <span>📅 {new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <span className="badge badge-warning">Pending</span>
                            </div>

                            {req.reason && (
                                <div className="callout">
                                    <span className="callout-label">Reason</span>
                                    <p className="text-sm text-secondary">{req.reason}</p>
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Admin Comment <span className="label-note">(optional)</span></label>
                                <textarea
                                    className="form-input"
                                    rows={2}
                                    value={comments[req._id] || ''}
                                    onChange={(e) => setComments({ ...comments, [req._id]: e.target.value })}
                                    placeholder="Add a comment for approval/rejection..."
                                />
                            </div>

                            <div className="cluster" style={{ justifyContent: 'flex-end' }}>
                                <button className="btn btn-success btn-sm" onClick={() => handleApprove(req._id)}>✓ Approve</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleReject(req._id)}>✕ Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Resolved History */}
            {resolved.length > 0 && (
                <>
                    <h2 className="section-title">Resolved <span className="count">{resolved.length}</span></h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Organizer</th>
                                    <th>Category</th>
                                    <th>Requested</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Admin Comment</th>
                                    <th>Resolved</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resolved.map((req) => (
                                    <tr key={req._id}>
                                        <td>{req.organizer?.name || 'Unknown'}</td>
                                        <td>{categoryLabels[req.organizer?.category] || req.organizer?.category || '—'}</td>
                                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.reason || '—'}</td>
                                        <td>
                                            <span className={`badge ${req.status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                                                {req.status === 'approved' ? 'Approved' : 'Rejected'}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.adminComment || '—'}</td>
                                        <td>{req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString() : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
