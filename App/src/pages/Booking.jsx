import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Phone, Users, Lock, PenTool, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { supabase, isSupabaseConfigured, formatPhoneNumber, cleanPhoneNumber } from '../utils/supabaseClient';

const timeSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

const Booking = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [services, setServices] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [blockedDates, setBlockedDates] = useState([]);
    const [techSchedules, setTechSchedules] = useState({});

    const [formData, setFormData] = useState({
        service: searchParams.get('service') || '',
        techId: 'any',
        date: '',
        time: '',
        name: '',
        phone: ''
    });

    const [isBookingForSomeoneElse, setIsBookingForSomeoneElse] = useState(false);
    const [existingBookings, setExistingBookings] = useState([]);

    // Design Details state
    const [designNotes, setDesignNotes] = useState('');
    const [designPictures, setDesignPictures] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (user && !isBookingForSomeoneElse) {
            setFormData(prev => ({ ...prev, name: user.name || '', phone: user.phone || '' }));
        }

        const loadData = async () => {
            if (isSupabaseConfigured) {
                try {
                    // Fetch services
                    const { data: dbServices } = await supabase.from('services').select('*');
                    const loadedServices = dbServices || [];
                    setServices(loadedServices);
                    if (loadedServices.length > 0 && !formData.service) {
                        setFormData(prev => ({ ...prev, service: searchParams.get('service') || loadedServices[0].id }));
                    }

                    // Fetch technicians
                    const { data: dbTechs } = await supabase.from('technicians').select('*');
                    const loadedTechs = dbTechs || [];
                    setTechnicians(loadedTechs);

                    // Fetch schedules
                    const { data: dbSchedules } = await supabase.from('schedules').select('*');
                    const schedules = {};
                    loadedTechs.forEach(t => {
                        schedules[t.id] = [];
                    });
                    if (dbSchedules) {
                        dbSchedules.forEach(s => {
                            if (schedules[s.tech_id]) {
                                schedules[s.tech_id].push({
                                    day: s.day,
                                    isWorking: s.is_working,
                                    startTime: s.start_time,
                                    endTime: s.end_time
                                });
                            }
                        });
                    }
                    setTechSchedules(schedules);

                    // Fetch existing bookings
                    const { data: dbBookings } = await supabase
                        .from('bookings')
                        .select('*')
                        .neq('status', 'Cancelled');
                    
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
                    setExistingBookings(loadedBookings);

                    // Fetch blocked dates
                    const { data: dbBlocked } = await supabase.from('blocked_dates').select('*');
                    const loadedBlocked = (dbBlocked || []).map(d => d.date);
                    setBlockedDates(loadedBlocked);

                } catch (e) {
                    console.error('Error fetching data from Supabase:', e);
                }
            } else {
                const loadedServices = JSON.parse(localStorage.getItem('services') || '[]');
                setServices(loadedServices);
                if (loadedServices.length > 0 && !formData.service) {
                    setFormData(prev => ({ ...prev, service: searchParams.get('service') || loadedServices[0].id }));
                }

                const loadedTechs = JSON.parse(localStorage.getItem('technicians') || '[]');
                setTechnicians(loadedTechs);

                const schedules = {};
                loadedTechs.forEach(t => {
                    schedules[t.id] = JSON.parse(localStorage.getItem(`schedule_${t.id}`) || '[]');
                });
                setTechSchedules(schedules);

                const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                setExistingBookings(bookings);

                const loadedBlocked = JSON.parse(localStorage.getItem('blockedDates') || '[]');
                setBlockedDates(loadedBlocked);
            }
        };

        loadData();
    }, [user, isBookingForSomeoneElse, searchParams]);

    const toggleBookingForSomeoneElse = () => {
        setIsBookingForSomeoneElse(!isBookingForSomeoneElse);
        if (!isBookingForSomeoneElse) {
            // Switching TO booking for someone else: clear fields
            setFormData(prev => ({ ...prev, name: '', phone: '' }));
        } else {
            // Switching BACK to self: refill
            setFormData(prev => ({
                ...prev,
                name: user?.name || '',
                phone: user?.phone || ''
            }));
        }
    };

    const isSlotAvailable = (date, time) => {
        if (!date) return true;
        if (blockedDates.includes(date)) return false;

        const dateObj = new Date(date + 'T00:00:00');
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const slotTime24 = convertTo24Hour(time);
        const concurrentBookings = existingBookings.filter(b => b.date === date && b.time === time && b.status !== 'Cancelled');

        if (formData.techId === 'any') {
             let workingTechs = 0;
             technicians.forEach(t => {
                 const sched = techSchedules[t.id];
                 if (sched) {
                     const ds = sched.find(d => d.day === dayName);
                     if (ds && ds.isWorking) {
                         const start = parseInt(ds.startTime.replace(':', ''));
                         const end = parseInt(ds.endTime.replace(':', ''));
                         if (slotTime24 >= start && slotTime24 < end) workingTechs++;
                     }
                 }
             });
             return workingTechs > concurrentBookings.length;
        } else {
             const schedule = techSchedules[formData.techId];
             if (!schedule) return false;
             
             const ds = schedule.find(d => d.day === dayName);
             if (!ds || !ds.isWorking) return false;
             
             const start = parseInt(ds.startTime.replace(':', ''));
             const end = parseInt(ds.endTime.replace(':', ''));
             if (slotTime24 < start || slotTime24 >= end) return false;

             const isBooked = concurrentBookings.some(b => b.techId === formData.techId);
             if (isBooked) return false;
             return true;
        }
    };

    // Helper to convert "09:00 AM" to 900
    const convertTo24Hour = (timeStr) => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }
        return parseInt(hours + minutes, 10);
    };

    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 500;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                    else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
            };
        });
    };

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setIsUploading(true);
        const compressed = await Promise.all(files.map(f => compressImage(f)));
        setDesignPictures(prev => [...prev, ...compressed]);
        setIsUploading(false);
        e.target.value = '';
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let assignedTechId = formData.techId;
        if (assignedTechId === 'any') {
            const dateObj = new Date(formData.date + 'T00:00:00');
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
            const slotTime24 = convertTo24Hour(formData.time);
            const concurrent = existingBookings.filter(b => b.date === formData.date && b.time === formData.time && b.status !== 'Cancelled');
            
            const availableTech = technicians.find(t => {
                 const ds = techSchedules[t.id]?.find(d => d.day === dayName);
                 if (!ds || !ds.isWorking) return false;
                 if (slotTime24 < parseInt(ds.startTime.replace(':', '')) || slotTime24 >= parseInt(ds.endTime.replace(':', ''))) return false;
                 if (concurrent.some(b => b.techId === t.id)) return false;
                 return true;
            });
            assignedTechId = availableTech ? availableTech.id : technicians[0]?.id;
        }

        const techObj = technicians.find(t => t.id === assignedTechId);

        const booking = {
            id: Date.now().toString(),
            ...formData,
            techId: assignedTechId,
            techName: techObj ? techObj.name : 'Booking',
            serviceName: services.find(s => s.id === formData.service)?.name,
            createdAt: new Date().toISOString(),
            email: user?.email || 'guest@example.com',
            bookedBy: user?.email,
            status: 'Pending',
            notes: designNotes,
            pictures: designPictures
        };

        const saveBooking = async () => {
            if (isSupabaseConfigured) {
                const dbBooking = {
                    id: booking.id,
                    service: booking.service,
                    service_name: booking.serviceName,
                    tech_id: booking.techId,
                    tech_name: booking.techName,
                    date: booking.date,
                    time: booking.time,
                    name: booking.name,
                    phone: cleanPhoneNumber(booking.phone),
                    email: booking.email,
                    status: booking.status,
                    notes: booking.notes,
                    pictures: booking.pictures,
                    created_at: booking.createdAt,
                    booked_by: booking.bookedBy
                };
                const { error } = await supabase.from('bookings').insert([dbBooking]);
                if (error) {
                    console.error('Error inserting booking in Supabase:', error);
                }
            } else {
                const currentBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                localStorage.setItem('bookings', JSON.stringify([...currentBookings, booking]));
            }
            navigate('/confirmation', { state: { booking } });
        };

        saveBooking();
    };

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'phone') {
            value = formatPhoneNumber(value);
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px' }}>
            <h1 style={{
                textAlign: 'center',
                color: 'var(--color-primary)',
                marginBottom: '2rem'
            }}>Book Appointment</h1>

            <form onSubmit={handleSubmit} style={{
                backgroundColor: 'var(--color-white)',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)'
            }}>
                {/* Service & Technician Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Service</label>
                        <select
                            name="service"
                            value={formData.service}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', appearance: 'none' }}
                            required
                        >
                            <option value="" disabled>Choose a service...</option>
                            {services.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Technician</label>
                        <select
                            name="techId"
                            value={formData.techId}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, techId: e.target.value, time: '' }));
                            }}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fff', appearance: 'none' }}
                        >
                            <option value="any">No Preference</option>
                            {technicians.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date & Time Selection */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            <Calendar size={16} style={{ display: 'inline', marginRight: '5px' }} /> Date
                        </label>
                        <input
                            type="date"
                            name="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={formData.date}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            <Clock size={16} style={{ display: 'inline', marginRight: '5px' }} /> Time
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {timeSlots.map(time => {
                                const available = isSlotAvailable(formData.date, time);
                                const isSelected = formData.time === time;

                                return (
                                    <button
                                        key={time}
                                        type="button"
                                        disabled={!available}
                                        onClick={() => available && setFormData({ ...formData, time })}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: '20px',
                                            border: isSelected ? '1px solid var(--color-primary)' : '1px solid #ddd',
                                            backgroundColor: isSelected ? 'var(--color-primary)' : (available ? '#fff' : '#f5f5f5'),
                                            color: isSelected ? '#fff' : (available ? '#333' : '#aaa'),
                                            fontSize: '0.875rem',
                                            cursor: available ? 'pointer' : 'not-allowed',
                                            textDecoration: available ? 'none' : 'line-through'
                                        }}
                                    >
                                        {time}
                                    </button>
                                );
                            })}
                        </div>
                        <input type="hidden" name="time" value={formData.time} required />
                    </div>
                </div>

                {/* Contact Info */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Your Details</h3>
                        {user && (
                            <button
                                type="button"
                                onClick={toggleBookingForSomeoneElse}
                                style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--color-primary)',
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--color-primary)',
                                    borderRadius: '20px',
                                    padding: '0.4rem 0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <Users size={16} />
                                {isBookingForSomeoneElse ? 'Book for myself' : 'Book for someone else'}
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                {user && !isBookingForSomeoneElse ? (
                                    <Lock size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--color-primary)' }} />
                                ) : (
                                    <User size={18} style={{ position: 'absolute', left: '10px', top: '12px', opacity: 0.5 }} />
                                )}
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    placeholder="Jane Doe"
                                    value={formData.name}
                                    onChange={handleChange}
                                    readOnly={user && !isBookingForSomeoneElse}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                        borderRadius: '8px',
                                        // Distinct styling for read-only vs editable
                                        border: (user && !isBookingForSomeoneElse) ? '2px solid var(--color-primary)' : '1px solid #ddd',
                                        backgroundColor: (user && !isBookingForSomeoneElse) ? '#F0F4F8' : '#fff', // Light dusty blue bg
                                        color: (user && !isBookingForSomeoneElse) ? '#333' : 'inherit',
                                        fontWeight: (user && !isBookingForSomeoneElse) ? '600' : '400',
                                        cursor: (user && !isBookingForSomeoneElse) ? 'default' : 'text'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone Number</label>
                            <div style={{ position: 'relative' }}>
                                {user && !isBookingForSomeoneElse ? (
                                    <Lock size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--color-primary)' }} />
                                ) : (
                                    <Phone size={18} style={{ position: 'absolute', left: '10px', top: '12px', opacity: 0.5 }} />
                                )}
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    placeholder="(555) 123-4567"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    readOnly={user && !isBookingForSomeoneElse}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                        borderRadius: '8px',
                                        // Distinct styling for read-only vs editable
                                        border: (user && !isBookingForSomeoneElse) ? '2px solid var(--color-primary)' : '1px solid #ddd',
                                        backgroundColor: (user && !isBookingForSomeoneElse) ? '#F0F4F8' : '#fff', // Light dusty blue bg
                                        color: (user && !isBookingForSomeoneElse) ? '#333' : 'inherit',
                                        fontWeight: (user && !isBookingForSomeoneElse) ? '600' : '400',
                                        cursor: (user && !isBookingForSomeoneElse) ? 'default' : 'text'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Design Details */}
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PenTool size={18} color="var(--color-primary)" /> Design Details
                        <span style={{ fontSize: '0.8rem', fontWeight: '400', opacity: 0.6, marginLeft: '0.25rem' }}>(optional)</span>
                    </h3>
                    <p style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '1rem' }}>
                        Share any inspiration notes or reference photos so your technician can prepare.
                    </p>

                    <textarea
                        value={designNotes}
                        onChange={(e) => setDesignNotes(e.target.value)}
                        placeholder="E.g., chrome french tips with star accents, pastel pink base..."
                        style={{
                            width: '100%',
                            minHeight: '90px',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: '1px solid #ddd',
                            fontFamily: 'inherit',
                            marginBottom: '1rem',
                            resize: 'vertical',
                            fontSize: '0.9rem'
                        }}
                    />

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>Reference Photos:</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-start' }}>
                            {/* Upload trigger tile */}
                            <label style={{
                                width: '64px', height: '64px', borderRadius: '8px',
                                border: '2px dashed #ccc', display: 'flex', flexDirection: 'column',
                                justifyContent: 'center', alignItems: 'center',
                                cursor: isUploading ? 'wait' : 'pointer',
                                opacity: isUploading ? 0.6 : 1,
                                backgroundColor: '#fafafa', color: '#888'
                            }}>
                                <Upload size={18} />
                                <span style={{ fontSize: '0.65rem', marginTop: '2px' }}>{isUploading ? '...' : 'Upload'}</span>
                                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={isUploading} style={{ display: 'none' }} />
                            </label>

                            {/* Thumbnail grid */}
                            {designPictures.map((pic, idx) => (
                                <div key={idx} style={{ width: '64px', height: '64px', position: 'relative', borderRadius: '8px', border: '1px solid #eee', overflow: 'hidden' }}>
                                    <img src={pic} alt="design ref" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        type="button"
                                        onClick={() => setDesignPictures(prev => prev.filter((_, i) => i !== idx))}
                                        style={{
                                            position: 'absolute', top: '2px', right: '2px',
                                            backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff',
                                            border: 'none', borderRadius: '50%', width: '16px', height: '16px',
                                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                                            cursor: 'pointer', padding: 0
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
                    type="submit"
                    disabled={!formData.time || !formData.date}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        backgroundColor: 'var(--color-secondary)',
                        color: 'var(--color-white)',
                        borderRadius: '8px',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        opacity: (!formData.time || !formData.date) ? 0.7 : 1,
                        cursor: (!formData.time || !formData.date) ? 'not-allowed' : 'pointer'
                    }}
                >
                    Confirm Appointment
                </button>
            </form>
        </div>
    );
};

export default Booking;
