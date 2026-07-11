import { supabase, isSupabaseConfigured } from './supabaseClient';

export const initializeData = async () => {
    // Default Services
    const defaultServices = [
        {
            id: 'manicure-classic',
            name: 'Classic Manicure',
            price: '$35',
            duration: '45 min',
            description: 'Nail shaping, cuticle care, hand massage, and polish of your choice.',
            popular: true
        },
        {
            id: 'gel-manicure',
            name: 'Gel Manicure',
            price: '$50',
            duration: '60 min',
            description: 'Long-lasting gel polish with zero dry time and high shine finish.',
            popular: true
        },
        {
            id: 'pedicure-spa',
            name: 'Spa Pedicure',
            price: '$65',
            duration: '60 min',
            description: 'Relaxing foot soak, scrub, callus removal, massage, and polish.',
            popular: false
        },
        {
            id: 'acrylic-full',
            name: 'Acrylic Full Set',
            price: '$75+',
            duration: '90 min',
            description: 'Extensions using high-quality acrylic powder for length and strength.',
            popular: false
        },
        {
            id: 'nail-art',
            name: 'Custom Nail Art',
            price: '$15+',
            duration: 'Add-on',
            description: 'Intricate designs, gems, or chrome powders added to any service.',
            popular: false
        }
    ];

    if (!localStorage.getItem('services')) {
        localStorage.setItem('services', JSON.stringify(defaultServices));
    }

    // Default Technicians (Kallie is the sole default tech/owner)
    const defaultTechs = [
        { id: 'tech-kallie', name: 'Kallie (Owner)', email: 'kallierichardson16@gmail.com' }
    ];

    // --- Technicians list migration ---
    // Seed if missing, or clean up old Sarah/Jessica entries in existing browsers
    let storedTechs = [];
    try {
        storedTechs = JSON.parse(localStorage.getItem('technicians') || '[]');
    } catch (e) {
        storedTechs = [];
    }

    // Remove stale default entries no longer in the app
    const staleEmails = ['sarah@example.com', 'jessica@example.com'];
    let techsModified = false;
    staleEmails.forEach(email => {
        const idx = storedTechs.findIndex(t => t.email && t.email.toLowerCase() === email);
        if (idx !== -1) { storedTechs.splice(idx, 1); techsModified = true; }
    });

    // Ensure Kallie exists in the technicians list
    if (!storedTechs.some(t => t.email && t.email.toLowerCase() === 'kallierichardson16@gmail.com')) {
        storedTechs.unshift(defaultTechs[0]);
        techsModified = true;
    }

    if (techsModified || !localStorage.getItem('technicians')) {
        localStorage.setItem('technicians', JSON.stringify(storedTechs));
    }

    // Default Blocked Dates
    if (!localStorage.getItem('blockedDates')) {
        localStorage.setItem('blockedDates', JSON.stringify([]));
    }

    // Initialize individual tech schedules
    const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const DEFAULT_SCHEDULE = DAYS_OF_WEEK.map(day => ({
        day,
        isWorking: day !== 'Sunday' && day !== 'Saturday',
        startTime: '09:00',
        endTime: '17:00'
    }));

    // Seed Kallie's schedule if missing
    if (!localStorage.getItem('schedule_tech-kallie')) {
        // Carry over a legacy schedule if one exists from old Sarah key
        const legacy = localStorage.getItem('schedule_tech-sarah') || localStorage.getItem('techSchedule');
        localStorage.setItem('schedule_tech-kallie', legacy || JSON.stringify(DEFAULT_SCHEDULE));
    }

    // Default Users — Kallie only as the seeded owner
    const defaultUsers = [
        {
            id: 'tech-kallie',
            name: 'Kallie (Owner)',
            email: 'kallierichardson16@gmail.com',
            phone: '385-296-5737',
            passwordHash: 'ce8995efad4553f000a9e2620b2c8c140797679c018025143a820cf9dffffe07', // SHA-256 of owner password
            role: 'owner'
        }
    ];

    let users = [];
    try {
        users = JSON.parse(localStorage.getItem('nail_nook_users') || '[]');
    } catch (e) {
        users = [];
    }

    let modified = false;

    // Remove stale default accounts (Sarah, Jessica) from existing browsers
    const staleUserEmails = ['sarah@example.com', 'jessica@example.com'];
    staleUserEmails.forEach(email => {
        const idx = users.findIndex(u => u.email.toLowerCase() === email);
        if (idx !== -1) { users.splice(idx, 1); modified = true; }
    });

    // Ensure Kallie exists with correct role
    const kallieIndex = users.findIndex(u => u.email.toLowerCase() === 'kallierichardson16@gmail.com');
    if (kallieIndex === -1) {
        users.unshift(defaultUsers[0]);
        modified = true;
    } else {
        if (users[kallieIndex].role !== 'owner') {
            users[kallieIndex].role = 'owner';
            modified = true;
        }
    }

    if (modified || !localStorage.getItem('nail_nook_users')) {
        localStorage.setItem('nail_nook_users', JSON.stringify(users));
    }

    // --- SUPABASE DATABASE INITIAL SEEDING ---
    if (isSupabaseConfigured) {
        try {
            // 1. Seed Users table
            const { data: dbUsers, error: userError } = await supabase
                .from('nail_nook_users')
                .select('id')
                .limit(1);

            if (!userError && (!dbUsers || dbUsers.length === 0)) {
                // Convert camelCase object keys to snake_case for Postgres
                const dbUsersToInsert = defaultUsers.map(u => ({
                    id: u.id,
                    name: u.name,
                    email: u.email.toLowerCase(),
                    phone: u.phone,
                    password_hash: u.passwordHash,
                    role: u.role
                }));
                await supabase.from('nail_nook_users').insert(dbUsersToInsert);
            }

            // 2. Seed Services table
            const { data: dbServices, error: serviceError } = await supabase
                .from('services')
                .select('id')
                .limit(1);

            if (!serviceError && (!dbServices || dbServices.length === 0)) {
                await supabase.from('services').insert(defaultServices);
            }

            // 3. Seed Technicians table
            const { data: dbTechs, error: techError } = await supabase
                .from('technicians')
                .select('id')
                .limit(1);

            if (!techError && (!dbTechs || dbTechs.length === 0)) {
                await supabase.from('technicians').insert(defaultTechs);
            }

            // 4. Seed Schedules table
            const { data: dbSchedules, error: schedError } = await supabase
                .from('schedules')
                .select('id')
                .limit(1);

            if (!schedError && (!dbSchedules || dbSchedules.length === 0)) {
                const dbSchedulesToInsert = DEFAULT_SCHEDULE.map(s => ({
                    tech_id: 'tech-kallie',
                    day: s.day,
                    is_working: s.isWorking,
                    start_time: s.startTime,
                    end_time: s.endTime
                }));
                await supabase.from('schedules').insert(dbSchedulesToInsert);
            }
        } catch (e) {
            console.error('Error seeding Supabase database:', e);
        }
    }
};

