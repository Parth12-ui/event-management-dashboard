import { useState, useEffect } from 'react';
import api from '../../api/axios';
import Loading from '../../components/Loading';
import { useParams } from 'react-router-dom';

export default function MerchOrders() {
    const { id } = useParams();
    const [orders, setOrders] = useState([]);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState({});
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        Promise.all([
            api.get(`/organizer/events/${id}`),
            api.get(`/organizer/events/${id}/merch-orders`),
        ])
            .then(([eventRes, ordersRes]) => {
                setEvent(eventRes.data.event);
                setOrders(ordersRes.data.orders);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const handleApprove = async (orderId) => {
        setProcessing((p) => ({ ...p, [orderId]: 'approving' }));
        try {
            const res = await api.post(`/organizer/events/${id}/merch-orders/${orderId}/approve`);
            setOrders((prev) => prev.map((o) => (o._id === orderId ? res.data.registration : o)));
        } catch (err) {
            alert(err.response?.data?.message || 'Approval failed');
        }
        setProcessing((p) => ({ ...p, [orderId]: null }));
    };

    const handleReject = async (orderId) => {
        if (!confirm('Reject this order?')) return;
        setProcessing((p) => ({ ...p, [orderId]: 'rejecting' }));
        try {
            const res = await api.post(`/organizer/events/${id}/merch-orders/${orderId}/reject`);
            setOrders((prev) => prev.map((o) => (o._id === orderId ? res.data.registration : o)));
        } catch (err) {
            alert(err.response?.data?.message || 'Rejection failed');
        }
        setProcessing((p) => ({ ...p, [orderId]: null }));
    };

    if (loading) return <Loading />;

    const filteredOrders = filter === 'all'
        ? orders
        : orders.filter((o) => o.paymentStatus === filter);

    const stats = {
        total: orders.length,
        pending: orders.filter((o) => o.paymentStatus === 'pending_approval').length,
        approved: orders.filter((o) => o.paymentStatus === 'approved').length,
        rejected: orders.filter((o) => o.paymentStatus === 'rejected').length,
    };

    const tiles = [
        { key: 'all', label: 'Total Orders', value: stats.total, tone: '' },
        { key: 'pending_approval', label: 'Pending', value: stats.pending, tone: 'tone-warning' },
        { key: 'approved', label: 'Approved', value: stats.approved, tone: 'tone-success' },
        { key: 'rejected', label: 'Rejected', value: stats.rejected, tone: 'tone-danger' },
    ];
    const statusBadge = { approved: 'badge-green', rejected: 'badge-red' };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Merch Orders</h1>
                <p>{event?.name} — review payment proofs and approve orders</p>
            </div>

            {/* Stats — click to filter */}
            <div className="grid-4 mb-page">
                {tiles.map((t) => (
                    <button key={t.key} type="button"
                        className={`glass-card stat-card filterable ${t.tone} ${filter === t.key ? 'active' : ''}`}
                        onClick={() => setFilter(t.key)}
                        style={{ font: 'inherit', color: 'inherit' }}
                    >
                        <span className="stat-value">{t.value}</span>
                        <span className="stat-label">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Orders */}
            {filteredOrders.length === 0 ? (
                <div className="empty-state">
                    <div className="emoji">📦</div>
                    <p>No orders found.</p>
                </div>
            ) : (
                <div className="stack-lg">
                    {filteredOrders.map((order) => (
                        <div key={order._id} className="glass-card fade-in">
                            <div className="page-header-row" style={{ alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ fontSize: 'var(--font-base)' }}>
                                        {order.participant?.firstName} {order.participant?.lastName}
                                    </h3>
                                    <p className="text-xs text-muted">{order.participant?.email}</p>
                                </div>
                                <span className={`badge ${statusBadge[order.paymentStatus] || 'badge-warning'}`}>
                                    {order.paymentStatus?.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Items */}
                            <div className="inset" style={{ margin: '1rem 0' }}>
                                <div className="info-list">
                                    {order.merchandiseSelections?.map((sel, i) => (
                                        <div key={i}>
                                            <span>{sel.itemName} {sel.size && `(${sel.size})`} {sel.color && `— ${sel.color}`}</span>
                                            <span className="v">×{sel.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Proof */}
                            {order.paymentProofUrl && (
                                <div className="mb-section">
                                    <span className="callout-label">Payment proof</span>
                                    <img
                                        src={`${(import.meta.env.VITE_API_URL || '').replace('/api', '')}${order.paymentProofUrl}`}
                                        alt="Payment proof"
                                        className="proof-img"
                                    />
                                </div>
                            )}

                            {/* Ticket info if approved */}
                            {order.ticketId && (
                                <div className="mb-section">
                                    <span className="code-chip"><span className="code-label">🎫 Ticket</span>{order.ticketId}</span>
                                </div>
                            )}

                            {/* Actions */}
                            {order.paymentStatus === 'pending_approval' && (
                                <div className="cluster">
                                    <button
                                        className="btn btn-success"
                                        onClick={() => handleApprove(order._id)}
                                        disabled={!!processing[order._id]}
                                    >
                                        {processing[order._id] === 'approving' ? 'Approving...' : '✓ Approve'}
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => handleReject(order._id)}
                                        disabled={!!processing[order._id]}
                                    >
                                        {processing[order._id] === 'rejecting' ? 'Rejecting...' : '✕ Reject'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
