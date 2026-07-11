import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const [isTech, setIsTech] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, updatePassword } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Force Password Change flow
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tempUserId, setTempUserId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const loggedInUser = await login(email, password, isTech ? 'tech' : 'customer');
            if (loggedInUser.requiresPasswordReset) {
                setTempUserId(loggedInUser.id);
                setIsChangingPassword(true);
            } else {
                navigate(isTech ? '/tech-dashboard' : '/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChangeSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            setIsLoading(false);
            return;
        }

        try {
            await updatePassword(tempUserId, newPassword);
            setIsChangingPassword(false);
            navigate(isTech ? '/tech-dashboard' : '/dashboard');
        } catch (err) {
            setError(err.message || 'Failed to update password.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isChangingPassword) {
        return (
            <div className="container" style={{
                padding: '4rem 1rem',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    backgroundColor: 'var(--color-white)',
                    padding: '2rem',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                        Password Reset
                    </h1>
                    <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '2rem' }}>
                        This is your first login. Please choose a new password.
                    </p>

                    <form onSubmit={handlePasswordChangeSubmit}>
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

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>New Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd'
                                    }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                        borderRadius: '8px',
                                        border: '1px solid #ddd'
                                    }}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '0.875rem',
                                backgroundColor: 'var(--color-secondary)',
                                color: 'var(--color-white)',
                                borderRadius: '8px',
                                fontWeight: '600',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Updating...' : 'Set Password'} <ArrowRight size={18} />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{
            padding: '4rem 1rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '60vh'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: 'var(--color-white)',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-md)'
            }}>
                <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                    Welcome Back
                </h1>
                <p style={{ textAlign: 'center', opacity: 0.6, marginBottom: '2rem' }}>
                    Please sign in to continue
                </p>

                {/* Role Toggle */}
                <div style={{
                    display: 'flex',
                    backgroundColor: '#f5f5f5',
                    padding: '4px',
                    borderRadius: '8px',
                    marginBottom: '2rem'
                }}>
                    <button
                        type="button"
                        onClick={() => setIsTech(false)}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '6px',
                            backgroundColor: !isTech ? 'var(--color-white)' : 'transparent',
                            boxShadow: !isTech ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: !isTech ? '600' : '400',
                            transition: 'all 0.2s'
                        }}
                    >
                        Customer
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsTech(true)}
                        style={{
                            flex: 1,
                            padding: '0.5rem',
                            borderRadius: '6px',
                            backgroundColor: isTech ? 'var(--color-white)' : 'transparent',
                            boxShadow: isTech ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                            fontWeight: isTech ? '600' : '400',
                            transition: 'all 0.2s'
                        }}
                    >
                        Nail Tech
                    </button>
                </div>

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

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd'
                                }}
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '12px', opacity: 0.4 }} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd'
                                }}
                                placeholder="••••••••"
                            />
                        </div>

                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.875rem',
                            backgroundColor: 'var(--color-secondary)',
                            color: 'var(--color-white)',
                            borderRadius: '8px',
                            fontWeight: '600',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} />
                    </button>
                </form>

                {!isTech && (
                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                        Don't have an account? <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Register here</Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Login;
