import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function Forum({ eventId, isOrganizer = false }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const socket = useSocket();
    const { user } = useAuth();
    const containerRef = useRef(null);

    useEffect(() => {
        api.get(`/forum/${eventId}/messages`)
            .then((r) => setMessages(r.data.messages))
            .catch(console.error);
    }, [eventId]);

    useEffect(() => {
        if (!socket) return;

        socket.emit('forum:join', eventId);

        socket.on('forum:message', (msg) => {
            setMessages((prev) => {
                // Deduplicate — skip if already added by optimistic update
                if (msg.parentMessage) {
                    const parent = prev.find((m) => m._id === msg.parentMessage);
                    if (parent?.replies?.some((r) => r._id === msg._id)) return prev;
                    return prev.map((m) =>
                        m._id === msg.parentMessage
                            ? { ...m, replies: [...(m.replies || []), msg] }
                            : m
                    );
                }
                if (prev.some((m) => m._id === msg._id)) return prev;
                return [msg, ...prev];
            });
        });

        socket.on('forum:delete', ({ messageId }) => {
            setMessages((prev) => prev.filter((m) => m._id !== messageId));
        });

        socket.on('forum:pin', ({ messageId, isPinned }) => {
            setMessages((prev) =>
                prev.map((m) => (m._id === messageId ? { ...m, isPinned } : m))
            );
        });

        socket.on('forum:reaction', ({ messageId, reactions }) => {
            setMessages((prev) =>
                prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
            );
        });

        return () => {
            socket.emit('forum:leave', eventId);
            socket.off('forum:message');
            socket.off('forum:delete');
            socket.off('forum:pin');
            socket.off('forum:reaction');
        };
    }, [socket, eventId]);

    const postMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        try {
            const res = await api.post(`/forum/${eventId}/messages`, {
                content: input,
                parentMessage: replyTo,
                isAnnouncement,
            });
            // Optimistic update — add message to state immediately
            const newMsg = res.data;
            setMessages((prev) => {
                if (newMsg.parentMessage) {
                    if (prev.find((m) => m._id === newMsg.parentMessage)?.replies?.some((r) => r._id === newMsg._id)) return prev;
                    return prev.map((m) =>
                        m._id === newMsg.parentMessage
                            ? { ...m, replies: [...(m.replies || []), newMsg] }
                            : m
                    );
                }
                if (prev.some((m) => m._id === newMsg._id)) return prev;
                return [newMsg, ...prev];
            });
            setInput('');
            setReplyTo(null);
            setIsAnnouncement(false);
        } catch (err) {
            console.error('Post message error:', err);
        }
    };

    const deleteMessage = async (msgId) => {
        if (!confirm('Delete this message?')) return;
        try {
            await api.delete(`/forum/messages/${msgId}`);
            // Optimistic update — remove message immediately
            setMessages((prev) => prev.filter((m) => m._id !== msgId).map((m) => ({
                ...m,
                replies: m.replies?.filter((r) => r._id !== msgId),
            })));
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const pinMessage = async (msgId) => {
        try {
            const res = await api.put(`/forum/messages/${msgId}/pin`);
            // Optimistic update — toggle pin state immediately
            setMessages((prev) =>
                prev.map((m) => (m._id === msgId ? { ...m, isPinned: res.data.isPinned } : m))
            );
        } catch (err) {
            console.error('Pin error:', err);
        }
    };

    const reactToMessage = async (msgId, emoji) => {
        try {
            const res = await api.post(`/forum/messages/${msgId}/react`, { emoji });
            // Optimistic update — update reactions immediately
            setMessages((prev) =>
                prev.map((m) => (m._id === msgId ? { ...m, reactions: res.data.reactions } : m))
            );
        } catch (err) {
            console.error('React error:', err);
        }
    };

    const emojis = ['👍', '❤️', '😂', '🎉', '🤔'];

    const renderMessage = (msg, isReply = false) => (
        <div
            key={msg._id}
            className={`forum-msg ${isReply ? 'reply' : ''} ${msg.isAnnouncement ? 'announcement' : msg.isPinned ? 'pinned' : ''}`}
        >
            <div className="forum-msg-head">
                <div className="cluster">
                    <strong className={msg.authorRole === 'organizer' ? 'text-accent' : ''} style={{ fontSize: 'var(--font-sm)' }}>
                        {msg.authorName}
                    </strong>
                    {msg.authorRole === 'organizer' && <span className="badge badge-accent">Organizer</span>}
                    {msg.isPinned && <span className="badge badge-blue">Pinned</span>}
                    {msg.isAnnouncement && <span className="badge badge-warning">Announcement</span>}
                </div>
                <span className="forum-msg-time">{new Date(msg.createdAt).toLocaleString()}</span>
            </div>

            <p className="forum-msg-body">{msg.content}</p>

            {/* Reactions */}
            {msg.reactions && Object.values(msg.reactions).some((u) => u.length > 0) && (
                <div className="cluster" style={{ gap: '0.35rem', marginTop: '0.5rem' }}>
                    {Object.entries(msg.reactions).map(([emoji, users]) =>
                        users.length > 0 ? (
                            <button key={emoji} className="reaction-pill" onClick={() => reactToMessage(msg._id, emoji)}>
                                {emoji} {users.length}
                            </button>
                        ) : null
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="forum-actions">
                {emojis.map((e) => (
                    <button key={e} className="emoji-btn" onClick={() => reactToMessage(msg._id, e)} title={`React with ${e}`} aria-label={`React with ${e}`}>
                        {e}
                    </button>
                ))}
                {!isReply && (
                    <button className="link-btn accent" onClick={() => setReplyTo(msg._id)}>↩ Reply</button>
                )}
                {isOrganizer && (
                    <>
                        <button className="link-btn" onClick={() => pinMessage(msg._id)}>
                            {msg.isPinned ? 'Unpin' : '📌 Pin'}
                        </button>
                        <button className="link-btn danger" onClick={() => deleteMessage(msg._id)}>🗑 Delete</button>
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="glass-card" ref={containerRef}>
            <h3 className="section-title">💬 Discussion <span className="count">{messages.length}</span></h3>

            {/* Input */}
            <form onSubmit={postMessage} style={{ marginBottom: '1.25rem' }}>
                {replyTo && (
                    <div className="forum-reply-note">
                        <span>↩ Replying to a message</span>
                        <button type="button" className="link-btn" onClick={() => setReplyTo(null)}>✕ Cancel</button>
                    </div>
                )}
                <div className="forum-compose">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Write a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={!input.trim()}>Post</button>
                </div>
                {isOrganizer && (
                    <label className="check-label" style={{ marginTop: '0.6rem' }}>
                        <input type="checkbox" checked={isAnnouncement} onChange={(e) => setIsAnnouncement(e.target.checked)} />
                        Post as announcement
                    </label>
                )}
            </form>

            {/* Messages */}
            <div className="stack">
                {messages.length === 0 && (
                    <p className="empty-state" style={{ padding: '2rem', fontSize: 'var(--font-sm)' }}>No messages yet. Start the discussion!</p>
                )}
                {messages.map((msg) => (
                    <div key={msg._id}>
                        {renderMessage(msg)}
                        {msg.replies?.map((reply) => renderMessage(reply, true))}
                    </div>
                ))}
            </div>
        </div>
    );
}
