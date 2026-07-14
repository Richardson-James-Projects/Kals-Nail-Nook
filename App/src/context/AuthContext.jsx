import { createContext, useContext, useState, useEffect } from 'react';
import { hashPassword } from '../utils/crypto';
import { supabase, isSupabaseConfigured, cleanPhoneNumber } from '../utils/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const handleSupabaseUserSync = async (supabaseUser) => {
        try {
            const { data: profile } = await supabase
                .from('nail_nook_users')
                .select('*')
                .eq('id', supabaseUser.id)
                .maybeSingle();

            let sessionUser;

            if (profile) {
                sessionUser = {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone,
                    role: profile.role
                };
            } else {
                const name = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Social User';
                const email = supabaseUser.email;
                
                const newProfile = {
                    id: supabaseUser.id,
                    name: name,
                    email: email ? email.toLowerCase() : null,
                    phone: null,
                    password_hash: 'oauth-provider',
                    role: 'customer'
                };

                await supabase.from('nail_nook_users').insert([newProfile]);

                sessionUser = {
                    id: newProfile.id,
                    name: newProfile.name,
                    email: newProfile.email,
                    phone: newProfile.phone,
                    role: newProfile.role
                };
            }

            setUser(sessionUser);
            localStorage.setItem('nail_nook_user', JSON.stringify(sessionUser));
        } catch (err) {
            console.error('Error syncing Supabase user profile:', err);
        }
    };

    useEffect(() => {
        const storedUser = localStorage.getItem('nail_nook_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        let authSubscription = null;

        if (isSupabaseConfigured) {
            const checkSession = async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (session && session.user) {
                    await handleSupabaseUserSync(session.user);
                }
            };
            checkSession();

            const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (session && session.user) {
                    await handleSupabaseUserSync(session.user);
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    localStorage.removeItem('nail_nook_user');
                }
            });
            authSubscription = data.subscription;
        }

        setLoading(false);

        return () => {
            if (authSubscription) {
                authSubscription.unsubscribe();
            }
        };
    }, []);

    const login = async (emailOrPhone, password, role) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (isSupabaseConfigured) {
            const isEmailInput = emailOrPhone.includes('@');
            let query = supabase.from('nail_nook_users').select('*');
            
            if (isEmailInput) {
                query = query.eq('email', emailOrPhone.toLowerCase());
            } else {
                query = query.eq('phone', cleanPhoneNumber(emailOrPhone));
            }

            const { data: foundUser, error } = await query.maybeSingle();

            if (error || !foundUser) {
                throw new Error('Invalid email, phone number, or password.');
            }

            // Role checks
            if (role === 'tech') {
                if (foundUser.role !== 'tech' && foundUser.role !== 'owner') {
                    throw new Error('Invalid email, phone number, or password.');
                }
            } else {
                if (foundUser.role !== role) {
                    throw new Error('Invalid email, phone number, or password.');
                }
            }

            const hashedPassword = await hashPassword(password);
            if (foundUser.password_hash !== hashedPassword) {
                throw new Error('Invalid email, phone number, or password.');
            }

            // Convert to session user format
            const sessionUser = {
                id: foundUser.id,
                name: foundUser.name,
                email: foundUser.email,
                phone: foundUser.phone,
                role: foundUser.role,
                requiresPasswordReset: foundUser.requires_password_reset
            };

            setUser(sessionUser);
            localStorage.setItem('nail_nook_user', JSON.stringify(sessionUser));
            return sessionUser;
        } else {
            const users = JSON.parse(localStorage.getItem('nail_nook_users') || '[]');
            const isEmailInput = emailOrPhone.includes('@');
            const cleanPhone = cleanPhoneNumber(emailOrPhone);

            const foundUser = users.find(u => {
                const identifierMatch = isEmailInput
                    ? (u.email && u.email.toLowerCase() === emailOrPhone.toLowerCase())
                    : (u.phone && cleanPhoneNumber(u.phone) === cleanPhone);

                if (role === 'tech') {
                    return identifierMatch && (u.role === 'tech' || u.role === 'owner');
                }
                return identifierMatch && u.role === role;
            });

            if (!foundUser) {
                throw new Error('Invalid email, phone number, or password.');
            }

            const hashedPassword = await hashPassword(password);
            if (foundUser.passwordHash !== hashedPassword) {
                throw new Error('Invalid email, phone number, or password.');
            }

            const { passwordHash, ...sessionUser } = foundUser;
            setUser(sessionUser);
            localStorage.setItem('nail_nook_user', JSON.stringify(sessionUser));
            return sessionUser;
        }
    };

    const register = async (name, email, phone, password) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!email && !phone) {
            throw new Error('An email address or phone number is required to register.');
        }

        const cleanPhone = cleanPhoneNumber(phone);

        if (isSupabaseConfigured) {
            // Check if user already exists by email or phone
            const orConditions = [];
            if (email) orConditions.push(`email.eq."${email.toLowerCase()}"`);
            if (cleanPhone) orConditions.push(`phone.eq."${cleanPhone}"`);

            const { data: existingUsers } = await supabase
                .from('nail_nook_users')
                .select('id')
                .or(orConditions.join(','));

            if (existingUsers && existingUsers.length > 0) {
                throw new Error('An account with this email or phone number already exists.');
            }

            const passwordHash = await hashPassword(password);
            const newUser = {
                id: `user-${Date.now()}`,
                name,
                email: email ? email.toLowerCase() : null,
                phone: cleanPhone || null,
                password_hash: passwordHash,
                role: 'customer'
            };

            const { error: insertError } = await supabase
                .from('nail_nook_users')
                .insert([newUser]);

            if (insertError) {
                throw new Error('Failed to register account.');
            }

            const sessionUser = {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role
            };

            setUser(sessionUser);
            localStorage.setItem('nail_nook_user', JSON.stringify(sessionUser));
            return sessionUser;
        } else {
            const users = JSON.parse(localStorage.getItem('nail_nook_users') || '[]');
            
            const emailExists = email && users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
            const phoneExists = cleanPhone && users.some(u => u.phone && cleanPhoneNumber(u.phone) === cleanPhone);

            if (emailExists || phoneExists) {
                throw new Error('An account with this email or phone number already exists.');
            }

            const passwordHash = await hashPassword(password);
            const newUser = {
                id: `user-${Date.now()}`,
                name,
                email: email ? email.toLowerCase() : null,
                phone: cleanPhone || null,
                passwordHash,
                role: 'customer'
            };

            users.push(newUser);
            localStorage.setItem('nail_nook_users', JSON.stringify(users));

            const { passwordHash: _, ...sessionUser } = newUser;
            setUser(sessionUser);
            localStorage.setItem('nail_nook_user', JSON.stringify(sessionUser));
            return sessionUser;
        }
    };

    const updatePassword = async (userId, newPassword) => {
        if (isSupabaseConfigured) {
            const passwordHash = await hashPassword(newPassword);
            const { error } = await supabase
                .from('nail_nook_users')
                .update({ password_hash: passwordHash, requires_password_reset: false })
                .eq('id', userId);

            if (error) throw new Error('Failed to update password.');

            const storedUser = localStorage.getItem('nail_nook_user');
            if (storedUser) {
                const sessionUser = JSON.parse(storedUser);
                if (sessionUser.id === userId) {
                    delete sessionUser.requiresPasswordReset;
                    setUser(sessionUser);
                    localStorage.setItem('nail_nook_user', JSON.stringify(sessionUser));
                }
            }
        } else {
            const users = JSON.parse(localStorage.getItem('nail_nook_users') || '[]');
            const userIdx = users.findIndex(u => u.id === userId);
            if (userIdx === -1) throw new Error('User not found.');

            const passwordHash = await hashPassword(newPassword);
            users[userIdx].passwordHash = passwordHash;
            delete users[userIdx].requiresPasswordReset;

            localStorage.setItem('nail_nook_users', JSON.stringify(users));

            // If this is the currently logged-in user, update session
            const storedUser = localStorage.getItem('nail_nook_user');
            if (storedUser) {
                const sessionUser = JSON.parse(storedUser);
                if (sessionUser.id === userId) {
                    delete sessionUser.requiresPasswordReset;
                    setUser(sessionUser);
                    localStorage.setItem('nail_nook_user', JSON.stringify(sessionUser));
                }
            }
        }
    };

    const loginWithOAuth = async (provider) => {
        if (!isSupabaseConfigured) {
            throw new Error("Social logins are only supported when Supabase is configured. Please configure your project credentials.");
        }
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
        return data;
    };

    const logout = async () => {
        if (isSupabaseConfigured) {
            try {
                await supabase.auth.signOut();
            } catch (err) {
                console.error('Error signing out of Supabase:', err);
            }
        }
        setUser(null);
        localStorage.removeItem('nail_nook_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updatePassword, loginWithOAuth, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
