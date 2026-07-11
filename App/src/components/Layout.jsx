import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Instagram, Facebook, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Hooks must be inside component

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMenuOpen(false);
    };

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Services', path: '/services' },
        { name: 'Book Now', path: '/book' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* Header */}
            <header style={{
                backgroundColor: 'var(--color-white)',
                boxShadow: 'var(--shadow-sm)',
                position: 'sticky',
                top: 0,
                zIndex: 50
            }}>
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '70px'
                }}>
                    {/* Logo */}
                    <Link to="/" style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'var(--color-primary)',
                        fontFamily: 'Playfair Display, serif' // Fallback if Outfit isn't loaded yet
                    }}>
                        The Nail Nook
                    </Link>

                    {/* Desktop Nav */}
                    <nav style={{ display: 'none' }} className="desktop-nav">
                        <style>{`
              @media (min-width: 768px) {
                .desktop-nav { display: flex !important; gap: 2rem; alignItems: center; }
                .mobile-menu-btn { display: none !important; }
              }
            `}</style>
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                style={{
                                    color: location.pathname === link.path ? 'var(--color-primary)' : 'var(--color-text)',
                                    fontWeight: location.pathname === link.path ? '600' : '400',
                                    transition: 'color 0.2s'
                                }}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Auth Links Desktop */}
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: '1rem' }}>
                                <Link
                                    to={user.role === 'tech' || user.role === 'owner' ? '/tech-dashboard' : '/dashboard'}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'var(--color-text)',
                                        fontWeight: '500'
                                    }}
                                >
                                    <User size={18} /> Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        background: 'none',
                                        border: '1px solid #ddd',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem'
                                    }}
                                >
                                    <LogOut size={14} /> Logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                style={{
                                    backgroundColor: 'var(--color-secondary)',
                                    color: 'var(--color-white)',
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '20px',
                                    fontWeight: '500',
                                    fontSize: '0.9rem',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                Sign In
                            </Link>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="mobile-menu-btn"
                        onClick={toggleMenu}
                        style={{ background: 'none', color: 'var(--color-text)' }}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Nav Dropdown */}
                {isMenuOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '70px',
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--color-white)',
                        boxShadow: 'var(--shadow-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        zIndex: 49
                    }}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                style={{
                                    padding: '0.5rem 0',
                                    fontSize: '1.1rem',
                                    color: location.pathname === link.path ? 'var(--color-primary)' : 'var(--color-text)',
                                    borderBottom: '1px solid #f0f0f0'
                                }}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Auth Links Mobile */}
                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'tech' || user.role === 'owner' ? '/tech-dashboard' : '/dashboard'}
                                    onClick={() => setIsMenuOpen(false)}
                                    style={{
                                        padding: '0.5rem 0',
                                        fontSize: '1.1rem',
                                        color: 'var(--color-text)',
                                        borderBottom: '1px solid #f0f0f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <User size={18} /> My Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        padding: '0.5rem 0',
                                        fontSize: '1.1rem',
                                        color: '#dc2626',
                                        textAlign: 'left',
                                        background: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                onClick={() => setIsMenuOpen(false)}
                                style={{
                                    padding: '0.75rem',
                                    textAlign: 'center',
                                    backgroundColor: 'var(--color-secondary)',
                                    color: 'var(--color-white)',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    marginTop: '0.5rem'
                                }}
                            >
                                Sign In
                            </Link>
                        )}
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>

            {/* Footer */}
            <footer style={{
                backgroundColor: 'var(--color-secondary)',
                color: 'var(--color-white)',
                padding: '3rem 0',
                marginTop: 'auto'
            }}>
                <div className="container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.5rem',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}>The Nail Nook</h3>
                    <p style={{ opacity: 0.8, maxWidth: '400px' }}>
                        Elevating your style with premium nail care services. Book your appointment today.
                    </p>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <Instagram size={24} style={{ cursor: 'pointer' }} />
                        <Facebook size={24} style={{ cursor: 'pointer' }} />
                    </div>
                    <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: '1rem' }}>
                        &copy; {new Date().getFullYear()} The Nail Nook. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
