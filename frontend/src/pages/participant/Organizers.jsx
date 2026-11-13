import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import Loading from '../../components/Loading';

export default function Organizers() {
    const [organizers, setOrganizers] = useState([]);
    const [followedIds, setFollowedIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            API.get('/participants/organizers'),
            API.get('/participants/profile'),
        ]).then(([orgRes, profileRes]) => {
            setOrganizers(orgRes.data);
            setFollowedIds((profileRes.data.followedOrganizers || []).map(o => o._id || o));
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    const toggleFollow = async (orgId) => {
        try {
            const res = await API.post(`/participants/organizers/${orgId}/follow`);
            if (res.data.isFollowing) {
                setFollowedIds([...followedIds, orgId]);
            } else {
                setFollowedIds(followedIds.filter((id) => id !== orgId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <Loading />;

    const categoryLabels = { club: '🎭 Club', council: '🏛️ Council', fest_team: '🎉 Fest Team' };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Clubs & Organizers</h1>
                <p>Discover and follow your favorite clubs</p>
            </div>

            {organizers.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">🏢</div>
                    <p>No organizers found</p>
                </div>
            ) : (
                <div className="card-grid">
                    {organizers.map((org) => (
                        <div key={org._id} className="glass-card fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="page-header-row" style={{ alignItems: 'center', marginBottom: '0.9rem' }}>
                                <span className="badge badge-purple">{categoryLabels[org.category] || org.category}</span>
                                <button
                                    className={`btn btn-sm ${followedIds.includes(org._id) ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => toggleFollow(org._id)}
                                >
                                    {followedIds.includes(org._id) ? '✓ Following' : '+ Follow'}
                                </button>
                            </div>

                            <Link to={`/organizers/${org._id}`} className="event-card" style={{ height: 'auto' }}>
                                <h3>{org.name}</h3>
                                <p className="event-card-desc" style={{ marginBottom: 0 }}>
                                    {org.description || 'No description'}
                                </p>
                            </Link>

                            <div style={{ flex: 1, minHeight: '0.75rem' }} />
                            {org.contactEmail && (
                                <div className="event-card-meta" style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
                                    📧 {org.contactEmail}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
