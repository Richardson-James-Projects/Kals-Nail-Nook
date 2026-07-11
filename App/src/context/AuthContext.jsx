import { createContext, useContext, useState, useEffect } from 'react';
import { hashPassword } from '../utils/crypto';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage on initial load
        const storedUser = localStorage.getItem('nail_nook_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password, role) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (isSupabaseConfigured) {
            const { data: foundUser, error } = await supabase
                .from('nail_nook_users')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();

            if (error || !foundUser) {
                throw new Error('Invalid email or password.');
            }

            // Role checks
            if (role === 'tech') {
                if (foundUser.role !== 'tech' && foundUser.role !== 'owner') {
                    throw new Error('Invalid email or password.');
                }
            } else {
                if (foundUser.role !== role) {
                    throw new Error('Invalid email or password.');
                }
            }

            const hashedPassword = await hashPassword(password);
            if (foundUser.password_hash !== hashedPassword) {
                throw new Error('Invalid email or password.');
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
            const foundUser = users.find(u => {
                const emailMatch = u.email.toLowerCase() === email.toLowerCase();
                if (role === 'tech') {
                    return emailMatch && (u.role === 'tech' || u.role === 'owner');
                }
                return emailMatch && u.role === role;
            });

            if (!foundUser) {
                throw new Error('Invalid email or password.');
            }

            const hashedPassword = await hashPassword(password);
            if (foundUser.passwordHash !== hashedPassword) {
                throw new Error('Invalid email or password.');
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

        if (isSupabaseConfigured) {
            // Check if email exists
            const { data: existingUser } = await supabase
                .from('nail_nook_users')
                .select('id')
                .eq('email', email.toLowerCase())
                .maybeSingle();

            if (existingUser) {
                throw new Error('An account with this email already exists.');
            }

            const passwordHash = await hashPassword(password);
            const newUser = {
                id: `user-${Date.now()}`,
                name,
                email: email.toLowerCase(),
                phone,
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
            const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

            if (emailExists) {
                throw new Error('An account with this email already exists.');
            }

            const passwordHash = await hashPassword(password);
            const newUser = {
                id: `user-${Date.now()}`,
                name,
                email,
                phone,
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

    const logout = () => {
        setUser(null);
        localStorage.removeItem('nail_nook_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updatePassword, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
