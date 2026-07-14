import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, Calendar, X } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const GALLERY_IMAGES = [
    { src: '/gallery/IMG_9829_edited.jpg', alt: 'Premium Hard Gel Set' },
    { src: '/gallery/IMG_9841_edited.jpg', alt: 'Elegant Gel Extension Fill' },
    { src: '/gallery/IMG_9890_edited.jpg', alt: 'Detailed Hand-Painted Nail Art' },
    { src: '/gallery/IMG_9893_edited.jpg', alt: 'Classic Glitter Acrylics' },
    { src: '/gallery/IMG_9925_edited.jpg', alt: 'Fresh Spring Floral Design' },
    { src: '/gallery/IMG_9932_edited.jpg', alt: 'Clean Modern French Tips' },
    { src: '/gallery/PXL_20260428_043536550.jpg', alt: 'Luxury Chrome Pedicure' }
];

const Home = () => {
    const [activeImage, setActiveImage] = useState(null);
    const [portfolio, setPortfolio] = useState([]);
    const [showAll, setShowAll] = useState(false);

    useEffect(() => {
        const fetchPortfolio = async () => {
            let loadedPhotos = [];
            
            if (isSupabaseConfigured) {
                try {
                    const { data, error } = await supabase
                        .from('portfolio')
                        .select('*')
                        .order('sort_order', { ascending: true });
                    
                    if (!error && data && data.length > 0) {
                        loadedPhotos = data.map(item => ({
                            id: item.id,
                            src: item.image_url,
                            alt: item.caption || 'Nail set creation',
                            sortOrder: item.sort_order ?? 9999
                        }));
                    }
                } catch (err) {
                    console.error('Error fetching portfolio from Supabase:', err);
                }
            }
            
            // Check local storage fallback
            try {
                const localPhotos = JSON.parse(localStorage.getItem('portfolio') || '[]');
                if (localPhotos.length > 0) {
                    const formattedLocal = localPhotos.map(item => ({
                        id: item.id,
                        src: item.imageUrl,
                        alt: item.caption || 'Nail set creation',
                        sortOrder: item.sortOrder ?? 9999
                    }));
                    loadedPhotos = [...loadedPhotos, ...formattedLocal];
                }
            } catch (err) {
                console.error('Error loading local storage portfolio:', err);
            }

            // Always sort the combined photos by sortOrder ascending
            loadedPhotos.sort((a, b) => a.sortOrder - b.sortOrder);
            
            // If empty, fall back to our gorgeous default JPEGs
            if (loadedPhotos.length === 0) {
                setPortfolio(GALLERY_IMAGES);
            } else {
                setPortfolio(loadedPhotos);
            }
        };

        fetchPortfolio();
    }, []);

    return (
        <div>
            {/* Hero Section */}
            <section style={{
                backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('/gallery/IMG_9829_edited.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                color: 'var(--color-white)',
                padding: '7rem 0 6rem 0',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ maxWidth: '650px' }}>
                        <h1 style={{
                            fontSize: '3.5rem',
                            lineHeight: 1.1,
                            marginBottom: '1.5rem',
                            color: 'var(--color-primary)' // Gold
                        }}>
                            Exquisite Nails,<br />Exceptional Care
                        </h1>
                        <p style={{
                            fontSize: '1.25rem',
                            opacity: 0.9,
                            marginBottom: '2.5rem',
                            fontWeight: 300,
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>
                            Experience the art of nail design in a relaxing, premium atmosphere.
                            From classic manicures to custom artistry, we define elegance.
                        </p>
                        <Link to="/book" style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            backgroundColor: 'var(--color-primary)',
                            color: 'var(--color-secondary)',
                            padding: '1rem 2rem',
                            borderRadius: '50px',
                            fontWeight: '600',
                            fontSize: '1.1rem',
                            transition: 'transform 0.2s',
                            border: 'none',
                            cursor: 'pointer'
                        }}>
                            Book Appointment <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section style={{ padding: '4rem 0' }}>
                <div className="container">
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '2rem'
                    }}>
                        {[
                            { icon: <Star size={32} />, title: 'Premium Service', desc: 'Top-tier products and expert technicians.' },
                            { icon: <Clock size={32} />, title: 'Relaxing Atmosphere', desc: 'A calm sanctuary for your self-care routine.' },
                            { icon: <Calendar size={32} />, title: 'Easy Scheduling', desc: 'Book 24/7 with our seamless online system.' }
                        ].map((feature, i) => (
                            <div key={i} style={{
                                padding: '2rem',
                                backgroundColor: 'var(--color-white)',
                                borderRadius: '12px',
                                boxShadow: 'var(--shadow-sm)',
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    color: 'var(--color-primary)',
                                    marginBottom: '1rem',
                                    display: 'inline-block'
                                }}>
                                    {feature.icon}
                                </div>
                                <h3 style={{ marginBottom: '0.5rem' }}>{feature.title}</h3>
                                <p style={{ opacity: 0.7 }}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Photo Gallery Section */}
            <section style={{ padding: '5rem 0', backgroundColor: '#fdfbf7' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--color-secondary)', marginBottom: '0.5rem' }}>Our Work Gallery</h2>
                        <p style={{ opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
                            Explore a selection of our fresh sets, custom nail art creations, and premium designs. Click on any photo to view full screen.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {portfolio.slice(0, showAll ? portfolio.length : 6).map((img, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setActiveImage(img)}
                                style={{
                                    borderRadius: '16px',
                                    overflow: 'hidden',
                                    aspectRatio: '1/1',
                                    boxShadow: 'var(--shadow-md)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    backgroundColor: '#fff',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }}
                            >
                                <img 
                                    src={img.src} 
                                    alt={img.alt} 
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(0,0,0,0) 60%)',
                                    opacity: 0,
                                    transition: 'opacity 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    padding: '1.5rem',
                                    color: '#fff'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                >
                                    <span style={{ fontWeight: '500', fontSize: '0.95rem' }}>{img.alt}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {portfolio.length > 6 && (
                        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                            <button 
                                onClick={() => setShowAll(!showAll)}
                                style={{
                                    backgroundColor: 'transparent',
                                    border: '2px solid var(--color-primary)',
                                    color: 'var(--color-secondary)',
                                    padding: '0.8rem 2.5rem',
                                    borderRadius: '50px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-primary)';
                                    e.currentTarget.style.color = 'var(--color-secondary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--color-secondary)';
                                }}
                            >
                                {showAll ? 'Show Less' : `View All Creations (${portfolio.length})`}
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '5rem 0',
                textAlign: 'center',
                backgroundColor: 'var(--color-white)'
            }}>
                <div className="container">
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Shine?</h2>
                    <p style={{ marginBottom: '2.5rem', opacity: 0.7 }}>
                        Secure your spot today and treat yourself to the care you deserve.
                    </p>
                    <Link to="/services" style={{
                        display: 'inline-block',
                        border: '2px solid var(--color-secondary)',
                        color: 'var(--color-secondary)',
                        padding: '0.8rem 2.5rem',
                        borderRadius: '50px',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        textDecoration: 'none'
                    }}>
                        View Services & Pricing
                    </Link>
                </div>
            </section>

            {/* Lightbox Modal */}
            {activeImage && (
                <div 
                    onClick={() => setActiveImage(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        animation: 'fadeIn 0.2s ease-out'
                    }}
                >
                    <button 
                        onClick={() => setActiveImage(null)}
                        style={{
                            position: 'absolute',
                            top: '1.5rem',
                            right: '1.5rem',
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={32} />
                    </button>
                    <div style={{ maxWidth: '90%', maxHeight: '90%', position: 'relative' }}>
                        <img 
                            src={activeImage.src} 
                            alt={activeImage.alt} 
                            style={{
                                maxWidth: '100%',
                                maxHeight: '80vh',
                                borderRadius: '12px',
                                objectFit: 'contain',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                        <p style={{ color: '#e2e8f0', textAlign: 'center', marginTop: '1rem', fontSize: '1.1rem', fontWeight: '500' }}>
                            {activeImage.alt}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
