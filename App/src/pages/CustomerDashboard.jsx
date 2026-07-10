import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, PenTool, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

const CustomerDashboard = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [designNotes, setDesignNotes] = useState('');
    const [showSaveMsg, setShowSaveMsg] = useState(false);

    useEffect(() => {
        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const myBookings = allBookings.filter(b => b.name === user.name || b.email === user.email);
        setAppointments(myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)));

        const storedNotes = localStorage.getItem(`notes_${user.email}`);
        if (storedNotes) setDesignNotes(storedNotes);
    }, [user]);

    const handleCancel = (id) => {
        if(window.confirm('Are you sure you want to cancel this appointment?')){
             const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
             const updated = allBookings.map(b => b.id === id ? { ...b, status: 'Cancelled'} : b);
             localStorage.setItem('bookings', JSON.stringify(updated));
             setAppointments(updated.filter(b => b.name === user.name || b.email === user.email).sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)));
        }
    };

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

    const handleSaveNotes = () => {
        localStorage.setItem(`notes_${user.email}`, designNotes);
        setShowSaveMsg(true);
        setTimeout(() => setShowSaveMsg(false), 2000);
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Hello, {user.name}</h1>
                    <p style={{ opacity: 0.6 }}>Manage your appointments and style preferences</p>
                </div>
                <Link to="/book" style={{
                    backgroundColor: 'var(--color-secondary)',
                    color: 'var(--color-white)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '50px',
                    fontWeight: '600',
                    fontSize: '0.9rem'
                }}>
                    New Booking
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* Appointments Section */}
                <section>
                    {(() => {
                        const now = new Date();
                        const upcoming = appointments.filter(a => new Date(`${a.date} ${a.time}`) >= now && a.status !== 'Cancelled');
                        const past = appointments.filter(a => new Date(`${a.date} ${a.time}`) < now || a.status === 'Cancelled');

                        return (
                            <>
                                <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={20} color="var(--color-primary)" /> Upcoming Appointments
                                </h2>

                                {upcoming.length === 0 ? (
                                    <div style={{
                                        backgroundColor: 'var(--color-white)',
                                        padding: '2rem',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        boxShadow: 'var(--shadow-sm)',
                                        marginBottom: '2rem'
                                    }}>
                                        <p style={{ opacity: 0.6 }}>No upcoming appointments.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                        {upcoming.map(appt => (
                                            <div key={appt.id} style={{
                                                backgroundColor: 'var(--color-white)',
                                                padding: '1.5rem',
                                                borderRadius: '12px',
                                                boxShadow: 'var(--shadow-sm)',
                                                borderLeft: '4px solid var(--color-primary)'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                                            {appt.serviceName}
                                                        </div>
                                                        <div style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1rem' }}>
                                                            {new Date(appt.date).toLocaleDateString()} at {appt.time} with {appt.techName || 'The Nail Nook'}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    <a href={generateGoogleCalendarUrl(appt)} target="_blank" rel="noopener noreferrer" style={{
                                                         display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: '#fff', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '6px', fontWeight: '500', fontSize: '0.8rem', textDecoration: 'none'
                                                    }}>
                                                        <Calendar size={14} /> Add to Calendar
                                                    </a>
                                                    <button onClick={() => handleCancel(appt.id)} style={{
                                                        backgroundColor: 'transparent', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem'
                                                    }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {past.length > 0 && (
                                    <>
                                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={20} color="#94a3b8" /> Past & Cancelled 
                                        </h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {past.map(appt => (
                                                <div key={appt.id} style={{
                                                    backgroundColor: 'var(--color-white)',
                                                    padding: '1.5rem',
                                                    borderRadius: '12px',
                                                    boxShadow: 'var(--shadow-sm)',
                                                    borderLeft: '4px solid #cbd5e1',
                                                    opacity: 0.8
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '0.25rem', color: '#475569' }}>
                                                            {appt.serviceName}
                                                        </div>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: appt.status === 'Cancelled' ? '#ef4444' : '#64748b' }}>
                                                            {appt.status || 'Completed'}
                                                        </span>
                                                    </div>
                                                    <div style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                                                        {new Date(appt.date).toLocaleDateString()} at {appt.time} with {appt.techName || 'The Nail Nook'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                </section>

                {/* Design Preferences Section */}
                <section>
                    <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PenTool size={20} color="var(--color-primary)" /> Style & Design Notes
                    </h2>

                    <div style={{
                        backgroundColor: 'var(--color-white)',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '1rem' }}>
                            Add notes about colors you love, designs you want to try, or any allergies/sensitivities.
                        </p>

                        <textarea
                            value={designNotes}
                            onChange={(e) => setDesignNotes(e.target.value)}
                            placeholder="E.g., I love pastels, want to try chrome powder next time..."
                            style={{
                                width: '100%',
                                minHeight: '150px',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid #eee',
                                fontFamily: 'inherit',
                                marginBottom: '1rem',
                                resize: 'vertical'
                            }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                                onClick={handleSaveNotes}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    backgroundColor: 'var(--color-secondary)',
                                    color: 'var(--color-white)',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '8px',
                                    fontWeight: '500',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <Save size={16} /> Save Notes
                            </button>

                            {showSaveMsg && (
                                <span style={{ color: 'green', fontSize: '0.85rem' }}>Saved!</span>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CustomerDashboard;
