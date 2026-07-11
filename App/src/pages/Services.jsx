import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const Services = () => {
    const [services, setServices] = useState([]);

    useEffect(() => {
        const fetchServices = async () => {
            if (isSupabaseConfigured) {
                try {
                    const { data, error } = await supabase.from('services').select('*').order('sort_order', { ascending: true });
                    if (error) throw error;
                    setServices(data || []);
                } catch (e) {
                    console.error('Error fetching services from Supabase:', e);
                    const storedServices = JSON.parse(localStorage.getItem('services') || '[]');
                    storedServices.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                    setServices(storedServices);
                }
            } else {
                const storedServices = JSON.parse(localStorage.getItem('services') || '[]');
                storedServices.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
                setServices(storedServices);
            }
        };
        fetchServices();
    }, []);

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{
                    color: 'var(--color-primary)',
                    marginBottom: '1rem',
                    fontSize: '2.5rem'
                }}>Our Services</h1>
                <p style={{ maxWidth: '600px', margin: '0 auto', opacity: 0.8 }}>
                    Choose from our curated menu of nail treatments tailored to your style and needs.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                {services.map((service) => (
                    <div key={service.id} style={{
                        backgroundColor: 'var(--color-white)',
                        borderRadius: '16px',
                        padding: '2rem',
                        boxShadow: 'var(--shadow-md)',
                        position: 'relative',
                        border: service.popular ? '1px solid var(--color-primary)' : '1px solid transparent',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {service.popular && (
                            <span style={{
                                position: 'absolute',
                                top: '-12px',
                                right: '20px',
                                backgroundColor: 'var(--color-primary)',
                                color: 'var(--color-secondary)',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                            }}>
                                MOST POPULAR
                            </span>
                        )}

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            marginBottom: '1rem'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{service.name}</h3>
                            <span style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                                {service.price}
                            </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                            opacity: 0.6
                        }}>
                            <span>Duration: {service.duration}</span>
                        </div>

                        <p style={{ marginBottom: '1.5rem', opacity: 0.8, flex: 1 }}>
                            {service.description}
                        </p>

                        {/* Gallery of Uploaded Images */}
                        {service.images && service.images.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {service.images.slice(0, 3).map((img, idx) => (
                                    <div key={idx} style={{ aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                                        {idx === 2 && service.images.length > 3 ? (
                                            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: '#fff', fontWeight: '600' }}>
                                                    +{service.images.length - 2} More
                                                </div>
                                            </div>
                                        ) : (
                                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <Link
                            to={`/book?service=${service.id}`}
                            style={{
                                textAlign: 'center',
                                backgroundColor: 'var(--color-secondary)',
                                color: 'var(--color-white)',
                                padding: '0.75rem',
                                borderRadius: '8px',
                                fontWeight: '500',
                                transition: 'background-color 0.2s',
                            }}
                        >
                            Book Now
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Services;
