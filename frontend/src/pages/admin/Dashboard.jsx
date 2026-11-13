import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import Loading from '../../components/Loading';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/admin/dashboard')
            .then((res) => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Admin Dashboard</h1>
                <p>Platform overview and statistics</p>
            </div>

            <div className="grid-4 mb-page">
                <div className="glass-card stat-card fade-in">
                    <div className="stat-value">{(stats?.totalParticipants || 0).toLocaleString('en-IN')}</div>
                    <div className="stat-label">👥 Participants</div>
                </div>
                <div className="glass-card stat-card fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="stat-value">{(stats?.totalOrganizers || 0).toLocaleString('en-IN')}</div>
                    <div className="stat-label">🏢 Organizers</div>
                </div>
                <div className="glass-card stat-card fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="stat-value">{(stats?.totalEvents || 0).toLocaleString('en-IN')}</div>
                    <div className="stat-label">📋 Events</div>
                </div>
                <div className="glass-card stat-card fade-in" style={{ animationDelay: '0.3s' }}>
                    <div className="stat-value">{(stats?.totalRegistrations || 0).toLocaleString('en-IN')}</div>
                    <div className="stat-label">🎫 Registrations</div>
                </div>
            </div>

            {/* Event breakdown */}
            {stats?.eventsByStatus && (
                <div className="glass-card mb-section">
                    <h3 className="card-title">Events by Status</h3>
                    <div className="cluster" style={{ gap: '0.75rem' }}>
                        {Object.entries(stats.eventsByStatus).map(([status, count]) => {
                            const colors = { draft: 'badge-gray', published: 'badge-green', ongoing: 'badge-blue', completed: 'badge-purple', closed: 'badge-red' };
                            return (
                                <div key={status} className="inset" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.9rem' }}>
                                    <span className={`badge ${colors[status] || 'badge-gray'}`}>{status}</span>
                                    <span style={{ fontWeight: 800, fontSize: 'var(--font-lg)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Pending requests */}
            {stats?.pendingPasswordResets > 0 && (
                <div className="glass-card card-warning">
                    <div className="page-header-row" style={{ alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: 'var(--font-base)' }}>⚠️ Pending Password Resets</h3>
                            <p className="text-sm text-secondary" style={{ marginTop: '0.2rem' }}>
                                {stats.pendingPasswordResets} request{stats.pendingPasswordResets > 1 ? 's' : ''} awaiting your review
                            </p>
                        </div>
                        <Link to="/admin/password-resets" className="btn btn-secondary btn-sm">Review →</Link>
                    </div>
                </div>
            )}
        </div>
    );
}
