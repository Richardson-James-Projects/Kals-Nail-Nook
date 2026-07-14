import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone } from 'lucide-react';
import { formatPhoneNumber } from '../utils/supabaseClient';

const Register = () => {
    const navigate = useNavigate();
    const { register, loginWithOAuth } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSocialLogin = async (provider) => {
        setError('');
        setIsLoading(true);
        try {
            await loginWithOAuth(provider);
        } catch (err) {
            setError(err.message || `Failed to sign up with ${provider}`);
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }

        if (!formData.email && !formData.phone) {
            return setError('Please provide either an email address or a phone number.');
        }

        setIsLoading(true);

        try {
            await register(formData.name, formData.email, formData.phone, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to register');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'phone') {
            value = formatPhoneNumber(value);
        }
        setFormData({ ...formData, [e.target.name]: value });
    };

    return (
        <div className="container" style={{
            padding: '4rem 1rem',
            display: 'flex',
            justifyContent: 'center'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '500px',
                backgroundColor: 'var(--color-white)',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)'
            }}>
                <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                    Create Account
                </h1>
                <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '2rem' }}>
                    Join Kals Nail Nook for seamless booking
                </p>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            marginBottom: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Full Name</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                <input
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                <input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Phone Number</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                <input
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                    <input
                                        name="password"
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Confirm</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            marginTop: '1.5rem',
                            padding: '0.875rem',
                            backgroundColor: 'var(--color-secondary)',
                            color: 'var(--color-white)',
                            borderRadius: '8px',
                            fontWeight: '600',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', opacity: 0.4 }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#000' }}></div>
                    <span style={{ padding: '0 10px', fontSize: '0.8rem', fontWeight: '500' }}>or continue with</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: '#000' }}></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        disabled={isLoading}
                        style={{
                            padding: '0.65rem',
                            backgroundColor: '#fff',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontWeight: '500',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path fillRule="evenodd" clipRule="evenodd" d="M23.5 12.25c0-.8-.08-1.6-.22-2.38H12v4.51h6.46a5.53 5.53 0 01-2.4 3.63v3h3.87c2.27-2.09 3.57-5.17 3.57-8.75z" fill="#4285F4"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.77-2.11-6.72-4.96h-4v3.1A12 12 0 0012 24z" fill="#34A853"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M5.28 14.29a7.22 7.22 0 010-2.58v-3.1h-4A12 12 0 000 12c0 2.22.6 4.3 1.66 6.09l3.62-2.8a7.22 7.22 0 010-1z" fill="#FBBC05"/>
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.96 11.96 0 0012 0 12 12 0 001.28 6.19l4 3.1c.95-2.85 3.59-4.96 6.72-4.96z" fill="#EA4335"/>
                        </svg>
                        Google
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('facebook')}
                        disabled={isLoading}
                        style={{
                            padding: '0.65rem',
                            backgroundColor: '#1877f2',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '500',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                        Facebook
                    </button>
                </div>

                <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
