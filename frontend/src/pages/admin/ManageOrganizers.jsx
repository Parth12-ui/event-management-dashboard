import { useState, useEffect } from 'react';
import API from '../../api/axios';
import Loading from '../../components/Loading';

export default function ManageOrganizers() {
    const [organizers, setOrganizers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', category: 'club', description: '', contactEmail: '' });
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [newCreds, setNewCreds] = useState(null);

    const fetchOrganizers = async () => {
        try {
            const res = await API.get('/admin/organizers');
            setOrganizers(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOrganizers(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await API.post('/admin/organizers', createForm);
            setNewCreds(res.data.credentials || res.data);
            setMessage({ type: 'success', text: 'Organizer created successfully!' });
            setCreateForm({ name: '', category: 'club', description: '', contactEmail: '' });
            fetchOrganizers();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed' });
        } finally {
            setCreating(false);
        }
    };

    const handleToggle = async (id) => {
        try {
            await API.put(`/admin/organizers/${id}/disable`);
            fetchOrganizers();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Permanently delete this organizer? This cannot be undone.')) return;
        try {
            await API.delete(`/admin/organizers/${id}`);
            setOrganizers(organizers.filter((o) => o._id !== id));
        } catch (err) { console.error(err); }
    };

    if (loading) return <Loading />;

    const categoryLabels = { club: '🎭 Club', council: '🏛️ Council', fest_team: '🎉 Fest Team' };

    return (
        <div className="page-container">
            <div className="page-header page-header-row">
                <div>
                    <h1>Manage Organizers</h1>
                    <p>Create, disable, or delete organizer accounts</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
                    {showCreate ? '✕ Close' : '+ Create Organizer'}
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="glass-card fade-in mb-section">
                    <h3 className="card-title">Create New Organizer</h3>
                    {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
                    {newCreds && (
                        <div className="alert alert-success">
                            <strong>Auto-generated credentials</strong>
                            <div className="info-list" style={{ margin: '0.5rem 0' }}>
                                <div><span className="k">Email</span><span className="v mono">{newCreds.loginEmail || newCreds.email}</span></div>
                                <div><span className="k">Password</span><span className="v mono">{newCreds.password}</span></div>
                            </div>
                            <span className="text-xs">These have been emailed to the contact email.</span>
                        </div>
                    )}
                    <form onSubmit={handleCreate}>
                        <div className="form-row cols-2-1">
                            <div className="form-group">
                                <label>Organization Name *</label>
                                <input className="form-input" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} required placeholder="Coding Club" />
                            </div>
                            <div className="form-group">
                                <label>Category *</label>
                                <select className="form-input" value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}>
                                    <option value="club">Club</option>
                                    <option value="council">Council</option>
                                    <option value="fest_team">Fest Team</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Contact Email</label>
                            <input type="email" className="form-input" value={createForm.contactEmail} onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })} placeholder="club@iiit.ac.in" />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea className="form-input" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} rows={2} placeholder="Brief description of the organization" />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={creating}>
                            {creating ? 'Creating...' : '🚀 Create Organizer'}
                        </button>
                    </form>
                </div>
            )}

            {/* Organizers Table */}
            {organizers.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">🏢</div>
                    <p>No organizers yet</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Login Email</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {organizers.map((org) => (
                                <tr key={org._id}>
                                    <td style={{ fontWeight: 600 }}>{org.name}</td>
                                    <td><span className="badge badge-purple">{categoryLabels[org.category] || org.category}</span></td>
                                    <td className="mono text-muted">{org.loginEmail}</td>
                                    <td>
                                        <span className={`badge ${org.isActive ? 'badge-green' : 'badge-red'}`}>
                                            {org.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="cluster" style={{ gap: '0.375rem', flexWrap: 'nowrap' }}>
                                            <button className={`btn btn-sm ${org.isActive ? 'btn-secondary' : 'btn-success'}`} onClick={() => handleToggle(org._id)}>
                                                {org.isActive ? 'Disable' : 'Enable'}
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(org._id)}>
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
