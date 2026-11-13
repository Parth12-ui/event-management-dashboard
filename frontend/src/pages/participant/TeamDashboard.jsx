import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Loading from '../../components/Loading';

export default function TeamDashboard() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/teams/my')
            .then((r) => setTeams(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    const teamBadge = { complete: 'badge-green', forming: 'badge-yellow', closed: 'badge-purple' };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>My Teams</h1>
                <p>Teams you lead or belong to</p>
            </div>

            {teams.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">👥</div>
                    <p>You haven't joined any teams yet.</p>
                    <p className="text-xs" style={{ marginTop: '0.25rem' }}>Open a team event and create or join a team.</p>
                    <Link to="/browse" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse Events</Link>
                </div>
            ) : (
                <div className="card-grid">
                    {teams.map((team) => (
                        <Link key={team._id} to={`/teams/${team._id}`} className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column', color: 'inherit' }}>
                            <div className="page-header-row" style={{ alignItems: 'center', marginBottom: '0.75rem' }}>
                                <h3 style={{ fontSize: 'var(--font-lg)' }}>{team.name}</h3>
                                <span className={`badge ${teamBadge[team.status] || 'badge-red'}`}>{team.status}</span>
                            </div>
                            <div className="stack" style={{ gap: '0.3rem', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                                <span>📅 {team.event?.name || 'Unknown Event'}</span>
                                <span>👥 {team.members?.length || 0}/{team.maxSize} members</span>
                                <span className="text-xs text-muted">Leader: {team.leader?.firstName} {team.leader?.lastName}</span>
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '1rem' }}>
                                <span className="code-chip"><span className="code-label">Invite</span>{team.inviteCode}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
