import { createContext, useContext, useState, useEffect } from 'react';

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

    const login = async (role, userData) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const newUser = { ...userData, role };
        setUser(newUser);
        localStorage.setItem('nail_nook_user', JSON.stringify(newUser));
        return newUser;
    };

    const register = async (userData) => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // In a real app we'd check if user exists, etc.
        // For prototype, we just log them in as customer
        const newUser = { ...userData, role: 'customer' };
        setUser(newUser);
        localStorage.setItem('nail_nook_user', JSON.stringify(newUser));
        return newUser;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('nail_nook_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
