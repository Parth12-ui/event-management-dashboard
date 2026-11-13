import { Link } from 'react-router-dom';

const statusColors = {
    draft: 'badge-gray',
    published: 'badge-green',
    ongoing: 'badge-blue',
    completed: 'badge-purple',
    closed: 'badge-red',
};

const typeLabels = {
    normal: '📋 Event',
    merchandise: '🛍️ Merch',
};

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA';

export default function EventCard({ event, linkPrefix = '/browse' }) {
    const orgName = event.organizer?.name || 'Unknown Organizer';
    const fee = event.registrationFee || 0;

    return (
        <Link to={`${linkPrefix}/${event._id}`} className="glass-card event-card fade-in">
            <div className="event-card-top">
                <span className={`badge ${statusColors[event.status] || 'badge-gray'}`}>{event.status}</span>
                <span className="event-card-type">{typeLabels[event.type] || event.type}</span>
            </div>

            <h3>{event.name}</h3>
            <p className="event-card-desc">{event.description || 'No description'}</p>

            {event.tags && event.tags.length > 0 && (
                <div className="tag-chips" style={{ marginBottom: '1rem' }}>
                    {event.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="tag-chip">{tag}</span>
                    ))}
                </div>
            )}

            <div className="event-card-meta">
                <span title={orgName}>👤 {orgName}</span>
                <span>📅 {formatDate(event.startDate)}</span>
                <span className={`event-card-fee ${fee > 0 ? '' : 'free'}`}>{fee > 0 ? `₹${fee}` : 'Free'}</span>
            </div>
        </Link>
    );
}
