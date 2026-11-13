import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import Loading from '../../components/Loading';
import Forum from '../../components/Forum';

export default function EventDetail() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isEligible, setIsEligible] = useState(true);
    const [registration, setRegistration] = useState(null);
    const [formResponses, setFormResponses] = useState({});
    const [merchSelections, setMerchSelections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [teamName, setTeamName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [showJoinTeam, setShowJoinTeam] = useState(false);

    // Feedback state
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackHover, setFeedbackHover] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackAnonymous, setFeedbackAnonymous] = useState(true);

    // Payment proof state
    const [paymentFile, setPaymentFile] = useState(null);
    const [uploadingProof, setUploadingProof] = useState(false);

    // Ticket full view
    const [ticketData, setTicketData] = useState(null);
    const [showFullTicket, setShowFullTicket] = useState(false);

    useEffect(() => {
        API.get(`/participants/events/${id}`)
            .then((res) => {
                setEvent(res.data.event);
                setIsRegistered(res.data.isRegistered);
                setRegistration(res.data.registration);
                setIsEligible(res.data.isEligible !== false);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    // Check if feedback already submitted
    useEffect(() => {
        if (isRegistered && event?.status === 'completed') {
            API.get(`/feedback/${id}/check`)
                .then((res) => setFeedbackSubmitted(res.data.hasSubmitted))
                .catch(() => { });
        }
    }, [isRegistered, event?.status, id]);

    const handleRegister = async () => {
        setSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await API.post(`/participants/events/${id}/register`, { formResponses });
            setIsRegistered(true);
            setRegistration(res.data.registration);
            setMessage({ type: 'success', text: 'Registration successful! Check your email for the ticket.' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Registration failed' });
        } finally {
            setSubmitting(false);
        }
    };

    const handlePurchase = async () => {
        if (merchSelections.length === 0) {
            setMessage({ type: 'error', text: 'Please select at least one item' });
            return;
        }
        setSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await API.post(`/participants/events/${id}/purchase`, { selections: merchSelections });
            setIsRegistered(true);
            setRegistration(res.data.registration);
            setMessage({ type: 'success', text: `Purchase successful! Total: ₹${res.data.totalCost}` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Purchase failed' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!teamName.trim()) {
            setMessage({ type: 'error', text: 'Please enter a team name' });
            return;
        }
        // Validate required custom form fields
        if (event.customForm?.length > 0) {
            for (const field of event.customForm) {
                if (field.required) {
                    const val = formResponses[field.label];
                    if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim())) {
                        setMessage({ type: 'error', text: `Please fill in the required field: ${field.label}` });
                        return;
                    }
                }
            }
        }
        setSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await API.post('/teams/create', { eventId: id, name: teamName, formResponses });
            setMessage({ type: 'success', text: `Team created! Invite code: ${res.data.team.inviteCode}` });
            setShowCreateTeam(false);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create team' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoinTeam = async () => {
        if (!inviteCode.trim()) {
            setMessage({ type: 'error', text: 'Please enter an invite code' });
            return;
        }
        // Validate required custom form fields
        if (event.customForm?.length > 0) {
            for (const field of event.customForm) {
                if (field.required) {
                    const val = formResponses[field.label];
                    if (!val || (Array.isArray(val) && val.length === 0) || (typeof val === 'string' && !val.trim())) {
                        setMessage({ type: 'error', text: `Please fill in the required field: ${field.label}` });
                        return;
                    }
                }
            }
        }
        setSubmitting(true);
        setMessage({ type: '', text: '' });
        try {
            await API.post('/teams/join', { inviteCode, formResponses });
            setMessage({ type: 'success', text: 'Successfully joined the team!' });
            setShowJoinTeam(false);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to join team' });
        } finally {
            setSubmitting(false);
        }
    };

    // Feedback submission
    const handleFeedbackSubmit = async () => {
        if (feedbackRating === 0) {
            setMessage({ type: 'error', text: 'Please select a rating' });
            return;
        }
        setFeedbackLoading(true);
        try {
            await API.post(`/feedback/${id}`, { rating: feedbackRating, comment: feedbackComment, isAnonymous: feedbackAnonymous });
            setFeedbackSubmitted(true);
            setMessage({ type: 'success', text: 'Thank you for your feedback!' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to submit feedback' });
        } finally {
            setFeedbackLoading(false);
        }
    };

    // Payment proof upload
    const handlePaymentProofUpload = async () => {
        if (!paymentFile || !registration?._id) return;
        setUploadingProof(true);
        try {
            const formData = new FormData();
            formData.append('paymentProof', paymentFile);
            formData.append('registrationId', registration._id);
            const res = await API.post(`/participants/events/${id}/payment-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMessage({ type: 'success', text: 'Payment proof uploaded successfully!' });
            setRegistration({ ...registration, paymentProofUrl: res.data.paymentProofUrl });
            setPaymentFile(null);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
        } finally {
            setUploadingProof(false);
        }
    };

    // Fetch full ticket
    const handleViewTicket = async () => {
        if (ticketData) {
            setShowFullTicket(!showFullTicket);
            return;
        }
        try {
            const res = await API.get(`/participants/tickets/${registration._id}`);
            setTicketData(res.data);
            setShowFullTicket(true);
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load ticket' });
        }
    };

    if (loading) return <Loading />;
    if (!event) return <div className="page-container"><div className="empty-state"><p>Event not found</p></div></div>;

    const deadlinePassed = new Date() > new Date(event.registrationDeadline);
    const limitReached = event.registrationLimit > 0 && event.registrationCount >= event.registrationLimit;

    return (
        <div className="page-container">
            <div className="fade-in">
                {/* Header */}
                <div className="mb-page">
                    <div className="cluster" style={{ marginBottom: '0.9rem' }}>
                        <span className={`badge ${event.type === 'merchandise' ? 'badge-yellow' : 'badge-purple'}`}>{event.type}</span>
                        <span className={`badge ${event.status === 'published' ? 'badge-green' : 'badge-blue'}`}>{event.status}</span>
                        {event.eligibility !== 'all' && <span className="badge badge-cyan">{event.eligibility} only</span>}
                        {event.isTeamEvent && <span className="badge badge-cyan">👥 Team</span>}
                    </div>
                    <h1 className="page-title" style={{ fontSize: 'var(--font-4xl)' }}>{event.name}</h1>
                    <p className="text-secondary" style={{ marginTop: '0.4rem' }}>by <strong style={{ color: 'var(--text-primary)' }}>{event.organizer?.name || 'Unknown'}</strong></p>
                </div>

                <div className="layout-sidebar">
                    {/* Left: Details */}
                    <div>
                        <div className="glass-card mb-section">
                            <h3 className="card-title">Description</h3>
                            <p className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{event.description || 'No description provided'}</p>
                        </div>

                        {event.tags?.length > 0 && (
                            <div className="tag-chips" style={{ marginBottom: '1.5rem' }}>
                                {event.tags.map((tag) => <span key={tag} className="tag-chip">{tag}</span>)}
                            </div>
                        )}

                        {/* Custom Form (for NON-team events with custom fields, shown when not registered) */}
                        {event.customForm?.length > 0 && !isRegistered && !event.isTeamEvent && (
                            <div className="glass-card mb-section">
                                <h3 className="card-title">Registration Form</h3>
                                {event.customForm.map((field) => (
                                    <div key={field._id} className="form-group">
                                        <label>{field.label} {field.required && <span className="required">*</span>}</label>
                                        {field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'number' ? (
                                            <input type={field.fieldType} className="form-input" required={field.required}
                                                onChange={(e) => setFormResponses({ ...formResponses, [field.label]: e.target.value })} />
                                        ) : field.fieldType === 'textarea' ? (
                                            <textarea className="form-input" required={field.required}
                                                onChange={(e) => setFormResponses({ ...formResponses, [field.label]: e.target.value })} />
                                        ) : field.fieldType === 'dropdown' ? (
                                            <select className="form-input" required={field.required}
                                                onChange={(e) => setFormResponses({ ...formResponses, [field.label]: e.target.value })}>
                                                <option value="">Select...</option>
                                                {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : field.fieldType === 'checkbox' ? (
                                            <div className="check-group">
                                                {field.options?.map((opt) => (
                                                    <label key={opt} className="check-label">
                                                        <input type="checkbox" onChange={(e) => {
                                                            const cur = formResponses[field.label] || [];
                                                            setFormResponses({
                                                                ...formResponses,
                                                                [field.label]: e.target.checked ? [...cur, opt] : cur.filter((v) => v !== opt),
                                                            });
                                                        }} /> {opt}
                                                    </label>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Merchandise Items */}
                        {event.type === 'merchandise' && event.merchandiseItems?.length > 0 && !isRegistered && (
                            <div className="glass-card mb-section">
                                <h3 className="card-title">🛍️ Select Items</h3>
                                {event.merchandiseItems.map((item) => {
                                    const inCart = merchSelections.find((s) => s.itemId === item._id);
                                    return (
                                        <div key={item._id} className="merch-item">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong>{item.name}</strong>
                                                <span className="price">₹{item.price}</span>
                                            </div>
                                            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                                                Stock: {item.stockQuantity} | Limit: {item.purchaseLimitPerParticipant}/person
                                            </div>
                                            {item.stockQuantity > 0 ? (
                                                inCart ? (
                                                    /* Already added — show quantity controls and options */
                                                    <div className="inset inset-accent" style={{ marginTop: '0.6rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                            {item.sizes?.length > 0 && (
                                                                <select className="form-input" style={{ width: 'auto', minWidth: '80px' }}
                                                                    value={inCart.size || ''}
                                                                    onChange={(e) => {
                                                                        setMerchSelections(merchSelections.map((s) =>
                                                                            s.itemId === item._id ? { ...s, size: e.target.value } : s
                                                                        ));
                                                                    }}>
                                                                    <option value="">Size</option>
                                                                    {item.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                            )}
                                                            {item.colors?.length > 0 && (
                                                                <select className="form-input" style={{ width: 'auto', minWidth: '80px' }}
                                                                    value={inCart.color || ''}
                                                                    onChange={(e) => {
                                                                        setMerchSelections(merchSelections.map((s) =>
                                                                            s.itemId === item._id ? { ...s, color: e.target.value } : s
                                                                        ));
                                                                    }}>
                                                                    <option value="">Color</option>
                                                                    {item.colors.map((c) => <option key={c} value={c}>{c}</option>)}
                                                                </select>
                                                            )}
                                                            {item.variants?.length > 0 && (
                                                                <select className="form-input" style={{ width: 'auto', minWidth: '80px' }}
                                                                    value={inCart.variant || ''}
                                                                    onChange={(e) => {
                                                                        setMerchSelections(merchSelections.map((s) =>
                                                                            s.itemId === item._id ? { ...s, variant: e.target.value } : s
                                                                        ));
                                                                    }}>
                                                                    <option value="">Variant</option>
                                                                    {item.variants.map((v) => <option key={v} value={v}>{v}</option>)}
                                                                </select>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                            <div className="qty-stepper">
                                                                <button aria-label="Decrease quantity"
                                                                    onClick={() => {
                                                                        if (inCart.quantity > 1) {
                                                                            setMerchSelections(merchSelections.map((s) =>
                                                                                s.itemId === item._id ? { ...s, quantity: s.quantity - 1 } : s
                                                                            ));
                                                                        }
                                                                    }}>−</button>
                                                                <span>{inCart.quantity}</span>
                                                                <button aria-label="Increase quantity"
                                                                    onClick={() => {
                                                                        if (inCart.quantity < item.purchaseLimitPerParticipant) {
                                                                            setMerchSelections(merchSelections.map((s) =>
                                                                                s.itemId === item._id ? { ...s, quantity: s.quantity + 1 } : s
                                                                            ));
                                                                        }
                                                                    }}>+</button>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <span className="price text-sm">
                                                                    ₹{item.price * inCart.quantity}
                                                                </span>
                                                                <button className="btn btn-danger btn-sm" aria-label="Remove item"
                                                                    onClick={() => setMerchSelections(merchSelections.filter((s) => s.itemId !== item._id))}>
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Not added yet — show Add button */
                                                    <button className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}
                                                        onClick={() => setMerchSelections([...merchSelections, { itemId: item._id, quantity: 1 }])}>
                                                        + Add to Cart
                                                    </button>
                                                )
                                            ) : (
                                                <span className="badge badge-red" style={{ marginTop: '0.5rem' }}>Out of Stock</span>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Cart summary */}
                                {merchSelections.length > 0 && (
                                    <div className="cart-summary">
                                        <>
                                            <span>🛒 Cart ({merchSelections.length} item{merchSelections.length > 1 ? 's' : ''})</span>
                                            <span className="price">
                                                ₹{merchSelections.reduce((sum, s) => {
                                                    const item = event.merchandiseItems.find((i) => i._id === s.itemId);
                                                    return sum + (item ? item.price * s.quantity : 0);
                                                }, 0)}
                                            </span>
                                        </>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Ticket / Order Status display */}
                        {isRegistered && registration && (
                            <div className="ticket" style={{ marginBottom: '1.5rem' }}>
                                <div className="ticket-header">
                                    <h3>{registration.status === 'confirmed' && registration.ticketId ? '🎫 Your Ticket' : '📦 Order Status'}</h3>
                                </div>
                                <div className="ticket-body">
                                    {registration.status === 'confirmed' && registration.ticketId ? (
                                        /* Approved — show QR and ticket */
                                        <>
                                            {registration.qrCode && <img src={registration.qrCode} alt="QR Code" className="qr-code" />}
                                            <div className="ticket-id">{registration.ticketId}</div>
                                            <div className="ticket-info">
                                                <div><span>Event</span><span>{event.name}</span></div>
                                                <div><span>Status</span><span style={{ color: 'var(--success)' }}>✅ Confirmed</span></div>
                                                <div><span>Date</span><span>{new Date(registration.registeredAt).toLocaleDateString()}</span></div>
                                            </div>
                                            <button className="btn btn-secondary btn-sm" style={{ marginTop: '0.75rem', width: '100%' }} onClick={handleViewTicket}>
                                                {showFullTicket ? 'Hide Full Ticket' : '🔍 View Full Ticket'}
                                            </button>
                                            {showFullTicket && ticketData && (
                                                <div className="inset" style={{ marginTop: '0.75rem', textAlign: 'left' }}>
                                                    {ticketData.qrCode && <img src={ticketData.qrCode} alt="Full QR" className="qr-code" style={{ width: 200, height: 200 }} />}
                                                    <div className="info-list">
                                                        <div><span className="k">Ticket ID</span><span className="v mono">{ticketData.ticketId}</span></div>
                                                        <div><span className="k">Event</span><span className="v">{ticketData.eventName}</span></div>
                                                        <div><span className="k">Participant</span><span className="v">{ticketData.participantName}</span></div>
                                                        <div><span className="k">Status</span><span className="v">{ticketData.status}</span></div>
                                                        <div><span className="k">Registered</span><span className="v">{new Date(ticketData.registeredAt).toLocaleString()}</span></div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        /* Pending or Rejected — show status, no QR */
                                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                                {registration.status === 'rejected' ? '❌' : '⏳'}
                                            </div>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                                {registration.status === 'rejected' ? 'Order Rejected' : 'Order Pending Approval'}
                                            </div>
                                            <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
                                                {registration.status === 'rejected'
                                                    ? 'Your order was rejected by the organizer.'
                                                    : registration.paymentProofUrl
                                                        ? 'Payment proof uploaded. Waiting for organizer approval.'
                                                        : 'Please upload payment proof below to proceed.'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Payment Proof Upload (for merchandise orders in pending_approval state) */}
                        {isRegistered && registration && event.type === 'merchandise' && registration.paymentStatus === 'pending_approval' && !registration.paymentProofUrl && (
                            <div className="glass-card mb-section">
                                <h3 className="card-title">💳 Upload Payment Proof</h3>
                                <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                                    Upload a screenshot of your payment to get your order approved.
                                </p>
                                <div className="cluster" style={{ justifyContent: 'space-between' }}>
                                    <input type="file" accept="image/*" onChange={(e) => setPaymentFile(e.target.files[0])}
                                        style={{ flex: 1, minWidth: 0 }} />
                                    <button className="btn btn-primary btn-sm" onClick={handlePaymentProofUpload}
                                        disabled={!paymentFile || uploadingProof}>
                                        {uploadingProof ? 'Uploading...' : '📤 Upload'}
                                    </button>
                                </div>
                            </div>
                        )}
                        {/* Payment Proof Already Uploaded */}
                        {isRegistered && registration && event.type === 'merchandise' && registration.paymentProofUrl && registration.paymentStatus === 'pending_approval' && (
                            <div className="glass-card mb-section">
                                <h3 className="card-title">💳 Payment Proof Uploaded</h3>
                                <div className="status-banner warning">
                                    ✅ Proof submitted — awaiting organizer approval
                                </div>
                            </div>
                        )}

                        {/* Feedback Section (when event is completed) */}
                        {isRegistered && (event.status === 'completed' || event.status === 'ongoing') && (
                            <div className="glass-card mb-section">
                                <h3 className="card-title">⭐ Event Feedback</h3>
                                {feedbackSubmitted ? (
                                    <div className="status-banner success">
                                        ✅ Thank you for your feedback!
                                    </div>
                                ) : (
                                    <>
                                        <div className="star-input">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button key={star}
                                                    onClick={() => setFeedbackRating(star)}
                                                    onMouseEnter={() => setFeedbackHover(star)}
                                                    onMouseLeave={() => setFeedbackHover(0)}
                                                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                                    className={star <= (feedbackHover || feedbackRating) ? 'on' : ''}>
                                                    ★
                                                </button>
                                            ))}
                                        </div>
                                        {feedbackRating > 0 && (
                                            <p style={{ textAlign: 'center', fontSize: 'var(--font-sm)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                                                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][feedbackRating]}
                                            </p>
                                        )}
                                        <div className="form-group">
                                            <textarea className="form-input" placeholder="Share your thoughts (optional)..."
                                                value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)}
                                                rows={3} />
                                        </div>
                                        <label className="check-label" style={{ marginBottom: '0.75rem' }}>
                                            <input type="checkbox" checked={feedbackAnonymous} onChange={(e) => setFeedbackAnonymous(e.target.checked)} />
                                            Submit anonymously
                                        </label>
                                        <button className="btn btn-primary" style={{ width: '100%' }}
                                            onClick={handleFeedbackSubmit} disabled={feedbackLoading || feedbackRating === 0}>
                                            {feedbackLoading ? 'Submitting...' : feedbackAnonymous ? '🔒 Submit Anonymously' : '📝 Submit Feedback'}
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Forum Section (when registered) */}
                        {isRegistered && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <Forum eventId={id} />
                            </div>
                        )}
                    </div>

                    {/* Right: Sidebar */}
                    <aside>
                        <div className="glass-card">
                            <h3 className="card-title">Event Info</h3>
                            <div className="info-list">
                                <div><span className="k">📅 Starts</span><span className="v">{new Date(event.startDate).toLocaleDateString()}</span></div>
                                <div><span className="k">🏁 Ends</span><span className="v">{new Date(event.endDate).toLocaleDateString()}</span></div>
                                <div><span className="k">⏰ Deadline</span><span className="v">{new Date(event.registrationDeadline).toLocaleDateString()}</span></div>
                                <div><span className="k">💰 Fee</span><span className="v">{event.registrationFee > 0 ? `₹${event.registrationFee}` : 'Free'}</span></div>
                                <div><span className="k">👥 Registered</span><span className="v">{event.registrationCount}{event.registrationLimit > 0 ? ` / ${event.registrationLimit}` : ''}</span></div>
                                {event.isTeamEvent && <div><span className="k">👥 Team size</span><span className="v">{event.teamSize?.min || 2}–{event.teamSize?.max || 4}</span></div>}
                                <div><span className="k">📧 Contact</span><span className="v">{event.organizer?.contactEmail || 'N/A'}</span></div>
                            </div>

                            {/* Messages */}
                            {message.text && (
                                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1rem' }}>
                                    {message.text}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div style={{ marginTop: '1.5rem' }}>
                                {isRegistered ? (
                                    <div className="status-banner success">
                                        ✅ Already Registered
                                    </div>
                                ) : deadlinePassed ? (
                                    <div className="status-banner danger">
                                        ⏰ Deadline Passed
                                    </div>
                                ) : limitReached ? (
                                    <div className="status-banner danger">
                                        🚫 Registration Full
                                    </div>
                                ) : !isEligible ? (
                                    <div className="status-banner danger">
                                        🚫 Not eligible — this event is for {event.eligibility} participants only
                                    </div>
                                ) : event.isTeamEvent ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <div className="hint" style={{ textAlign: 'center', marginTop: 0 }}>
                                            👥 Team event — {event.teamSize?.min || 2}–{event.teamSize?.max || 4} members
                                        </div>
                                        {!showCreateTeam && !showJoinTeam && (
                                            <>
                                                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowCreateTeam(true)}>
                                                    ➕ Create Team
                                                </button>
                                                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => setShowJoinTeam(true)}>
                                                    🔗 Join Team
                                                </button>
                                                <Link to="/teams" className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center' }}>
                                                    📋 My Teams
                                                </Link>
                                            </>
                                        )}
                                        {showCreateTeam && (
                                            <div>
                                                <div className="form-group">
                                                    <label>Team Name</label>
                                                    <input className="form-input" placeholder="Enter team name" value={teamName} onChange={(e) => setTeamName(e.target.value)} />
                                                </div>
                                                {/* Required custom form fields inline */}
                                                {event.customForm?.length > 0 && (
                                                    <div style={{ marginBottom: '0.75rem' }}>
                                                        <p className="callout-label">Registration Fields</p>
                                                        {event.customForm.map((field) => (
                                                            <div key={field._id} className="form-group" style={{ marginBottom: '0.5rem' }}>
                                                                <label>{field.label} {field.required && <span className="required">*</span>}</label>
                                                                {field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'number' ? (
                                                                    <input type={field.fieldType} className="form-input" required={field.required}
                                                                        value={formResponses[field.label] || ''}
                                                                        onChange={(e) => setFormResponses({ ...formResponses, [field.label]: e.target.value })} />
                                                                ) : field.fieldType === 'textarea' ? (
                                                                    <textarea className="form-input" required={field.required}
                                                                        value={formResponses[field.label] || ''}
                                                                        onChange={(e) => setFormResponses({ ...formResponses, [field.label]: e.target.value })} />
                                                                ) : field.fieldType === 'dropdown' ? (
                                                                    <select className="form-input" required={field.required}
                                                                        value={formResponses[field.label] || ''}
                                                                        onChange={(e) => setFormResponses({ ...formResponses, [field.label]: e.target.value })}>
                                                                        <option value="">Select...</option>
                                                                        {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                ) : field.fieldType === 'checkbox' ? (
                                                                    <div className="check-group">
                                                                        {field.options?.map((opt) => (
                                                                            <label key={opt} className="check-label">
                                                                                <input type="checkbox"
                                                                                    checked={(formResponses[field.label] || []).includes(opt)}
                                                                                    onChange={(e) => {
                                                                                        const cur = formResponses[field.label] || [];
                                                                                        setFormResponses({
                                                                                            ...formResponses,
                                                                                            [field.label]: e.target.checked ? [...cur, opt] : cur.filter((v) => v !== opt),
                                                                                        });
                                                                                    }} /> {opt}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                ) : field.fieldType === 'radio' ? (
                                                                    <div className="check-group">
                                                                        {field.options?.map((opt) => (
                                                                            <label key={opt} className="check-label">
                                                                                <input type="radio" name={`team-form-create-${field._id}`}
                                                                                    checked={formResponses[field.label] === opt}
                                                                                    onChange={() => setFormResponses({ ...formResponses, [field.label]: opt })} /> {opt}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="cluster">
                                                    <button className="btn btn-primary btn-sm" onClick={handleCreateTeam} disabled={submitting}>
                                                        {submitting ? 'Creating...' : 'Create'}
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowCreateTeam(false)}>Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                        {showJoinTeam && (
                                            <div>
                                                <div className="form-group">
                                                    <label>Invite Code</label>
                                                    <input className="form-input" placeholder="e.g. A1B2C3D4" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
                                                </div>
                                                {/* Required custom form fields inline */}
                                                {event.customForm?.length > 0 && (
                                                    <div style={{ marginBottom: '0.75rem' }}>
                                                        <p className="callout-label">Registration Fields</p>
                                                        {event.customForm.map((field) => (
                                                            <div key={field._id} className="form-group" style={{ marginBottom: '0.5rem' }}>
                                                                <label>{field.label} {field.required && <span className="required">*</span>}</label>
                                                                {field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'number' ? (
                                                                    <input type={field.fieldType} className="form-input" required={field.required}
                                                                        value={formResponses[field.label] || ''}
                                                                        onChange={(e) => setFormResponses({ ...formResponses, [field.label]: e.target.value })} />
                                                                ) : field.fieldType === 'textarea' ? (
                                                                    <textarea className="form-input" required={field.required}
                                                                        value={formResponses[field.label] || ''}
                                                                        onChange={(e) => setFormResponses({ ...formResponses, [field.label]: e.target.value })} />
                                                                ) : field.fieldType === 'dropdown' ? (
                                                                    <select className="form-input" required={field.required}
                                                                        value={formResponses[field.label] || ''}
                                                                        onChange={(e) => setFormResponses({ ...formResponses, [field.label]: e.target.value })}>
                                                                        <option value="">Select...</option>
                                                                        {field.options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                ) : field.fieldType === 'checkbox' ? (
                                                                    <div className="check-group">
                                                                        {field.options?.map((opt) => (
                                                                            <label key={opt} className="check-label">
                                                                                <input type="checkbox"
                                                                                    checked={(formResponses[field.label] || []).includes(opt)}
                                                                                    onChange={(e) => {
                                                                                        const cur = formResponses[field.label] || [];
                                                                                        setFormResponses({
                                                                                            ...formResponses,
                                                                                            [field.label]: e.target.checked ? [...cur, opt] : cur.filter((v) => v !== opt),
                                                                                        });
                                                                                    }} /> {opt}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                ) : field.fieldType === 'radio' ? (
                                                                    <div className="check-group">
                                                                        {field.options?.map((opt) => (
                                                                            <label key={opt} className="check-label">
                                                                                <input type="radio" name={`team-form-join-${field._id}`}
                                                                                    checked={formResponses[field.label] === opt}
                                                                                    onChange={() => setFormResponses({ ...formResponses, [field.label]: opt })} /> {opt}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="cluster">
                                                    <button className="btn btn-primary btn-sm" onClick={handleJoinTeam} disabled={submitting}>
                                                        {submitting ? 'Joining...' : 'Join'}
                                                    </button>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => setShowJoinTeam(false)}>Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : event.type === 'normal' ? (
                                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handleRegister} disabled={submitting}>
                                        {submitting ? 'Registering...' : 'Register Now'}
                                    </button>
                                ) : (
                                    <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={handlePurchase} disabled={submitting}>
                                        {submitting ? 'Processing...' : 'Purchase'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
