export const initializeData = () => {
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

    // Default Technicians
    const defaultTechs = [
        { id: 'tech-sarah', name: 'Sarah (Owner)', email: 'sarah@example.com' },
        { id: 'tech-jessica', name: 'Jessica', email: 'jessica@example.com' }
    ];

    if (!localStorage.getItem('technicians')) {
        localStorage.setItem('technicians', JSON.stringify(defaultTechs));
    }

    // Default Blocked Dates
    if (!localStorage.getItem('blockedDates')) {
        localStorage.setItem('blockedDates', JSON.stringify([]));
    }

    // Initialize individual tech schedules based on legacy if possible
    const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const DEFAULT_SCHEDULE = DAYS_OF_WEEK.map(day => ({
        day,
        isWorking: day !== 'Sunday' && day !== 'Saturday',
        startTime: '09:00',
        endTime: '17:00'
    }));

    defaultTechs.forEach(tech => {
        if (!localStorage.getItem(`schedule_${tech.id}`)) {
            // Retroactively migrate `techSchedule` to `tech-sarah`
            if (tech.id === 'tech-sarah' && localStorage.getItem('techSchedule')) {
                localStorage.setItem(`schedule_${tech.id}`, localStorage.getItem('techSchedule'));
            } else {
                localStorage.setItem(`schedule_${tech.id}`, JSON.stringify(DEFAULT_SCHEDULE));
            }
        }
    });
};
