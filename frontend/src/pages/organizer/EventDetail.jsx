import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import Loading from '../../components/Loading';
import Forum from '../../components/Forum';

export default function EventDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });
    const [partSearch, setPartSearch] = useState('');

    useEffect(() => {
        Promise.all([
            API.get(`/organizer/events/${id}`),
            API.get(`/organizer/events/${id}/participants`),
        ]).then(([eventRes, partRes]) => {
            setEvent(eventRes.data.event || eventRes.data);
            setParticipants(partRes.data.participants || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, [id]);

    const handlePublish = async () => {
        try {
            const res = await API.put(`/organizer/events/${id}/publish`);
            setEvent(res.data.event || { ...event, status: 'published' });
            setMessage({ type: 'success', text: 'Event published!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to publish' });
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const res = await API.put(`/organizer/events/${id}/close`, { newStatus });
            setEvent(res.data.event || { ...event, status: newStatus });
            setMessage({ type: 'success', text: `Status changed to ${newStatus}` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change status' });
        }
    };

    const startEditing = () => {
        const base = {};
        if (event.status === 'draft') {
            // Draft: all fields editable
            base.name = event.name || '';
            base.description = event.description || '';
            base.type = event.type || 'normal';
            base.eligibility = event.eligibility || 'all';
            base.startDate = event.startDate ? event.startDate.split('T')[0] : '';
            base.endDate = event.endDate ? event.endDate.split('T')[0] : '';
            base.registrationDeadline = event.registrationDeadline ? event.registrationDeadline.split('T')[0] : '';
            base.registrationLimit = event.registrationLimit || 0;
            base.registrationFee = event.registrationFee || 0;
            base.tags = (event.tags || []).join(', ');
            base.isTeamEvent = event.isTeamEvent || false;
            base.minTeamSize = event.teamSize?.min || 2;
            base.maxTeamSize = event.teamSize?.max || 4;
        } else if (event.status === 'published') {
            // Published: only description, deadline, reg limit
            base.description = event.description || '';
            base.registrationDeadline = event.registrationDeadline ? event.registrationDeadline.split('T')[0] : '';
            base.registrationLimit = event.registrationLimit || 0;
        }
        setEditForm(base);
        setEditing(true);
    };

    const handleSaveEdit = async () => {
        try {
            const payload = { ...editForm };
            // Process tags for draft
            if (event.status === 'draft' && typeof payload.tags === 'string') {
                payload.tags = payload.tags.split(',').map(t => t.trim()).filter(Boolean);
            }
            if (event.status === 'draft' && payload.isTeamEvent) {
                payload.teamSize = { min: Number(payload.minTeamSize), max: Number(payload.maxTeamSize) };
            }
            delete payload.minTeamSize;
            delete payload.maxTeamSize;
            if (payload.registrationLimit !== undefined) payload.registrationLimit = Number(payload.registrationLimit);
            if (payload.registrationFee !== undefined) payload.registrationFee = Number(payload.registrationFee);

            const res = await API.put(`/organizer/events/${id}`, payload);
            setEvent(res.data.event);
            setEditing(false);
            setMessage({ type: 'success', text: 'Event updated!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update' });
        }
    };

    const handleCSV = async () => {
        try {
            const res = await API.get(`/organizer/events/${id}/participants`, {
                params: { format: 'csv' },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `participants_${id}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <Loading />;
    if (!event) return <div className="page-container"><div className="empty-state"><p>Event not found</p></div></div>;

    const statusColors = { draft: 'badge-gray', published: 'badge-green', ongoing: 'badge-blue', completed: 'badge-purple', closed: 'badge-red' };
    const canEdit = event.status === 'draft' || event.status === 'published';

    const filteredParticipants = participants.filter((p) => {
        if (!partSearch) return true;
        const q = partSearch.toLowerCase();
        const firstName = p.participant?.firstName || '';
        const lastName = p.participant?.lastName || '';
        const email = p.participant?.email || '';
        return firstName.toLowerCase().includes(q) || lastName.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });

    const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

    return (
        <div className="page-container">
            <div className="fade-in">
                {/* Header */}
                <div className="page-header page-header-row">
                    <div>
                        <div className="cluster" style={{ marginBottom: '0.75rem' }}>
                            <span className={`badge ${statusColors[event.status]}`}>{event.status}</span>
                            <span className={`badge ${event.type === 'merchandise' ? 'badge-yellow' : 'badge-purple'}`}>{event.type}</span>
                            {event.isTeamEvent && <span className="badge badge-cyan">👥 Team</span>}
                        </div>
                        <h1>{event.name}</h1>
                    </div>
                    <div className="cluster">
                        {event.status === 'draft' && <button className="btn btn-success" onClick={handlePublish}>🚀 Publish</button>}
                        {event.status === 'published' && <button className="btn btn-primary" onClick={() => handleStatusChange('ongoing')}>▶ Start Event</button>}
                        {event.status === 'ongoing' && <button className="btn btn-primary" onClick={() => handleStatusChange('completed')}>✓ Complete</button>}
                        {(event.status === 'published' || event.status === 'ongoing') && <button className="btn btn-danger" onClick={() => handleStatusChange('closed')}>✕ Close</button>}
                        {canEdit && !editing && <button className="btn btn-secondary" onClick={startEditing}>✏️ Edit</button>}
                    </div>
                </div>

                {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                {/* Edit Panel */}
                {editing && (
                    <div className="glass-card mb-section">
                        <h3 className="card-title">
                            Edit Event {event.status === 'published' && <span className="label-note">(limited — event is published)</span>}
                        </h3>

                        {event.status === 'draft' && (
                            <>
                                <div className="form-group">
                                    <label>Name</label>
                                    <input name="name" className="form-input" value={editForm.name || ''} onChange={handleEditChange} />
                                </div>
                                <div className="form-row cols-2">
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select name="type" className="form-input" value={editForm.type || 'normal'} onChange={handleEditChange}>
                                            <option value="normal">Normal</option>
                                            <option value="merchandise">Merchandise</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Eligibility</label>
                                        <select name="eligibility" className="form-input" value={editForm.eligibility || 'all'} onChange={handleEditChange}>
                                            <option value="all">Open to All</option>
                                            <option value="iiit">IIIT Only</option>
                                            <option value="non-iiit">Non-IIIT Only</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row cols-3">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input name="startDate" type="date" className="form-input" value={editForm.startDate || ''} onChange={handleEditChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input name="endDate" type="date" className="form-input" value={editForm.endDate || ''} onChange={handleEditChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Reg. Deadline</label>
                                        <input name="registrationDeadline" type="date" className="form-input" value={editForm.registrationDeadline || ''} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="form-row cols-2">
                                    <div className="form-group">
                                        <label>Reg. Limit (0 = unlimited)</label>
                                        <input name="registrationLimit" type="number" className="form-input" value={editForm.registrationLimit ?? 0} onChange={handleEditChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Reg. Fee (₹)</label>
                                        <input name="registrationFee" type="number" className="form-input" value={editForm.registrationFee ?? 0} onChange={handleEditChange} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Tags (comma-separated)</label>
                                    <input name="tags" className="form-input" value={editForm.tags || ''} onChange={handleEditChange} />
                                </div>
                                <label className="check-label" style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: editForm.isTeamEvent ? '0.75rem' : '1rem' }}>
                                    <input type="checkbox" checked={editForm.isTeamEvent || false} onChange={(e) => setEditForm({ ...editForm, isTeamEvent: e.target.checked })} />
                                    👥 Team Event
                                </label>
                                {editForm.isTeamEvent && (
                                    <div className="form-row cols-2" style={{ marginBottom: '1rem' }}>
                                        <div className="form-group">
                                            <label>Min Team Size</label>
                                            <input name="minTeamSize" type="number" className="form-input" min="2" value={editForm.minTeamSize ?? 2} onChange={handleEditChange} />
                                        </div>
                                        <div className="form-group">
                                            <label>Max Team Size</label>
                                            <input name="maxTeamSize" type="number" className="form-input" min="2" value={editForm.maxTeamSize ?? 4} onChange={handleEditChange} />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Fields available for published events */}
                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" className="form-input" value={editForm.description || ''} onChange={handleEditChange} rows={3} />
                        </div>
                        {event.status === 'published' && (
                            <div className="form-row cols-2">
                                <div className="form-group">
                                    <label>Reg. Deadline {event.status === 'published' && <span className="label-note">(can only extend)</span>}</label>
                                    <input name="registrationDeadline" type="date" className="form-input" value={editForm.registrationDeadline || ''} onChange={handleEditChange} />
                                </div>
                                <div className="form-group">
                                    <label>Reg. Limit {event.status === 'published' && <span className="label-note">(can only increase)</span>}</label>
                                    <input name="registrationLimit" type="number" className="form-input" value={editForm.registrationLimit ?? 0} onChange={handleEditChange} />
                                </div>
                            </div>
                        )}

                        <div className="cluster" style={{ marginTop: '0.5rem' }}>
                            <button className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid-4 mb-page">
                    <div className="glass-card stat-card">
                        <div className="stat-value">{event.registrationCount || 0}</div>
                        <div className="stat-label">Registrations</div>
                    </div>
                    <div className="glass-card stat-card">
                        <div className="stat-value">₹{(event.totalRevenue || 0).toLocaleString('en-IN')}</div>
                        <div className="stat-label">Revenue</div>
                    </div>
                    <div className="glass-card stat-card">
                        <div className="stat-value">{event.registrationsLast24h || 0}</div>
                        <div className="stat-label">Last 24h</div>
                    </div>
                    <div className="glass-card stat-card">
                        <div className="stat-value">{event.attendanceCount || 0}</div>
                        <div className="stat-label">Attendance</div>
                    </div>
                </div>

                {/* Event Info */}
                <div className="glass-card mb-section">
                    <h3 className="card-title">Event Details</h3>
                    <p className="text-secondary" style={{ whiteSpace: 'pre-wrap', marginBottom: '1.25rem' }}>{event.description || 'No description'}</p>
                    <div className="info-grid">
                        <div><span className="k">Starts</span>{new Date(event.startDate).toLocaleDateString()}</div>
                        <div><span className="k">Ends</span>{new Date(event.endDate).toLocaleDateString()}</div>
                        <div><span className="k">Reg. deadline</span>{new Date(event.registrationDeadline).toLocaleDateString()}</div>
                        <div><span className="k">Fee</span>{event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</div>
                        <div><span className="k">Limit</span>{event.registrationLimit || 'Unlimited'}</div>
                        <div><span className="k">Eligibility</span>{event.eligibility}</div>
                        {event.isTeamEvent && <div><span className="k">Team size</span>{event.teamSize?.min || 2}–{event.teamSize?.max || 4} members</div>}
                    </div>
                </div>

                {/* Quick Links */}
                <div className="cluster mb-section" style={{ gap: '0.75rem' }}>
                    {event.type === 'merchandise' && (
                        <Link to={`/organizer/events/${id}/merch-orders`} className="btn btn-secondary btn-sm">🛍️ Merch Orders</Link>
                    )}
                    <Link to={`/organizer/events/${id}/feedback`} className="btn btn-secondary btn-sm">⭐ Feedback</Link>
                </div>

                {/* Participants Table */}
                <div className="glass-card">
                    <div className="page-header-row" style={{ alignItems: 'center', marginBottom: '1rem', gap: '0.75rem' }}>
                        <h3 className="section-title" style={{ marginBottom: 0 }}>Participants <span className="count">{filteredParticipants.length}</span></h3>
                        <div className="cluster">
                            <input className="form-input" placeholder="Search name or email…" value={partSearch} onChange={(e) => setPartSearch(e.target.value)} style={{ width: 220, maxWidth: '100%' }} />
                            <button className="btn btn-secondary btn-sm" onClick={handleCSV}>📥 CSV</button>
                        </div>
                    </div>

                    {filteredParticipants.length === 0 ? (
                        <p className="empty-state" style={{ padding: '2rem', fontSize: 'var(--font-sm)' }}>No participants yet</p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Ticket ID</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredParticipants.map((p) => (
                                        <tr key={p._id}>
                                            <td style={{ fontWeight: 600 }}>{p.participant?.firstName} {p.participant?.lastName}</td>
                                            <td className="text-secondary">{p.participant?.email}</td>
                                            <td className="mono">{p.ticketId}</td>
                                            <td><span className={`badge ${p.status === 'confirmed' ? 'badge-green' : 'badge-yellow'}`}>{p.status}</span></td>
                                            <td>{new Date(p.registeredAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Forum Section */}
                <div style={{ marginTop: '1.5rem' }}>
                    <Forum eventId={id} isOrganizer={true} />
                </div>
            </div>
        </div>
    );
}
