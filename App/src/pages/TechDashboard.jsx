import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, FileText, X, Clock, Check, Save, Plus, Trash2, Edit2, Ban } from 'lucide-react';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DEFAULT_SCHEDULE = DAYS_OF_WEEK.map(day => ({
    day,
    isWorking: day !== 'Sunday' && day !== 'Saturday',
    startTime: '09:00',
    endTime: '17:00'
}));

const TechDashboard = () => {
    const { user } = useAuth();
    
    const [techId, setTechId] = useState(null);
    const [appointments, setAppointments] = useState([]);
    
    // Modals & Forms State
    const [selectedClientNote, setSelectedClientNote] = useState(null);
    const [editingService, setEditingService] = useState(null);

    // Data State
    const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
    const [blockedDates, setBlockedDates] = useState([]);
    const [services, setServices] = useState([]);
    const [newBlockedDate, setNewBlockedDate] = useState('');

    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [scheduleMessage, setScheduleMessage] = useState('');

    useEffect(() => {
        const techs = JSON.parse(localStorage.getItem('technicians') || '[]');
        // We find the matching tech by email, or fallback if testing locally
        const currentTech = techs.find(t => t.email === user?.email) || techs[0];
        setTechId(currentTech?.id);

        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const myBookings = allBookings.filter(b => b.techId === currentTech?.id || b.techId === 'any');
        myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
        setAppointments(myBookings);

        const savedSchedule = JSON.parse(localStorage.getItem(`schedule_${currentTech?.id}`));
        if (savedSchedule) setSchedule(savedSchedule);

        const lBlocked = JSON.parse(localStorage.getItem('blockedDates') || '[]');
        setBlockedDates(lBlocked);

        const lServices = JSON.parse(localStorage.getItem('services') || '[]');
        setServices(lServices);
    }, [user]);

    // --- APPOINTMENT ACTIONS ---
    const handleStatusChange = (apptId, status) => {
        const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const updated = allBookings.map(b => b.id === apptId ? { ...b, status } : b);
        localStorage.setItem('bookings', JSON.stringify(updated));
        
        const myBookings = updated.filter(b => b.techId === techId || b.techId === 'any');
        myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
        setAppointments(myBookings);
    };

    // --- CLIENT NOTES ACTIONS ---
    const viewClientNotes = (clientEmail) => {
        const customerText = localStorage.getItem(`notes_${clientEmail}`) || 'No notes saved by this client.';
        const internalText = localStorage.getItem(`tech_notes_${clientEmail}`) || '';
        
        setSelectedClientNote({
            email: clientEmail,
            customerText,
            internalText
        });
    };

    const saveInternalNote = () => {
        localStorage.setItem(`tech_notes_${selectedClientNote.email}`, selectedClientNote.internalText);
        const msg = document.getElementById('note-saved-msg');
        if(msg) { msg.style.opacity = 1; setTimeout(()=> msg.style.opacity = 0, 2000); }
    };

    // --- SCHEDULE ACTIONS ---
    const handleScheduleChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const saveSchedule = () => {
        setIsSavingSchedule(true);
        localStorage.setItem(`schedule_${techId}`, JSON.stringify(schedule));
        setTimeout(() => {
            setIsSavingSchedule(false);
            setScheduleMessage('Schedule saved successfully!');
            setTimeout(() => setScheduleMessage(''), 3000);
        }, 500);
    };

    // --- BLOCKED DATES ACTIONS ---
    const handleAddBlockedDate = () => {
        if (!newBlockedDate || blockedDates.includes(newBlockedDate)) return;
        const updated = [...blockedDates, newBlockedDate].sort();
        setBlockedDates(updated);
        localStorage.setItem('blockedDates', JSON.stringify(updated));
        setNewBlockedDate('');
    };

    const handleRemoveBlockedDate = (date) => {
        const updated = blockedDates.filter(d => d !== date);
        setBlockedDates(updated);
        localStorage.setItem('blockedDates', JSON.stringify(updated));
    };

    // --- SERVICES ACTIONS ---
    const handleSaveService = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        
        const newServiceObj = {
            id: editingService.id || `service-${Date.now()}`,
            name: fd.get('name'),
            price: fd.get('price'),
            duration: fd.get('duration'),
            description: fd.get('description'),
            popular: fd.get('popular') === 'on'
        };

        let updated;
        if (editingService.id) {
             updated = services.map(s => s.id === newServiceObj.id ? newServiceObj : s);
        } else {
             updated = [...services, newServiceObj];
        }
        
        setServices(updated);
        localStorage.setItem('services', JSON.stringify(updated));
        setEditingService(null);
    };

    const handleDeleteService = (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            const updated = services.filter(s => s.id !== id);
            setServices(updated);
            localStorage.setItem('services', JSON.stringify(updated));
        }
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Tech Dashboard</h1>
                <p style={{ opacity: 0.6 }}>Manage your Schedule, Services, and Clients efficiently.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                {/* 1. Appointment List */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <section>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            Appointment Schedule
                        </h2>

                        {appointments.length === 0 ? (
                            <p style={{ opacity: 0.6 }}>No appointments scheduled yet.</p>
                        ) : (
                            <div style={{
                                backgroundColor: 'var(--color-white)',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: 'var(--shadow-sm)',
                                overflowX: 'auto'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1fr auto',
                                    padding: '1rem',
                                    backgroundColor: '#f9f9f9',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    borderBottom: '1px solid #eee',
                                    minWidth: '900px'
                                }}>
                                    <div>Date & Time</div>
                                    <div>Client</div>
                                    <div>Service</div>
                                    <div>Contact</div>
                                    <div>Status</div>
                                    <div style={{ textAlign: 'right' }}>Actions</div>
                                </div>

                                {appointments.map((appt, i) => (
                                    <div key={i} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1fr auto',
                                        padding: '1rem',
                                        borderBottom: i === appointments.length - 1 ? 'none' : '1px solid #eee',
                                        fontSize: '0.9rem',
                                        alignItems: 'center',
                                        minWidth: '900px',
                                        opacity: appt.status === 'Cancelled' ? 0.6 : 1
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{new Date(appt.date).toLocaleDateString()}</div>
                                            <div style={{ opacity: 0.7, fontSize: '0.85rem' }}>{appt.time}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <User size={16} style={{ opacity: 0.5 }} /> {appt.name}
                                        </div>
                                        <div>{appt.serviceName}</div>
                                        <div style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{appt.phone}<br/>{appt.email}</div>
                                        
                                        {/* Status Dropdown */}
                                        <div>
                                            <select 
                                                value={appt.status || 'Pending'}
                                                onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                                                style={{
                                                    padding: '0.3rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ddd',
                                                    backgroundColor: appt.status === 'Completed' ? '#dcfce7' : (appt.status === 'Cancelled' ? '#fecaca' : '#fff'),
                                                    color: '#333'
                                                }}
                                                disabled={appt.status === 'Cancelled'}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Completed">Completed</option>
                                                <option value="No-Show">No-Show</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>

                                        <div style={{ textAlign: 'right' }}>
                                            <button
                                                onClick={() => viewClientNotes(appt.email)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.8rem',
                                                    backgroundColor: '#f0f0f0',
                                                    borderRadius: '4px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    color: '#333'
                                                }}
                                            >
                                                <FileText size={14} /> Notes
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* 2. Availability & Blocked Dates Settings */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        {/* Weekly Schedule Array */}
                        <section style={{
                            backgroundColor: 'var(--color-white)',
                            borderRadius: '12px',
                            padding: '2rem',
                            boxShadow: 'var(--shadow-sm)',
                            flex: '2 1 400px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={20} /> Weekly Availability
                                </h2>
                                <button
                                    onClick={saveSchedule}
                                    disabled={isSavingSchedule}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        backgroundColor: 'var(--color-primary)',
                                        color: 'var(--color-secondary)',
                                        borderRadius: '6px',
                                        border: 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        cursor: isSavingSchedule ? 'wait' : 'pointer',
                                        fontWeight: '600'
                                    }}
                                >
                                    <Save size={16} /> {isSavingSchedule ? 'Saving...' : 'Save Schedule'}
                                </button>
                            </div>

                            {scheduleMessage && (
                                <div style={{ padding: '0.75rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '6px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Check size={16} /> {scheduleMessage}
                                </div>
                            )}

                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {schedule.map((daySchedule, index) => (
                                    <div key={daySchedule.day} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '0.75rem',
                                        backgroundColor: daySchedule.isWorking ? '#fff' : '#f9f9f9',
                                        borderRadius: '8px',
                                        border: '1px solid #eee',
                                        opacity: daySchedule.isWorking ? 1 : 0.6
                                    }}>
                                        <div style={{ width: '100px', fontWeight: '500' }}>{daySchedule.day}</div>

                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={daySchedule.isWorking}
                                                onChange={(e) => handleScheduleChange(index, 'isWorking', e.target.checked)}
                                            />
                                            <span style={{ fontSize: '0.9rem' }}>{daySchedule.isWorking ? 'Work' : 'Off'}</span>
                                        </label>

                                        {daySchedule.isWorking && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                                                <input
                                                    type="time"
                                                    value={daySchedule.startTime}
                                                    onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                                    style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                                />
                                                <span style={{ color: '#666' }}>to</span>
                                                <input
                                                    type="time"
                                                    value={daySchedule.endTime}
                                                    onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                                    style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #ddd' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Blocked Dates */}
                        <section style={{
                            backgroundColor: 'var(--color-white)',
                            borderRadius: '12px',
                            padding: '2rem',
                            boxShadow: 'var(--shadow-sm)',
                            flex: '1 1 300px'
                        }}>
                            <h2 style={{ fontSize: '1.25rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Ban size={20} color="#ef4444" /> Block Dates Off
                            </h2>
                            <p style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '1rem' }}>Prevent bookings on specific calendar dates.</p>
                            
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <input 
                                    type="date" 
                                    value={newBlockedDate}
                                    onChange={(e)=>setNewBlockedDate(e.target.value)}
                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                />
                                <button onClick={handleAddBlockedDate} style={{
                                    backgroundColor: 'var(--color-secondary)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500'
                                }}>Add</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {blockedDates.length === 0 && <p style={{ opacity: 0.5, fontSize: '0.9rem', fontStyle: 'italic' }}>No blocked dates.</p>}
                                {blockedDates.map(d => (
                                    <div key={d} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#fff5f5', border: '1px solid #fee2e2', borderRadius: '6px' }}>
                                        <span style={{ fontWeight: '500', color: '#991b1b' }}>{new Date(d + 'T00:00:00').toLocaleDateString()}</span>
                                        <button onClick={() => handleRemoveBlockedDate(d)} style={{ background: 'none', color: '#ef4444' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* 3. Service & Menu Management */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                    <section style={{
                        backgroundColor: 'var(--color-white)',
                        borderRadius: '12px',
                        padding: '2rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Menu & Services Management</h2>
                            <button onClick={()=> setEditingService({})} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600'
                            }}>
                                <Plus size={16} /> Add Service
                            </button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {services.map(s => (
                                <div key={s.id} style={{ border: '1px solid #eee', padding: '1.5rem', borderRadius: '8px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{s.name}</h3>
                                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{s.price}</span>
                                    </div>
                                    <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '1rem' }}>{s.duration}</p>
                                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>{s.description}</p>
                                    
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button onClick={()=> setEditingService(s)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px' }}>
                                            <Edit2 size={14} /> Edit
                                        </button>
                                        <button onClick={()=> handleDeleteService(s.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.4rem 0.8rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px' }}>
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                    {s.popular && <span style={{ position: 'absolute', top: '-10px', right: '10px', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bolf' }}>POPULAR</span>}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Client Notes Modal Overlay */}
            {selectedClientNote && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <div style={{
                        backgroundColor: 'var(--color-white)', padding: '2rem', borderRadius: '12px', maxWidth: '600px', width: '90%', position: 'relative'
                    }}>
                        <button onClick={() => setSelectedClientNote(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none' }}>
                            <X size={20} />
                        </button>

                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} color="var(--color-primary)" /> Client File
                        </h3>
                        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#666' }}>Record for: <strong>{selectedClientNote.email}</strong></p>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Client's Design Comments:</label>
                            <div style={{ backgroundColor: '#fbfbfb', padding: '1rem', borderRadius: '8px', border: '1px solid #eee', minHeight: '60px', fontStyle: 'italic', opacity: 0.8 }}>
                                "{selectedClientNote.customerText}"
                            </div>
                        </div>

                        <div>
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem' }}>Internal Technician Notes:</label>
                            <textarea 
                                value={selectedClientNote.internalText}
                                onChange={(e) => setSelectedClientNote({...selectedClientNote, internalText: e.target.value})}
                                style={{ width: '100%', minHeight: '100px', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', resize: 'vertical' }}
                                placeholder="Allergies, preferred shape, specific polishes used..."
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                <span id="note-saved-msg" style={{ color: 'green', fontSize: '0.85rem', opacity: 0, transition: 'opacity 0.3s' }}>Internal Notes Saved!</span>
                                <button onClick={saveInternalNote} style={{
                                    backgroundColor: 'var(--color-secondary)', color: 'white', padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}>
                                    <Save size={16} /> Save Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit/Add Service Modal */}
            {editingService && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <form onSubmit={handleSaveService} style={{
                        backgroundColor: 'var(--color-white)', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '90%', position: 'relative'
                    }}>
                        <button type="button" onClick={() => setEditingService(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none' }}>
                            <X size={20} />
                        </button>

                        <h3 style={{ marginBottom: '1.5rem' }}>{editingService.id ? 'Edit Service' : 'Add New Service'}</h3>
                        
                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Service Name</label>
                                <input type="text" name="name" defaultValue={editingService.name} required style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Price</label>
                                    <input type="text" name="price" defaultValue={editingService.price} required placeholder="$50+" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Duration</label>
                                    <input type="text" name="duration" defaultValue={editingService.duration} required placeholder="60 min" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Description</label>
                                <textarea name="description" defaultValue={editingService.description} required style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', minHeight: '80px' }} />
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="checkbox" name="popular" defaultChecked={editingService.popular} />
                                <span style={{ fontSize: '0.9rem' }}>Mark as "Most Popular"</span>
                            </label>
                        </div>
                        
                        <button type="submit" style={{ width: '100%', padding: '0.8rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', borderRadius: '6px', fontWeight: 'bold' }}>
                            Save Service
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default TechDashboard;
