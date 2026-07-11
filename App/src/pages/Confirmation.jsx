import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, UserPlus, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const formatDisplayDate = (dateStr, options = undefined) => {
    if (!dateStr) return '';
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        return new Date(year, month, day).toLocaleDateString(undefined, options);
    }
    return new Date(dateStr).toLocaleDateString(undefined, options);
};

const Confirmation = () => {
    const { state } = useLocation();
    const { user } = useAuth();
    const booking = state?.booking;

    const generateGoogleCalendarUrl = (booking) => {
        const dateObj = new Date(`${booking.date} ${booking.time}`);
        const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000);
        const formatTime = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
        const start = formatTime(dateObj);
        const end = formatTime(endDateObj);
        const title = encodeURIComponent(`Nail Nook: ${booking.serviceName}`);
        const details = encodeURIComponent(`Booking with ${booking.techName || 'The Nail Nook'}`);
        const location = encodeURIComponent(`The Nail Nook, 3260 N 3450 W, Plain City, Utah 84404`);
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    };

    if (!booking) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <h2>No booking found</h2>
                <Link to="/" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>Return Home</Link>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px', textAlign: 'center' }}>
            <div style={{
                backgroundColor: 'var(--color-white)',
                padding: '3rem 2rem',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)'
            }}>
                <div style={{ color: '#4CAF50', marginBottom: '1.5rem' }}>
                    <CheckCircle size={64} style={{ margin: '0 auto' }} />
                </div>

                <h1 style={{ marginBottom: '0.5rem', color: 'var(--color-secondary)' }}>Booking Confirmed!</h1>
                <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                    Thank you, {booking.name}. Your appointment has been scheduled.
                </p>

                <div style={{
                    backgroundColor: '#fafafa',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    textAlign: 'left',
                    marginBottom: '2rem'
                }}>
                    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem', fontSize: '1.1rem' }}>
                        Appointment Details
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <div style={{ fontWeight: '600', minWidth: '80px' }}>Service:</div>
                            <div>
                                <div>{booking.serviceName}</div>
                                {booking.addons && booking.addons.length > 0 && (
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                        + {booking.addons.map(a => a.split(' (')[0]).join(', ')}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Calendar size={18} style={{ color: 'var(--color-primary)' }} />
                            <div>{formatDisplayDate(booking.date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock size={18} style={{ color: 'var(--color-primary)' }} />
                            <div>{booking.time}</div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <MapPin size={18} style={{ color: 'var(--color-primary)' }} />
                            <div>The Nail Nook<br /><span style={{ fontSize: '0.85rem', opacity: 0.7 }}>3260 N 3450 W,<br />Plain City, Utah 84404</span></div>
                        </div>
                    </div>
                </div>

                {!user ? (
                    <div style={{
                        backgroundColor: '#e6f0f9',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        textAlign: 'left',
                        border: '1px solid var(--color-primary)'
                    }}>
                        <UserPlus size={24} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-secondary)' }}>Manage Your Appointment</h4>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', opacity: 0.8 }}>
                                Want to view, change, or cancel your appointment online? You can easily do so by creating an account using the email you booked with.
                            </p>
                            <Link to="/register" style={{
                                display: 'inline-block',
                                backgroundColor: 'var(--color-secondary)',
                                color: 'var(--color-white)',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '0.9rem',
                                textDecoration: 'none'
                            }}>
                                Create an account
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#e6f0f9',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        textAlign: 'left',
                        border: '1px solid var(--color-primary)'
                    }}>
                        <Info size={24} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-secondary)' }}>Manage Your Appointment</h4>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', opacity: 0.8 }}>
                                You can view, change, or cancel your appointment anytime right from your dashboard.
                            </p>
                            <Link to="/dashboard" style={{
                                display: 'inline-block',
                                backgroundColor: 'var(--color-secondary)',
                                color: 'var(--color-white)',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '0.9rem',
                                textDecoration: 'none'
                            }}>
                                Go to Dashboard
                            </Link>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <a href={generateGoogleCalendarUrl(booking)} target="_blank" rel="noopener noreferrer" style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'var(--color-white)',
                        color: 'var(--color-primary)',
                        border: '2px solid var(--color-primary)',
                        padding: '0.7rem 1.5rem',
                        borderRadius: '50px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        transition: 'opacity 0.2s'
                    }}>
                        <Calendar size={18} /> Add to Google Calendar
                    </a>

                    <Link to="/" style={{
                        display: 'inline-block',
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-secondary)',
                        padding: '0.8rem 2rem',
                        borderRadius: '50px',
                        fontWeight: '600'
                    }}>
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Confirmation;
