import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, Calendar } from 'lucide-react';

const Home = () => {
    return (
        <div>
            {/* Hero Section */}
            <section style={{
                backgroundColor: 'var(--color-secondary)',
                color: 'var(--color-white)',
                padding: '4rem 0',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ maxWidth: '600px' }}>
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
                            fontWeight: 300
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
                        }}>
                            Book Appointment <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>

                {/* Abstract Background Element */}
                <div style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-10%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                }} />
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

            {/* CTA Section */}
            <section style={{
                padding: '4rem 0',
                textAlign: 'center',
                backgroundColor: '#fdfbf7' // Light cream
            }}>
                <div className="container">
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Shine?</h2>
                    <p style={{ marginBottom: '2rem', opacity: 0.7 }}>
                        Secure your spot today and treat yourself to the care you deserve.
                    </p>
                    <Link to="/services" style={{
                        display: 'inline-block',
                        border: '2px solid var(--color-secondary)',
                        color: 'var(--color-secondary)',
                        padding: '0.8rem 2rem',
                        borderRadius: '50px',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}>
                        View Services & Pricing
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
