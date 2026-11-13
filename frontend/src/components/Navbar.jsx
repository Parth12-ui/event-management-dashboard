import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navConfig = {
    participant: [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/browse', label: 'Browse Events' },
        { path: '/teams', label: 'Teams' },
        { path: '/organizers', label: 'Clubs / Organizers' },
        { path: '/profile', label: 'Profile' },
    ],
    organizer: [
        { path: '/organizer/dashboard', label: 'Dashboard' },
        { path: '/organizer/events/create', label: 'Create Event' },
        { path: '/organizer/ongoing', label: 'Ongoing Events' },
        { path: '/organizer/profile', label: 'Profile' },
    ],
    admin: [
        { path: '/admin/dashboard', label: 'Dashboard' },
        { path: '/admin/organizers', label: 'Manage Clubs' },
        { path: '/admin/password-resets', label: 'Password Resets' },
    ],
};

export default function Navbar() {
    const { role, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (!isAuthenticated) return null;

    const links = navConfig[role] || [];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to={links[0]?.path || '/'} className="navbar-brand">
                    <span className="brand-mark" aria-hidden="true">F</span>
                    Felicity
                    {role && <span className="navbar-role">{role}</span>}
                </Link>
                <div className="navbar-links">
                    {links.map((link) => (
                        <NavLink key={link.path} to={link.path}>
                            {link.label}
                        </NavLink>
                    ))}
                    <button className="navbar-logout" onClick={handleLogout}>Log out</button>
                </div>
            </div>
        </nav>
    );
}
