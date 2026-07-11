import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, PenTool, Save, Trash2, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured, formatPhoneNumber, cleanPhoneNumber } from '../utils/supabaseClient';

const CustomerDashboard = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    
    // Appointment specific notes
    const [editingAppt, setEditingAppt] = useState(null);
    const [tempNotes, setTempNotes] = useState('');
    const [tempPictures, setTempPictures] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const filterMyBookings = (list) => {
        if (!user) return [];
        return list.filter(b => {
            const nameMatch = b.name === user.name;
            const emailMatch = user.email && b.email && b.email.toLowerCase() === user.email.toLowerCase();
            const phoneMatch = user.phone && b.phone && cleanPhoneNumber(b.phone) === cleanPhoneNumber(user.phone);
            return nameMatch || emailMatch || phoneMatch;
        });
    };

    const fetchAppointments = async () => {
        if (!user) return;
        if (isSupabaseConfigured) {
            try {
                const orConditions = [];
                if (user.name) orConditions.push(`name.eq."${user.name}"`);
                if (user.email) orConditions.push(`email.eq."${user.email}"`);
                if (user.phone) orConditions.push(`phone.eq."${cleanPhoneNumber(user.phone)}"`);

                let query = supabase.from('bookings').select('*');
                if (orConditions.length > 0) {
                    query = query.or(orConditions.join(','));
                }
                const { data: dbBookings, error } = await query;
                if (error) throw error;

                const loadedBookings = (dbBookings || []).map(b => ({
                    id: b.id,
                    service: b.service,
                    serviceName: b.service_name,
                    techId: b.tech_id,
                    techName: b.tech_name,
                    date: b.date,
                    time: b.time,
                    name: b.name,
                    phone: b.phone,
                    email: b.email,
                    status: b.status,
                    notes: b.notes,
                    pictures: b.pictures || [],
                    createdAt: b.created_at,
                    bookedBy: b.booked_by
                }));
                setAppointments(loadedBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)));
            } catch (e) {
                console.error('Error fetching appointments from Supabase, using localStorage fallback:', e);
                const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                const myBookings = filterMyBookings(allBookings);
                setAppointments(myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)));
            }
        } else {
            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const myBookings = filterMyBookings(allBookings);
            setAppointments(myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)));
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [user]);

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 500;
                    const MAX_HEIGHT = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        });
    };

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setIsUploading(true);

        const promises = files.map(file => compressImage(file));
        const compressedBase64s = await Promise.all(promises);

        setTempPictures(prev => [...prev, ...compressedBase64s]);
        setIsUploading(false);
        e.target.value = '';
    };

    const handleSaveApptNotes = async () => {
        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase
                    .from('bookings')
                    .update({ notes: tempNotes, pictures: tempPictures })
                    .eq('id', editingAppt.id);
                if (error) {
                    console.error('Error updating notes in Supabase:', error);
                }
            } catch (e) {
                console.error('Error saving notes:', e);
            }
            await fetchAppointments();
        } else {
            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const updated = allBookings.map(b => b.id === editingAppt.id ? { ...b, notes: tempNotes, pictures: tempPictures } : b);
            localStorage.setItem('bookings', JSON.stringify(updated));
            setAppointments(filterMyBookings(updated).sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)));
        }
        setEditingAppt(null);
    };

    const handleDeleteApptNotes = async (apptId) => {
        if (window.confirm('Are you sure you want to delete the notes and photos for this appointment?')) {
            if (isSupabaseConfigured) {
                try {
                    const { error } = await supabase
                        .from('bookings')
                        .update({ notes: '', pictures: [] })
                        .eq('id', apptId);
                    if (error) {
                        console.error('Error deleting notes in Supabase:', error);
                    }
                } catch (e) {
                    console.error('Error deleting notes:', e);
                }
                await fetchAppointments();
            } else {
                const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                const updated = allBookings.map(b => b.id === apptId ? { ...b, notes: '', pictures: [] } : b);
                localStorage.setItem('bookings', JSON.stringify(updated));
                setAppointments(filterMyBookings(updated).sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)));
            }
        }
    };

    const handleCancel = async (id) => {
        if(window.confirm('Are you sure you want to cancel this appointment?')){
            if (isSupabaseConfigured) {
                try {
                    const { error } = await supabase
                        .from('bookings')
                        .update({ status: 'Cancelled' })
                        .eq('id', id);
                    if (error) {
                        console.error('Error cancelling appointment in Supabase:', error);
                    }
                } catch (e) {
                    console.error('Error cancelling appointment:', e);
                }
                await fetchAppointments();
            } else {
                 const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                 const updated = allBookings.map(b => b.id === id ? { ...b, status: 'Cancelled'} : b);
                 localStorage.setItem('bookings', JSON.stringify(updated));
                 setAppointments(filterMyBookings(updated).sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`)));
            }
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

                                                {/* Appointment specific previews */}
                                                {(appt.notes || (appt.pictures && appt.pictures.length > 0)) && (
                                                    <div style={{ margin: '0.5rem 0 1.25rem 0', padding: '1rem', backgroundColor: '#fafafa', border: '1px solid #eee', borderRadius: '8px' }}>
                                                        {appt.notes && (
                                                            <p style={{ fontSize: '0.85rem', margin: '0 0 0.75rem 0', fontStyle: 'italic', color: '#555' }}>
                                                                "{(appt.notes.length > 80 ? appt.notes.substring(0, 80) + '...' : appt.notes)}"
                                                            </p>
                                                        )}
                                                        {appt.pictures && appt.pictures.length > 0 && (
                                                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                                                                {appt.pictures.map((pic, idx) => (
                                                                    <img key={idx} src={pic} alt="Design reference" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }} />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <a href={generateGoogleCalendarUrl(appt)} target="_blank" rel="noopener noreferrer" style={{
                                                         display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: '#fff', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '6px', fontWeight: '500', fontSize: '0.8rem', textDecoration: 'none'
                                                    }}>
                                                        <Calendar size={14} /> Add to Calendar
                                                    </a>
                                                    
                                                    <button 
                                                        onClick={() => {
                                                            setEditingAppt(appt);
                                                            setTempNotes(appt.notes || '');
                                                            setTempPictures(appt.pictures || []);
                                                        }}
                                                        style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', backgroundColor: 'var(--color-secondary)', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: '500', fontSize: '0.8rem', cursor: 'pointer'
                                                        }}
                                                    >
                                                        <PenTool size={14} /> Design Details
                                                    </button>

                                                    <button onClick={() => handleCancel(appt.id)} style={{
                                                         backgroundColor: 'transparent', border: 'none', color: '#ef4444', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem', marginLeft: 'auto'
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
                                        <h2 style={{ fontSize: '1.25rem', margin: '2rem 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                                    <div style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: (appt.notes || (appt.pictures && appt.pictures.length > 0)) ? '1rem' : '0' }}>
                                                        {new Date(appt.date).toLocaleDateString()} at {appt.time} with {appt.techName || 'The Nail Nook'}
                                                    </div>

                                                    {(appt.notes || (appt.pictures && appt.pictures.length > 0)) && (
                                                        <div style={{ margin: '1rem 0 0 0', padding: '1rem', backgroundColor: '#fafafa', border: '1px solid #eee', borderRadius: '8px' }}>
                                                            {appt.notes && (
                                                                <p style={{ fontSize: '0.85rem', margin: '0 0 0.75rem 0', fontStyle: 'italic', color: '#666' }}>
                                                                    "{appt.notes}"
                                                                </p>
                                                            )}
                                                            {appt.pictures && appt.pictures.length > 0 && (
                                                                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
                                                                    {appt.pictures.map((pic, idx) => (
                                                                        <img key={idx} src={pic} alt="Design reference" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #ddd' }} />
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <button 
                                                                onClick={() => handleDeleteApptNotes(appt.id)}
                                                                style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.75rem', padding: '0.3rem 0.6rem', backgroundColor: '#fee2e2', border: 'none', color: '#b91c1c', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer'
                                                                }}
                                                            >
                                                                <Trash2 size={12} /> Delete Notes & Photos
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                </section>
            </div>

            {/* Modal for editing appointment notes and photos */}
            {editingAppt && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-white)', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '90%', position: 'relative'
                    }}>
                        <button type="button" onClick={() => setEditingAppt(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>

                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-primary)' }}>Appointment Design Details</h3>
                        <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1.5rem' }}>
                            {editingAppt.serviceName} — {new Date(editingAppt.date).toLocaleDateString()}
                        </p>

                        <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Add notes for the technician:</label>
                                <textarea
                                    value={tempNotes}
                                    onChange={(e) => setTempNotes(e.target.value)}
                                    placeholder="Enter your design request, colors, shapes, patterns..."
                                    style={{ width: '100%', minHeight: '100px', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', fontFamily: 'inherit', resize: 'vertical' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', fontWeight: '500' }}>Reference Photos (Inspirations):</label>
                                
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    {/* Upload trigger */}
                                    <label style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '8px',
                                        border: '2px dashed #ccc',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        cursor: isUploading ? 'wait' : 'pointer',
                                        opacity: isUploading ? 0.6 : 1,
                                        backgroundColor: '#fafafa',
                                        color: '#666',
                                        transition: 'border-color 0.2s'
                                    }}>
                                        <Upload size={18} />
                                        <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>{isUploading ? '...' : 'Upload'}</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            multiple 
                                            onChange={handlePhotoUpload} 
                                            disabled={isUploading}
                                            style={{ display: 'none' }} 
                                        />
                                    </label>

                                    {/* Thumbnails grid */}
                                    {tempPictures.map((pic, idx) => (
                                        <div key={idx} style={{ width: '64px', height: '64px', position: 'relative', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden' }}>
                                            <img src={pic} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button 
                                                type="button"
                                                onClick={() => setTempPictures(prev => prev.filter((_, i) => i !== idx))}
                                                style={{
                                                    position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', padding: '0'
                                                }}
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleSaveApptNotes}
                            style={{ width: '100%', padding: '0.8rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            Save Design Details
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDashboard;
