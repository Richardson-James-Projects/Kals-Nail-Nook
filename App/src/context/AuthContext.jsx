import { createContext, useContext, useState, useEffect } from 'react';
import { hashPassword } from '../utils/crypto';

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
    };

    const register = async (name, email, phone, password) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

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
    };

    const updatePassword = async (userId, newPassword) => {
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
