import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import Loading from '../../components/Loading';

export default function OngoingEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/organizer/dashboard')
            .then((res) => {
                const all = res.data.events || [];
                setEvents(all.filter((e) => e.status === 'published' || e.status === 'ongoing'));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loading />;

    const statusColors = { published: 'badge-green', ongoing: 'badge-blue' };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Active Events</h1>
                <p>Your published and ongoing events</p>
            </div>

            {events.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">📭</div>
                    <p>No active events</p>
                    <Link to="/organizer/events/create" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Event</Link>
                </div>
            ) : (
                <div className="stack">
                    {events.map((event) => (
                        <Link key={event._id} to={`/organizer/events/${event._id}`} className="glass-card list-row fade-in">
                            <div>
                                <div className="cluster" style={{ marginBottom: '0.6rem' }}>
                                    <span className={`badge ${statusColors[event.status]}`}>{event.status}</span>
                                    <span className={`badge ${event.type === 'merchandise' ? 'badge-yellow' : 'badge-purple'}`}>{event.type}</span>
                                </div>
                                <h3>{event.name}</h3>
                                <div className="meta-row">
                                    <span>👥 {event.registrationCount || 0} registrations</span>
                                    <span>📅 {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <span className="btn btn-secondary btn-sm">Manage →</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
