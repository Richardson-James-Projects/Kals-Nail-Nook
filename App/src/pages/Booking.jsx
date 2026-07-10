import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Phone, Users, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

    useEffect(() => {
        if (user && !isBookingForSomeoneElse) {
            setFormData(prev => ({ ...prev, name: user.name || '', phone: user.phone || '' }));
        }

        const loadedServices = JSON.parse(localStorage.getItem('services') || '[]');
        setServices(loadedServices);

        if (loadedServices.length > 0 && !formData.service) { // Ensure initial service is set
             setFormData(prev => ({ ...prev, service: searchParams.get('service') || loadedServices[0].id }));
        }

        const loadedTechs = JSON.parse(localStorage.getItem('technicians') || '[]');
        setTechnicians(loadedTechs);

        const loadedBlocked = JSON.parse(localStorage.getItem('blockedDates') || '[]');
        setBlockedDates(loadedBlocked);

        const schedules = {};
        loadedTechs.forEach(t => {
            schedules[t.id] = JSON.parse(localStorage.getItem(`schedule_${t.id}`) || '[]');
        });
        setTechSchedules(schedules);

        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        setExistingBookings(bookings);
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
            status: 'Pending'
        };

        const currentBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        localStorage.setItem('bookings', JSON.stringify([...currentBookings, booking]));

        navigate('/confirmation', { state: { booking } });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
