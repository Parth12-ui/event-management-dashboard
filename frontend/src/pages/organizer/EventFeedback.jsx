import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import Loading from '../../components/Loading';

export default function EventFeedback() {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const params = filter ? `?minRating=${filter}` : '';
        api.get(`/feedback/${id}${params}`)
            .then((r) => setData(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id, filter]);

    if (loading) return <Loading />;
    if (!data) return null;

    const { stats, feedbacks } = data;

    const stars = (n) => (
        <span className="stars" aria-label={`${n} out of 5`}>
            {'★'.repeat(n)}<span className="off">{'★'.repeat(5 - n)}</span>
        </span>
    );

    return (
        <div className="page-container">
            <div className="page-header">
                <h1>Event Feedback</h1>
                <p>What participants said — click a bar to filter by rating</p>
            </div>

            {/* Aggregate Stats */}
            <div className="glass-card mb-page">
                <div className="rating-summary">
                    <div className="rating-big">
                        <div className="value">{stats.avgRating}</div>
                        <div style={{ fontSize: '1.25rem', margin: '0.35rem 0' }}>{stars(Math.round(stats.avgRating))}</div>
                        <div className="text-xs text-muted">{stats.totalCount} review{stats.totalCount === 1 ? '' : 's'}</div>
                    </div>
                    <div className="rating-bars">
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = stats.breakdown[star] || 0;
                            const pct = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;
                            return (
                                <button key={star} type="button"
                                    className={`rating-bar ${filter === String(star) ? 'active' : ''}`}
                                    onClick={() => setFilter(filter === String(star) ? '' : String(star))}
                                >
                                    <span style={{ width: '2rem', textAlign: 'right' }}>{star}★</span>
                                    <span className="track"><span className="fill" style={{ width: `${pct}%`, display: 'block' }} /></span>
                                    <span style={{ width: '2rem', textAlign: 'left' }}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {filter && (
                <div className="cluster" style={{ marginBottom: '1rem' }}>
                    <span className="text-sm text-secondary">Showing {filter}★ and above</span>
                    <button className="link-btn accent" onClick={() => setFilter('')}>Clear filter</button>
                </div>
            )}

            {/* Feedback List */}
            <div className="stack">
                {feedbacks.length === 0 ? (
                    <div className="empty-state">
                        <div className="emoji">💬</div>
                        <p>No feedback yet.</p>
                    </div>
                ) : (
                    feedbacks.map((fb, i) => (
                        <div key={i} className="glass-card fade-in" style={{ padding: '1.1rem 1.25rem' }}>
                            <div className="page-header-row" style={{ alignItems: 'center', marginBottom: '0.5rem', gap: '0.5rem' }}>
                                <div className="cluster" style={{ gap: '0.75rem' }}>
                                    {stars(fb.rating)}
                                    <span className="text-sm text-secondary">
                                        {fb.isAnonymous || !fb.participant
                                            ? '🔒 Anonymous'
                                            : `${fb.participant.firstName} ${fb.participant.lastName}`}
                                    </span>
                                </div>
                                <span className="text-xs text-muted">{new Date(fb.createdAt).toLocaleDateString()}</span>
                            </div>
                            {fb.comment && <p className="text-secondary" style={{ lineHeight: 1.65 }}>{fb.comment}</p>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
