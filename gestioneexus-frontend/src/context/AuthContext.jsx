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
                // Usamos la información del usuario que viene del backend, es la más fiable
                setUser(data.user);
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
            // Guardamos el objeto de usuario completo que nos da el backend
            setUser(data.user);
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

    // --- NUEVA FUNCIÓN PARA ACTUALIZAR EL USUARIO EN EL CONTEXTO ---
    // Esta función nos permitirá actualizar el estado del usuario desde cualquier
    // componente, como la página de perfil después de cambiar la foto.
    const updateUserContext = (newUserData) => {
        setUser(prevUser => ({
            ...prevUser,
            ...newUserData
        }));
    };

    return (
        <AuthContext.Provider value={{ user, setUser: updateUserContext, login, logout, loading, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};