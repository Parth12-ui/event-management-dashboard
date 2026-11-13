import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api/axios';
import EventCard from '../../components/EventCard';
import Loading from '../../components/Loading';

export default function OrganizerDetail() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get(`/participants/organizers/${id}`)
            .then((res) => {
                setData(res.data);
                setIsFollowing(res.data.isFollowing);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const toggleFollow = async () => {
        try {
            const res = await API.post(`/participants/organizers/${id}/follow`);
            setIsFollowing(res.data.isFollowing);
        } catch (err) { console.error(err); }
    };

    if (loading) return <Loading />;
    if (!data) return <div className="page-container"><div className="empty-state"><p>Organizer not found</p></div></div>;

    const { organizer, upcomingEvents, pastEvents } = data;
    const displayEvents = activeTab === 'upcoming' ? upcomingEvents : pastEvents;
    const categoryLabels = { club: '🎭 Club', council: '🏛️ Council', fest_team: '🎉 Fest Team' };

    return (
        <div className="page-container">
            <div className="fade-in">
                <div className="glass-card mb-page" style={{ padding: '2rem' }}>
                    <div className="page-header-row">
                        <div>
                            <span className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>{categoryLabels[organizer.category] || organizer.category}</span>
                            <h1 className="page-title">{organizer.name}</h1>
                            <p className="text-secondary" style={{ marginTop: '0.5rem', maxWidth: '62ch' }}>{organizer.description || 'No description'}</p>
                            {organizer.contactEmail && (
                                <p style={{ marginTop: '0.5rem', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>📧 {organizer.contactEmail}</p>
                            )}
                        </div>
                        <button className={`btn ${isFollowing ? 'btn-primary' : 'btn-secondary'}`} onClick={toggleFollow}>
                            {isFollowing ? '✓ Following' : '+ Follow'}
                        </button>
                    </div>
                </div>

                <div className="tabs">
                    <button className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
                        Upcoming ({upcomingEvents.length})
                    </button>
                    <button className={`tab ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
                        Past ({pastEvents.length})
                    </button>
                </div>

                {displayEvents.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">📭</div>
                        <p>No {activeTab} events</p>
                    </div>
                ) : (
                    <div className="card-grid">
                        {displayEvents.map((e) => <EventCard key={e._id} event={e} linkPrefix="/browse" />)}
                    </div>
                )}
            </div>
        </div>
    );
}
