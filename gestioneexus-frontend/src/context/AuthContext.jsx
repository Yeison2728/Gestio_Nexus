import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/api';
import Swal from 'sweetalert2';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const { data } = await api.get('/auth/renew');
                localStorage.setItem('token', data.token);
                const decodedUser = jwtDecode(data.token);
                setUser({
                    id: decodedUser.uid,
                    name: data.user.name,
                    role: decodedUser.role,
                    profilePictureUrl: data.user.profile_picture_url
                });
            } catch (error) {
                localStorage.removeItem('token');
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuthStatus();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            const decodedUser = jwtDecode(data.token);
            setUser({
                id: decodedUser.uid,
                name: data.user.fullName,
                role: decodedUser.role,
                profilePictureUrl: data.user.profile_picture_url
            });
            return true;
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error en el inicio de sesión', text: error.response?.data?.msg || 'Credenciales incorrectas.' });
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};