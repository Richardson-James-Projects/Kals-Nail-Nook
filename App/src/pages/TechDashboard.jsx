import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, User, Users, FileText, X, Clock, Check, Save, Plus, Trash2, Edit2, Ban, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';
import { hashPassword } from '../utils/crypto';
import { supabase, isSupabaseConfigured, formatPhoneNumber, cleanPhoneNumber } from '../utils/supabaseClient';

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
    const [servicePictures, setServicePictures] = useState([]);
    const [isUploadingServicePhotos, setIsUploadingServicePhotos] = useState(false);

    const openServiceModal = (service = null) => {
        if (service) {
            setEditingService(service);
            setServicePictures(service.images || []);
        } else {
            setEditingService({});
            setServicePictures([]);
        }
    };

    // Data State
    const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
    const [blockedDates, setBlockedDates] = useState([]);
    const [services, setServices] = useState([]);
    const [newBlockedDate, setNewBlockedDate] = useState('');
    const [allBookingsList, setAllBookingsList] = useState([]);

    const [isSavingSchedule, setIsSavingSchedule] = useState(false);
    const [scheduleMessage, setScheduleMessage] = useState('');

    const [usersList, setUsersList] = useState([]);
    const [searchUserQuery, setSearchUserQuery] = useState('');
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [addUserError, setAddUserError] = useState('');
    const [addUserPhone, setAddUserPhone] = useState('');

    // Booking appointment state
    const [technicians, setTechnicians] = useState([]);
    const [isBookingAppt, setIsBookingAppt] = useState(false);
    const [bookingError, setBookingError] = useState('');
    const [bookingClientType, setBookingClientType] = useState('guest');
    const [selectedClientUser, setSelectedClientUser] = useState('');
    const [bookingFormData, setBookingFormData] = useState({
        service: '',
        techId: '',
        date: '',
        time: '09:00 AM',
        guestName: '',
        guestPhone: '',
        guestEmail: ''
    });

    const TIME_SLOTS = [
        '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    const fetchDashboardData = async (currentTechId) => {
        if (isSupabaseConfigured) {
            try {
                // Fetch technicians
                const { data: dbTechs, error: errTechs } = await supabase.from('technicians').select('*');
                if (errTechs) throw errTechs;
                const loadedTechs = dbTechs || [];
                setTechnicians(loadedTechs);

                // Find matching tech by email
                const matchingTech = loadedTechs.find(t => t.email === user?.email) || loadedTechs[0];
                const activeTechId = currentTechId || matchingTech?.id;
                setTechId(activeTechId);

                // Fetch bookings
                const { data: dbBookings, error: errBookings } = await supabase.from('bookings').select('*');
                if (errBookings) throw errBookings;
                
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
                    bookedBy: b.booked_by,
                    techDismissed: b.tech_dismissed || false
                }));
                setAllBookingsList(loadedBookings);

                const filteredBookings = loadedBookings.filter(b => (b.techId === activeTechId || b.techId === 'any') && !b.techDismissed);
                filteredBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
                setAppointments(filteredBookings);

                // Fetch schedules
                if (activeTechId) {
                    const { data: dbSchedules, error: errSchedules } = await supabase
                        .from('schedules')
                        .select('*')
                        .eq('tech_id', activeTechId);
                    if (errSchedules) throw errSchedules;
                    
                    if (dbSchedules && dbSchedules.length > 0) {
                        // Map db rows back to schedule format sorted by day of week index
                        const daysIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const mappedSchedule = dbSchedules.map(s => ({
                            day: s.day,
                            isWorking: s.is_working,
                            startTime: s.start_time,
                            endTime: s.end_time
                        })).sort((a, b) => daysIndex.indexOf(a.day) - daysIndex.indexOf(b.day));
                        setSchedule(mappedSchedule);
                    } else {
                        setSchedule(DEFAULT_SCHEDULE);
                    }
                }

                // Fetch services
                const { data: dbServices, error: errServices } = await supabase.from('services').select('*').order('sort_order', { ascending: true });
                if (errServices) throw errServices;
                setServices(dbServices || []);

                // Fetch users
                const { data: dbUsers, error: errUsers } = await supabase.from('nail_nook_users').select('*');
                if (errUsers) throw errUsers;
                const loadedUsers = (dbUsers || []).map(u => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    role: u.role,
                    requiresPasswordReset: u.requires_password_reset
                }));
                setUsersList(loadedUsers);

                // Fetch blocked dates
                const { data: dbBlocked, error: errBlocked } = await supabase.from('blocked_dates').select('*');
                if (errBlocked) throw errBlocked;
                const loadedBlocked = (dbBlocked || []).map(d => d.date);
                setBlockedDates(loadedBlocked);

            } catch (e) {
                console.error('Error fetching dashboard data from Supabase, using fallback:', e);
                const techs = JSON.parse(localStorage.getItem('technicians') || '[]');
                const matchingTech = techs.find(t => t.email === user?.email) || techs[0];
                const activeTechId = currentTechId || matchingTech?.id;
                setTechId(activeTechId);

                const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                const mappedBookings = allBookings.map(b => ({
                    ...b,
                    techDismissed: b.techDismissed || false
                }));
                setAllBookingsList(mappedBookings);
                const myBookings = mappedBookings.filter(b => (b.techId === activeTechId || b.techId === 'any') && !b.techDismissed);
                myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
                setAppointments(myBookings);

                const savedSchedule = JSON.parse(localStorage.getItem(`schedule_${activeTechId}`));
                if (savedSchedule) setSchedule(savedSchedule);

                const lServices = JSON.parse(localStorage.getItem('services') || '[]');
                lServices.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                setServices(lServices);

                const allUsers = JSON.parse(localStorage.getItem('nail_nook_users') || '[]');
                setUsersList(allUsers);
                setTechnicians(techs);

                const lBlocked = JSON.parse(localStorage.getItem('blockedDates') || '[]');
                setBlockedDates(lBlocked);
            }
        } else {
            const techs = JSON.parse(localStorage.getItem('technicians') || '[]');
            const matchingTech = techs.find(t => t.email === user?.email) || techs[0];
            const activeTechId = currentTechId || matchingTech?.id;
            setTechId(activeTechId);

            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const mappedBookings = allBookings.map(b => ({
                ...b,
                techDismissed: b.techDismissed || false
            }));
            setAllBookingsList(mappedBookings);
            const myBookings = mappedBookings.filter(b => (b.techId === activeTechId || b.techId === 'any') && !b.techDismissed);
            myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
            setAppointments(myBookings);

            const savedSchedule = JSON.parse(localStorage.getItem(`schedule_${activeTechId}`));
            if (savedSchedule) setSchedule(savedSchedule);

            const lServices = JSON.parse(localStorage.getItem('services') || '[]');
            lServices.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            setServices(lServices);

            const allUsers = JSON.parse(localStorage.getItem('nail_nook_users') || '[]');
            setUsersList(allUsers);
            setTechnicians(techs);

            const lBlocked = JSON.parse(localStorage.getItem('blockedDates') || '[]');
            setBlockedDates(lBlocked);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    // --- APPOINTMENT ACTIONS ---
    const handleStatusChange = async (apptId, status) => {
        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase
                    .from('bookings')
                    .update({ status })
                    .eq('id', apptId);
                if (error) console.error('Error updating status in Supabase:', error);
            } catch (e) {
                console.error('Error saving status:', e);
            }
            await fetchDashboardData(techId);
        } else {
            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const updated = allBookings.map(b => b.id === apptId ? { ...b, status } : b);
            localStorage.setItem('bookings', JSON.stringify(updated));
            
            const myBookings = updated.filter(b => (b.techId === techId || b.techId === 'any') && !b.techDismissed);
            myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
            setAppointments(myBookings);
        }
    };

    const handleDismissBooking = async (apptId) => {
        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase
                    .from('bookings')
                    .update({ tech_dismissed: true })
                    .eq('id', apptId);
                if (error) console.error('Error dismissing booking in Supabase:', error);
            } catch (e) {
                console.error('Error dismissing booking:', e);
            }
            await fetchDashboardData(techId);
        } else {
            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const updated = allBookings.map(b => b.id === apptId ? { ...b, techDismissed: true } : b);
            localStorage.setItem('bookings', JSON.stringify(updated));
            
            const mappedBookings = updated.map(b => ({
                ...b,
                techDismissed: b.techDismissed || false
            }));
            setAllBookingsList(mappedBookings);
            
            const myBookings = mappedBookings.filter(b => (b.techId === techId || b.techId === 'any') && !b.techDismissed);
            myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
            setAppointments(myBookings);
        }
    };

    // --- CLIENT NOTES ACTIONS ---
    const viewClientNotes = async (appt) => {
        let internalText = '';
        if (isSupabaseConfigured) {
            try {
                const { data } = await supabase
                    .from('tech_notes')
                    .select('note_text')
                    .eq('email', appt.email)
                    .maybeSingle();
                internalText = data ? data.note_text : '';
            } catch (e) {
                console.error('Error reading internal notes:', e);
            }
        } else {
            internalText = localStorage.getItem(`tech_notes_${appt.email}`) || '';
        }

        setSelectedClientNote({
            apptId: appt.id,
            name: appt.name,
            email: appt.email,
            customerText: appt.notes || 'No specific notes added for this appointment.',
            customerPictures: appt.pictures || [],
            internalText
        });
    };

    const saveInternalNote = async () => {
        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase
                    .from('tech_notes')
                    .upsert({ email: selectedClientNote.email, note_text: selectedClientNote.internalText });
                if (error) console.error('Error upserting internal notes in Supabase:', error);
            } catch (e) {
                console.error('Error saving internal notes:', e);
            }
        } else {
            localStorage.setItem(`tech_notes_${selectedClientNote.email}`, selectedClientNote.internalText);
        }
        setSelectedClientNote(null);
    };

    // Opens private tech notes for a user without appointment context
    const openUserNotes = async (u) => {
        let internalText = '';
        if (isSupabaseConfigured) {
            try {
                const { data } = await supabase
                    .from('tech_notes')
                    .select('note_text')
                    .eq('email', u.email)
                    .maybeSingle();
                internalText = data ? data.note_text : '';
            } catch (e) {
                console.error('Error reading internal notes:', e);
            }
        } else {
            internalText = localStorage.getItem(`tech_notes_${u.email}`) || '';
        }

        setSelectedClientNote({
            name: u.name,
            email: u.email,
            customerText: null,       // null signals: no appointment note to show
            customerPictures: [],
            internalText
        });
    };

    // --- SCHEDULE ACTIONS ---
    const handleScheduleChange = (index, field, value) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const saveSchedule = async () => {
        setIsSavingSchedule(true);
        if (isSupabaseConfigured) {
            try {
                for (const s of schedule) {
                    await supabase
                        .from('schedules')
                        .upsert({
                            tech_id: techId,
                            day: s.day,
                            is_working: s.isWorking,
                            start_time: s.startTime,
                            end_time: s.endTime
                        }, { onConflict: 'tech_id,day' });
                }
            } catch (e) {
                console.error('Error saving schedule in Supabase:', e);
            }
        } else {
            localStorage.setItem(`schedule_${techId}`, JSON.stringify(schedule));
        }

        setTimeout(() => {
            setIsSavingSchedule(false);
            setScheduleMessage('Schedule saved successfully!');
            setTimeout(() => setScheduleMessage(''), 3000);
        }, 500);
    };

    // --- BLOCKED DATES ACTIONS ---
    const handleAddBlockedDate = async () => {
        if (!newBlockedDate || blockedDates.includes(newBlockedDate)) return;
        
        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase
                    .from('blocked_dates')
                    .insert([{ date: newBlockedDate }]);
                if (error) console.error('Error inserting blocked date in Supabase:', error);
            } catch (e) {
                console.error('Error adding blocked date:', e);
            }
            await fetchDashboardData(techId);
        } else {
            const updated = [...blockedDates, newBlockedDate].sort();
            setBlockedDates(updated);
            localStorage.setItem('blockedDates', JSON.stringify(updated));
        }
        setNewBlockedDate('');
    };

    const handleRemoveBlockedDate = async (date) => {
        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase
                    .from('blocked_dates')
                    .delete()
                    .eq('date', date);
                if (error) console.error('Error deleting blocked date in Supabase:', error);
            } catch (e) {
                console.error('Error removing blocked date:', e);
            }
            await fetchDashboardData(techId);
        } else {
            const updated = blockedDates.filter(d => d !== date);
            setBlockedDates(updated);
            localStorage.setItem('blockedDates', JSON.stringify(updated));
        }
    };

    // --- SERVICES ACTIONS ---
    const compressServiceImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600;
                    const MAX_HEIGHT = 600;
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

    const handleServicePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        setIsUploadingServicePhotos(true);

        const promises = files.map(file => compressServiceImage(file));
        const compressedBase64s = await Promise.all(promises);

        setServicePictures(prev => [...prev, ...compressedBase64s]);
        setIsUploadingServicePhotos(false);
        e.target.value = '';
    };

    const handleSaveService = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        
        const newServiceObj = {
            id: editingService.id || `service-${Date.now()}`,
            name: fd.get('name'),
            price: '$' + fd.get('price').replace(/^\$+/, ''),
            duration: fd.get('durationUnit') === 'Add-on' ? 'Add-on' : `${fd.get('durationValue')} ${fd.get('durationUnit')}`,
            description: fd.get('description'),
            popular: fd.get('popular') === 'on',
            images: servicePictures,
            sort_order: editingService.id ? (editingService.sort_order !== undefined && editingService.sort_order !== null ? editingService.sort_order : services.length) : services.length
        };

        if (isSupabaseConfigured) {
            try {
                const { error } = await supabase
                    .from('services')
                    .upsert([newServiceObj]);
                if (error) console.error('Error upserting service in Supabase:', error);
            } catch (e) {
                console.error('Error saving service:', e);
            }
            await fetchDashboardData(techId);
        } else {
            let updated;
            if (editingService.id) {
                 updated = services.map(s => s.id === newServiceObj.id ? newServiceObj : s);
            } else {
                 updated = [...services, newServiceObj];
            }
            updated.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            setServices(updated);
            localStorage.setItem('services', JSON.stringify(updated));
        }
        setEditingService(null);
    };

    const handleDeleteService = async (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            if (isSupabaseConfigured) {
                try {
                    const { error } = await supabase
                        .from('services')
                        .delete()
                        .eq('id', id);
                    if (error) console.error('Error deleting service in Supabase:', error);
                } catch (e) {
                    console.error('Error deleting service:', e);
                }
                await fetchDashboardData(techId);
            } else {
                const updated = services.filter(s => s.id !== id);
                setServices(updated);
                localStorage.setItem('services', JSON.stringify(updated));
            }
        }
    };

    const handleMoveService = async (serviceId, direction) => {
        const index = services.findIndex(s => s.id === serviceId);
        if (index === -1) return;

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= services.length) return;

        const updatedServices = [...services];
        
        // Ensure all services have a valid sort_order value first (if some are null or 0)
        updatedServices.forEach((s, idx) => {
            if (s.sort_order === undefined || s.sort_order === null) {
                s.sort_order = idx;
            }
        });

        // Swap sort_order
        const tempOrder = updatedServices[index].sort_order;
        updatedServices[index].sort_order = updatedServices[targetIndex].sort_order;
        updatedServices[targetIndex].sort_order = tempOrder;

        // If they had the same sort_order, just assign indices
        if (updatedServices[index].sort_order === updatedServices[targetIndex].sort_order) {
            updatedServices[index].sort_order = targetIndex;
            updatedServices[targetIndex].sort_order = index;
        }

        // Sort locally for instant UI response
        updatedServices.sort((a, b) => a.sort_order - b.sort_order);
        setServices(updatedServices);

        if (isSupabaseConfigured) {
            try {
                // Upsert both swapped services
                await supabase
                    .from('services')
                    .upsert([
                        { 
                            id: updatedServices[index].id, 
                            name: updatedServices[index].name,
                            price: updatedServices[index].price,
                            duration: updatedServices[index].duration,
                            description: updatedServices[index].description,
                            popular: updatedServices[index].popular,
                            images: updatedServices[index].images,
                            sort_order: updatedServices[index].sort_order 
                        },
                        { 
                            id: updatedServices[targetIndex].id, 
                            name: updatedServices[targetIndex].name,
                            price: updatedServices[targetIndex].price,
                            duration: updatedServices[targetIndex].duration,
                            description: updatedServices[targetIndex].description,
                            popular: updatedServices[targetIndex].popular,
                            images: updatedServices[targetIndex].images,
                            sort_order: updatedServices[targetIndex].sort_order 
                        }
                    ]);
            } catch (e) {
                console.error('Error saving new service order in Supabase:', e);
            }
        } else {
            localStorage.setItem('services', JSON.stringify(updatedServices));
        }
    };

    const handleDeleteUser = async (userId) => {
        const targetUser = usersList.find(u => u.id === userId);
        if (!targetUser) return;
        
        if (targetUser.email === user?.email) {
            alert("You cannot delete your own logged-in account!");
            return;
        }

        if (targetUser.role === 'owner') {
            alert("Owner accounts cannot be deleted!");
            return;
        }

        if (targetUser.role === 'tech' && user?.role !== 'owner') {
            alert("Only the Owner can delete technician profiles!");
            return;
        }

        if (window.confirm(`Are you sure you want to delete the account for ${targetUser.name} (${targetUser.email})? This action cannot be undone.`)) {
            if (isSupabaseConfigured) {
                try {
                    // Delete from users table
                    const { error: userError } = await supabase
                        .from('nail_nook_users')
                        .delete()
                        .eq('id', userId);

                    if (userError) console.error('Error deleting user in Supabase:', userError);

                    // If they are a tech, delete from technicians table
                    if (targetUser.role === 'tech') {
                        const { error: techError } = await supabase
                            .from('technicians')
                            .delete()
                            .eq('email', targetUser.email);
                        if (techError) console.error('Error deleting tech in Supabase:', techError);
                    }
                } catch (e) {
                    console.error('Error deleting user:', e);
                }
                await fetchDashboardData(techId);
            } else {
                const updatedUsers = usersList.filter(u => u.id !== userId);
                setUsersList(updatedUsers);
                localStorage.setItem('nail_nook_users', JSON.stringify(updatedUsers));

                // Also keep technicians selection list in sync for booking
                if (targetUser.role === 'tech') {
                    const currentTechs = JSON.parse(localStorage.getItem('technicians') || '[]');
                    const updatedTechs = currentTechs.filter(t => t.email.toLowerCase() !== targetUser.email.toLowerCase());
                    localStorage.setItem('technicians', JSON.stringify(updatedTechs));
                }
            }
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setAddUserError('');
        const fd = new FormData(e.target);
        
        const name = fd.get('name');
        const email = fd.get('email');
        const phone = fd.get('phone');
        const role = fd.get('role');
        const password = fd.get('password');

        const cleanPhone = cleanPhoneNumber(phone);

        if (!email && !cleanPhone) {
            setAddUserError('Please provide either an email address or a phone number.');
            return;
        }

        if (email && usersList.some(u => u.email && u.email.toLowerCase() === email.toLowerCase())) {
            setAddUserError('An account with this email already exists.');
            return;
        }

        if (cleanPhone && usersList.some(u => u.phone && cleanPhoneNumber(u.phone) === cleanPhone)) {
            setAddUserError('An account with this phone number already exists.');
            return;
        }

        try {
            const passwordHash = await hashPassword(password);
            const newUser = {
                id: role === 'tech' ? `tech-${Date.now()}` : `user-${Date.now()}`,
                name,
                email: email ? email.toLowerCase() : null,
                phone: cleanPhone || null,
                passwordHash,
                role,
                requiresPasswordReset: true
            };

            if (isSupabaseConfigured) {
                // Map fields to snake_case for Supabase
                const dbUser = {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    password_hash: newUser.passwordHash,
                    role: newUser.role,
                    requires_password_reset: newUser.requiresPasswordReset
                };

                const { error: userError } = await supabase.from('nail_nook_users').insert([dbUser]);
                if (userError) {
                    setAddUserError('Failed to create account in database.');
                    return;
                }

                if (role === 'tech') {
                    const { error: techError } = await supabase.from('technicians').insert([{
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email
                    }]);
                    if (techError) {
                        console.error('Error inserting technician in Supabase:', techError);
                    }
                }
                await fetchDashboardData(techId);
            } else {
                const updatedUsers = [...usersList, newUser];
                setUsersList(updatedUsers);
                localStorage.setItem('nail_nook_users', JSON.stringify(updatedUsers));

                // If new user is a tech, sync with booking technicians list
                if (role === 'tech') {
                    const currentTechs = JSON.parse(localStorage.getItem('technicians') || '[]');
                    currentTechs.push({
                        id: newUser.id,
                        name: newUser.name,
                        email: newUser.email
                    });
                    localStorage.setItem('technicians', JSON.stringify(currentTechs));
                }
            }

            setIsAddingUser(false);
        } catch (err) {
            setAddUserError('Failed to create account.');
        }
    };

    const openBookingModal = () => {
        setBookingError('');
        setBookingFormData({
            service: services[0]?.id || '',
            techId: techId || technicians[0]?.id || '',
            date: new Date().toISOString().split('T')[0],
            time: '09:00 AM',
            guestName: '',
            guestPhone: '',
            guestEmail: ''
        });
        setBookingClientType('guest');
        setSelectedClientUser('');
        setIsBookingAppt(true);
    };

    const handleCreateBookingSubmit = async (e) => {
        e.preventDefault();
        setBookingError('');

        const { service, techId: bookingTechId, date, time, guestName, guestPhone, guestEmail } = bookingFormData;

        if (!service || !bookingTechId || !date || !time) {
            setBookingError('Please fill in all required fields.');
            return;
        }

        let clientName = '';
        let clientPhone = '';
        let clientEmail = '';

        if (bookingClientType === 'customer') {
            const customerObj = usersList.find(u => u.id === selectedClientUser);
            if (!customerObj) {
                setBookingError('Please select a registered client.');
                return;
            }
            clientName = customerObj.name;
            clientPhone = customerObj.phone ? cleanPhoneNumber(customerObj.phone) : '';
            clientEmail = customerObj.email || '';
        } else {
            if (!guestName) {
                setBookingError('Please enter the client name.');
                return;
            }
            clientName = guestName;
            clientPhone = guestPhone ? cleanPhoneNumber(guestPhone) : '';
            clientEmail = guestEmail || '';
        }

        let assignedTechId = bookingTechId;
        if (assignedTechId === 'any') {
            assignedTechId = techId || technicians[0]?.id || '';
        }

        const techObj = technicians.find(t => t.id === assignedTechId);
        const serviceObj = services.find(s => s.id === service);

        const newBooking = {
            id: Date.now().toString(),
            service,
            techId: assignedTechId,
            date,
            time,
            name: clientName,
            phone: clientPhone,
            email: clientEmail,
            techName: techObj ? techObj.name : 'Booking',
            serviceName: serviceObj ? serviceObj.name : 'Service',
            createdAt: new Date().toISOString(),
            bookedBy: user?.email,
            status: 'Confirmed'
        };

        if (isSupabaseConfigured) {
            try {
                // Map snake_case columns
                const dbBooking = {
                    id: newBooking.id,
                    service: newBooking.service,
                    service_name: newBooking.serviceName,
                    tech_id: newBooking.techId,
                    tech_name: newBooking.techName,
                    date: newBooking.date,
                    time: newBooking.time,
                    name: newBooking.name,
                    phone: newBooking.phone,
                    email: newBooking.email,
                    status: newBooking.status,
                    created_at: newBooking.createdAt,
                    booked_by: newBooking.bookedBy
                };
                const { error } = await supabase.from('bookings').insert([dbBooking]);
                if (error) {
                    console.error('Error creating booking in Supabase:', error);
                    setBookingError(`Database Error: ${error.message || 'Failed to save booking. Please ensure you have run the database migrations.'}`);
                    return;
                }
            } catch (e) {
                console.error('Error creating booking:', e);
                setBookingError(`Error: ${e.message || 'Failed to save booking.'}`);
                return;
            }
            await fetchDashboardData(techId);
        } else {
            const allBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
            const updatedBookings = [...allBookings, newBooking];
            localStorage.setItem('bookings', JSON.stringify(updatedBookings));

            // Refresh lists
            const myBookings = updatedBookings.filter(b => b.techId === techId || b.techId === 'any');
            myBookings.sort((a, b) => new Date(`${a.date} ${a.time}`) - new Date(`${b.date} ${b.time}`));
            setAppointments(myBookings);
        }
        setIsBookingAppt(false);
    };

    const getNoShowCount = (u) => {
        return allBookingsList.filter(b => 
            (b.email && u.email && b.email.toLowerCase() === u.email.toLowerCase()) || 
            (b.phone && u.phone && cleanPhoneNumber(b.phone) === cleanPhoneNumber(u.phone))
        ).filter(b => b.status === 'No-Show').length;
    };

    const getCancelledCount = (u) => {
        return allBookingsList.filter(b => 
            (b.email && u.email && b.email.toLowerCase() === u.email.toLowerCase()) || 
            (b.phone && u.phone && cleanPhoneNumber(b.phone) === cleanPhoneNumber(u.phone))
        ).filter(b => b.status === 'Cancelled').length;
    };

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <div style={{ marginBottom: '3rem' }}>
                <h1 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Tech Dashboard</h1>
                <p style={{ opacity: 0.6 }}>Manage your Schedule, Services, and Clients efficiently.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                {/* 1. Appointment List */}
                <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
                    <section>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                                Appointment Schedule
                            </h2>
                            <button 
                                onClick={openBookingModal}
                                style={{
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem', 
                                    backgroundColor: 'var(--color-primary)', 
                                    color: 'var(--color-secondary)', 
                                    padding: '0.5rem 1rem', 
                                    borderRadius: '6px', 
                                    fontWeight: '600',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={16} /> New Appointment
                            </button>
                        </div>

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
                                        <div style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
                                            {appt.phone && appt.phone !== 'N/A' && (
                                                <>{formatPhoneNumber(appt.phone)}<br/></>
                                            )}
                                            {appt.email && appt.email !== 'guest@example.com' && appt.email !== 'N/A' ? appt.email : (!appt.phone || appt.phone === 'N/A' ? 'No contact' : '')}
                                        </div>
                                        
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

                                        <div style={{ textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                                            <button
                                                onClick={() => viewClientNotes(appt)}
                                                style={{
                                                    padding: '0.4rem 0.8rem',
                                                    fontSize: '0.8rem',
                                                    backgroundColor: '#f0f0f0',
                                                    borderRadius: '4px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    color: '#333',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <FileText size={14} /> Notes
                                            </button>
                                            {['Completed', 'Cancelled', 'No-Show'].includes(appt.status) && (
                                                <button
                                                    onClick={() => handleDismissBooking(appt.id)}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        padding: '0.4rem',
                                                        backgroundColor: '#fee2e2',
                                                        color: '#ef4444',
                                                        borderRadius: '4px',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Dismiss from Schedule"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* 2. Availability & Blocked Dates Settings */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', minWidth: 0 }}>
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
                                        opacity: daySchedule.isWorking ? 1 : 0.6,
                                        flexWrap: 'wrap'
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
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
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', minWidth: 0 }}>
                    <section style={{
                        backgroundColor: 'var(--color-white)',
                        borderRadius: '12px',
                        padding: '2rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Menu & Services Management</h2>
                            <button onClick={()=> openServiceModal()} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600'
                             }}>
                                <Plus size={16} /> Add Service
                            </button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {services.map((s, index) => (
                                <div key={s.id} style={{ border: '1px solid #eee', padding: '1.5rem', borderRadius: '8px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{s.name}</h3>
                                        <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{s.price}</span>
                                    </div>
                                    <p style={{ opacity: 0.7, fontSize: '0.85rem', marginBottom: '1rem' }}>{s.duration}</p>
                                    <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '1.5rem' }}>{s.description}</p>
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={()=> openServiceModal(s)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                                                <Edit2 size={14} /> Edit
                                            </button>
                                            <button onClick={()=> handleDeleteService(s.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', padding: '0.4rem 0.6rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                                            <button 
                                                onClick={() => handleMoveService(s.id, 'up')}
                                                disabled={index === 0}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.35rem', 
                                                    backgroundColor: '#f3f4f6', color: index === 0 ? '#d1d5db' : '#4b5563', 
                                                    borderRadius: '4px', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer' 
                                                }}
                                                title="Move Left"
                                            >
                                                <ChevronLeft size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleMoveService(s.id, 'down')}
                                                disabled={index === services.length - 1}
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.35rem', 
                                                    backgroundColor: '#f3f4f6', color: index === services.length - 1 ? '#d1d5db' : '#4b5563', 
                                                    borderRadius: '4px', border: 'none', cursor: index === services.length - 1 ? 'not-allowed' : 'pointer' 
                                                }}
                                                title="Move Right"
                                            >
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    {s.popular && <span style={{ position: 'absolute', top: '-10px', right: '10px', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>POPULAR</span>}
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* 4. User Accounts Management */}
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem', minWidth: 0 }}>
                    <section style={{
                        backgroundColor: 'var(--color-white)',
                        borderRadius: '12px',
                        padding: '2rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            marginBottom: '1.5rem',
                            flexWrap: 'wrap',
                            gap: '1rem'
                        }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={20} color="var(--color-primary)" /> User Accounts Management
                                </h2>
                                <p style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    View registered customer and technician accounts, or manage them as needed.
                                </p>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%', maxWidth: '500px', marginLeft: 'auto' }}>
                                <input
                                    type="text"
                                    placeholder="Search name/email..."
                                    value={searchUserQuery}
                                    onChange={(e) => setSearchUserQuery(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem 1rem',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <button 
                                    onClick={() => { setIsAddingUser(true); setAddUserError(''); setAddUserPhone(''); }}
                                    style={{
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem', 
                                        backgroundColor: 'var(--color-primary)', 
                                        color: 'var(--color-secondary)', 
                                        padding: '0.5rem 1rem', 
                                        borderRadius: '6px', 
                                        fontWeight: '600',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Plus size={16} /> Add User
                                </button>
                            </div>
                        </div>

                        {/* Accounts List Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.9rem',
                                textAlign: 'left',
                                minWidth: '600px'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f9f9f9', borderBottom: '2px solid #eee' }}>
                                        <th style={{ padding: '1rem' }}>Name</th>
                                        <th style={{ padding: '1rem' }}>Email</th>
                                        <th style={{ padding: '1rem' }}>Phone</th>
                                        <th style={{ padding: '1rem' }}>Role</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>No Shows</th>
                                        <th style={{ padding: '1rem', textAlign: 'center' }}>Cancelled</th>
                                        <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersList
                                        .filter(u => 
                                            (u.name && u.name.toLowerCase().includes(searchUserQuery.toLowerCase())) ||
                                            (u.email && u.email.toLowerCase().includes(searchUserQuery.toLowerCase())) ||
                                            (u.phone && u.phone.includes(searchUserQuery))
                                        )
                                        .map((u) => (
                                            <tr key={u.id} style={{ 
                                                borderBottom: '1px solid #eee',
                                                backgroundColor: u.email && u.email === user?.email ? '#f0f9ff' : 'transparent',
                                                transition: 'background-color 0.2s'
                                            }}>
                                                <td style={{ padding: '1rem', fontWeight: '500' }}>
                                                    {u.name} {u.email && u.email === user?.email && <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', padding: '0.1rem 0.4rem', borderRadius: '4px', marginLeft: '0.5rem' }}>You</span>}
                                                </td>
                                                <td style={{ padding: '1rem', color: '#555' }}>{u.email && u.email !== 'guest@example.com' && u.email !== 'N/A' ? u.email : ''}</td>
                                                <td style={{ padding: '1rem', color: '#555' }}>{u.phone && u.phone !== 'N/A' ? formatPhoneNumber(u.phone) : ''}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span style={{ 
                                                        fontSize: '0.8rem', 
                                                        padding: '0.2rem 0.5rem', 
                                                        borderRadius: '12px',
                                                        fontWeight: '600',
                                                        backgroundColor: u.role === 'owner' ? '#fef3c7' : (u.role === 'tech' ? '#fee2e2' : '#e0e7ff'),
                                                        color: u.role === 'owner' ? '#92400e' : (u.role === 'tech' ? '#991b1b' : '#3730a3')
                                                    }}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: u.role === 'customer' && getNoShowCount(u) > 0 ? '#dc2626' : '#555' }}>
                                                    {u.role === 'customer' ? getNoShowCount(u) : '-'}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: u.role === 'customer' && getCancelledCount(u) > 0 ? '#b91c1c' : '#555' }}>
                                                    {u.role === 'customer' ? getCancelledCount(u) : '-'}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                                                        {/* Notes button */}
                                                        <button
                                                            onClick={() => openUserNotes(u)}
                                                            style={{
                                                                border: 'none',
                                                                background: '#f0f0f0',
                                                                color: '#444',
                                                                cursor: 'pointer',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '0.3rem',
                                                                fontSize: '0.8rem',
                                                                transition: 'background-color 0.2s'
                                                            }}
                                                            title="View / edit private client notes"
                                                        >
                                                            <FileText size={14} /> Notes
                                                        </button>

                                                        {/* Delete button */}
                                                        {(() => {
                                                            const isOwnAccount = u.email === user?.email;
                                                            const isTargetOwner = u.role === 'owner';
                                                            const isTargetTech = u.role === 'tech';
                                                            const isCurrentOwner = user?.role === 'owner';

                                                            let isDisabled = false;
                                                            let tooltipText = "Delete account";

                                                            if (isOwnAccount) {
                                                                isDisabled = true;
                                                                tooltipText = "You cannot delete your own account";
                                                            } else if (isTargetOwner) {
                                                                isDisabled = true;
                                                                tooltipText = "Owner accounts cannot be deleted";
                                                            } else if (isTargetTech && !isCurrentOwner) {
                                                                isDisabled = true;
                                                                tooltipText = "Only the Owner can delete technicians";
                                                            }

                                                            return (
                                                                <button 
                                                                    onClick={() => handleDeleteUser(u.id)}
                                                                    disabled={isDisabled}
                                                                    style={{
                                                                        border: 'none',
                                                                        background: 'none',
                                                                        color: isDisabled ? '#ccc' : '#ef4444',
                                                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                                        padding: '4px',
                                                                        borderRadius: '4px',
                                                                        transition: 'background-color 0.2s'
                                                                    }}
                                                                    title={tooltipText}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {usersList.filter(u => 
                                        (u.name && u.name.toLowerCase().includes(searchUserQuery.toLowerCase())) ||
                                        (u.email && u.email.toLowerCase().includes(searchUserQuery.toLowerCase())) ||
                                        (u.phone && u.phone.includes(searchUserQuery))
                                    ).length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', opacity: 0.5, fontStyle: 'italic' }}>
                                                No matching accounts found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
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
                        <button onClick={() => setSelectedClientNote(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>

                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={20} color="var(--color-primary)" />
                            {selectedClientNote.customerText !== null ? 'Client File & Appointment Details' : 'Client File — Private Notes'}
                        </h3>
                        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
                            Client: <strong>{selectedClientNote.name}</strong> ({selectedClientNote.email})
                        </p>
                        
                        <div style={{ display: 'grid', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
                            {/* Section 1: Customer's Appointment Notes — only shown from the schedule row */}
                            {selectedClientNote.customerText !== null && (
                                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                                        Client's Appointment Request:
                                    </label>
                                    <div style={{ backgroundColor: '#fcfcfc', padding: '1rem', borderRadius: '8px', border: '1px solid #f0f0f0', fontStyle: 'italic', color: '#333', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                                        "{selectedClientNote.customerText}"
                                    </div>

                                    {selectedClientNote.customerPictures && selectedClientNote.customerPictures.length > 0 && (
                                        <div>
                                            <label style={{ fontWeight: '500', display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#666' }}>
                                                Attached Inspiration Images (click to view):
                                            </label>
                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                {selectedClientNote.customerPictures.map((pic, idx) => (
                                                    <a key={idx} href={pic} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                                                        <img 
                                                            src={pic} 
                                                            alt="Client attachment" 
                                                            style={{ 
                                                                width: '70px', 
                                                                height: '70px', 
                                                                objectFit: 'cover', 
                                                                borderRadius: '6px', 
                                                                border: '1px solid #ddd',
                                                                cursor: 'pointer',
                                                                transition: 'transform 0.2s'
                                                            }} 
                                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                        />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Section 2: Internal Tech Notes (Private) */}
                            <div>
                                <label style={{ fontWeight: '600', display: 'block', marginBottom: '0.25rem', fontSize: '0.95rem' }}>
                                    Internal Tech File (Private):
                                </label>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: '0.5rem' }}>
                                    Customers cannot see these notes. Keep track of polishes used, style history, shape preference, or allergies.
                                </p>
                                <textarea 
                                    value={selectedClientNote.internalText}
                                    onChange={(e) => setSelectedClientNote({...selectedClientNote, internalText: e.target.value})}
                                    style={{ width: '100%', minHeight: '120px', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', resize: 'vertical' }}
                                    placeholder="Add allergy alerts, size metrics, specific colors used, etc."
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                    <span id="note-saved-msg" style={{ color: 'green', fontSize: '0.85rem', opacity: 0, transition: 'opacity 0.3s' }}>
                                        Notes saved to client file!
                                    </span>
                                    <button onClick={saveInternalNote} style={{
                                        backgroundColor: 'var(--color-secondary)', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600'
                                    }}>
                                        <Save size={16} /> Save Notes
                                    </button>
                                </div>
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Price</label>
                                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', height: '2.5rem', boxSizing: 'border-box' }}>
                                        <span style={{ padding: '0 0.5rem 0 0.75rem', backgroundColor: '#f5f5f5', borderRight: '1px solid #ddd', fontWeight: '600', color: '#555', userSelect: 'none', height: '100%', display: 'flex', alignItems: 'center' }}>$</span>
                                        <input
                                            type="text"
                                            name="price"
                                            defaultValue={(editingService.price || '').replace(/^\$/, '')}
                                            required
                                            placeholder="50+"
                                            onChange={(e) => { e.target.value = e.target.value.replace(/^\$+/, ''); }}
                                            style={{ flex: 1, padding: '0 0.6rem', border: 'none', outline: 'none', borderRadius: 0, height: '100%', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Duration</label>
                                    {(() => {
                                        const dur = editingService.duration || '';
                                        const isAddOn = dur.toLowerCase() === 'add-on';
                                        const parts = dur.split(' ');
                                        const durNum = isAddOn ? '' : (parts[0] || '');
                                        const durUnit = isAddOn ? 'Add-on' : (['min','hr'].includes(parts[1]) ? parts[1] : 'min');
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '6px', overflow: 'hidden', height: '2.5rem', boxSizing: 'border-box' }}>
                                                <input
                                                    type="number"
                                                    name="durationValue"
                                                    defaultValue={durNum}
                                                    min="1"
                                                    placeholder="60"
                                                    required={durUnit !== 'Add-on'}
                                                    style={{ width: '65px', padding: '0 0.5rem', border: 'none', outline: 'none', borderRight: '1px solid #ddd', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}
                                                />
                                                <select
                                                    name="durationUnit"
                                                    defaultValue={durUnit}
                                                    style={{ flex: 1, padding: '0 0.5rem', border: 'none', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', height: '100%', boxSizing: 'border-box' }}
                                                >
                                                    <option value="min">min</option>
                                                    <option value="hr">hr</option>
                                                    <option value="Add-on">Add-on</option>
                                                </select>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Description</label>
                                <textarea name="description" defaultValue={editingService.description} required style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', minHeight: '80px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Service Images (Optional)</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                    <label style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', backgroundColor: '#f9f9f9', fontWeight: '500'
                                    }}>
                                        <Plus size={16} /> Upload Photos
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleServicePhotoUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                    {isUploadingServicePhotos && <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Compressing...</span>}
                                </div>
                                {servicePictures.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {servicePictures.map((pic, idx) => (
                                            <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #eee' }}>
                                                <img src={pic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => setServicePictures(prev => prev.filter((_, i) => i !== idx))}
                                                    style={{
                                                        position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, cursor: 'pointer'
                                                    }}
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
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

            {/* Add User Modal */}
            {isAddingUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <form onSubmit={handleCreateUser} style={{
                        backgroundColor: 'var(--color-white)', padding: '2rem', borderRadius: '12px', maxWidth: '450px', width: '90%', position: 'relative'
                    }}>
                        <button type="button" onClick={() => setIsAddingUser(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>

                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Create User Account</h3>
                        
                        {addUserError && (
                            <div style={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}>
                                {addUserError}
                            </div>
                        )}

                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Full Name</label>
                                <input type="text" name="name" required style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Email Address</label>
                                <input type="email" name="email" style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Phone Number</label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={addUserPhone} 
                                    onChange={(e) => setAddUserPhone(formatPhoneNumber(e.target.value))} 
                                    placeholder="555-0100" 
                                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Account Role</label>
                                <select name="role" required style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}>
                                    <option value="customer">Customer (Client)</option>
                                    <option value="tech">Nail Technician</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Password</label>
                                <input type="password" name="password" required style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} />
                            </div>
                        </div>
                        
                        <button type="submit" style={{ width: '100%', padding: '0.8rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Create Account
                        </button>
                    </form>
                </div>
            )}

            {/* New Appointment Modal */}
            {isBookingAppt && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100
                }}>
                    <form onSubmit={handleCreateBookingSubmit} style={{
                        backgroundColor: 'var(--color-white)', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '90%', position: 'relative'
                    }}>
                        <button type="button" onClick={() => setIsBookingAppt(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>

                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Book Appointment (Staff Form)</h3>
                        
                        {bookingError && (
                            <div style={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                                fontSize: '0.875rem'
                            }}>
                                {bookingError}
                            </div>
                        )}

                        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                            {/* Client Type Toggle */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Client Type</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            name="clientType" 
                                            checked={bookingClientType === 'guest'} 
                                            onChange={() => setBookingClientType('guest')} 
                                        />
                                        <span style={{ fontSize: '0.9rem' }}>Walk-in / Guest</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            name="clientType" 
                                            checked={bookingClientType === 'customer'} 
                                            onChange={() => setBookingClientType('customer')} 
                                        />
                                        <span style={{ fontSize: '0.9rem' }}>Registered Account</span>
                                    </label>
                                </div>
                            </div>

                            {/* Registered Client Selection */}
                            {bookingClientType === 'customer' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Select Registered Account</label>
                                    <select 
                                        value={selectedClientUser} 
                                        onChange={(e) => setSelectedClientUser(e.target.value)} 
                                        required 
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}
                                    >
                                        <option value="" disabled>Choose a customer...</option>
                                        {usersList
                                            .filter(u => u.role === 'customer')
                                            .map(u => {
                                                const contactInfo = u.email ? u.email : (u.phone ? formatPhoneNumber(u.phone) : 'No email/phone');
                                                return (
                                                    <option key={u.id} value={u.id}>{u.name} ({contactInfo})</option>
                                                );
                                            })
                                        }
                                    </select>
                                </div>
                            )}

                            {/* Guest Details */}
                            {bookingClientType === 'guest' && (
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Client Name</label>
                                        <input 
                                            type="text" 
                                            required 
                                            value={bookingFormData.guestName}
                                            onChange={(e) => setBookingFormData({...bookingFormData, guestName: e.target.value})}
                                            style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Phone</label>
                                            <input 
                                                type="tel" 
                                                value={bookingFormData.guestPhone}
                                                onChange={(e) => setBookingFormData({...bookingFormData, guestPhone: formatPhoneNumber(e.target.value)})}
                                                placeholder="555-0100" 
                                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Email</label>
                                            <input 
                                                type="email" 
                                                value={bookingFormData.guestEmail}
                                                onChange={(e) => setBookingFormData({...bookingFormData, guestEmail: e.target.value})}
                                                placeholder="guest@example.com" 
                                                style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '0.5rem 0' }} />

                            {/* Service and Tech */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Service</label>
                                    <select 
                                        value={bookingFormData.service} 
                                        onChange={(e) => setBookingFormData({...bookingFormData, service: e.target.value})} 
                                        required 
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}
                                    >
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.price})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Technician</label>
                                    <select 
                                        value={bookingFormData.techId} 
                                        onChange={(e) => setBookingFormData({...bookingFormData, techId: e.target.value})} 
                                        required 
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}
                                    >
                                        {technicians.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Date and Time */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Date</label>
                                    <input 
                                        type="date" 
                                        required 
                                        value={bookingFormData.date}
                                        onChange={(e) => setBookingFormData({...bookingFormData, date: e.target.value})}
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px' }} 
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: '500' }}>Time Slot</label>
                                    <select 
                                        value={bookingFormData.time} 
                                        onChange={(e) => setBookingFormData({...bookingFormData, time: e.target.value})} 
                                        required 
                                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#fff' }}
                                    >
                                        {TIME_SLOTS.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" style={{ width: '100%', padding: '0.8rem', backgroundColor: 'var(--color-primary)', color: 'var(--color-secondary)', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Book Appointment
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default TechDashboard;
