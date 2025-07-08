import React, { useState, useEffect } from 'react';
import api from '../api/api';

const NotificationDropdown = ({ isOpen }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            api.get('/notifications')
                .then(response => {
                    setNotifications(response.data);
                })
                .catch(error => console.error("Error fetching notifications:", error))
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getIconForType = (type) => {
        switch (type) {
            case 'stock_alert': return '📦';
            case 'payment_due': return '🚨';
            case 'payment_soon': return '⏳';
            default: return '🔔';
        }
    };

    return (
        <div className="absolute top-14 right-0 w-80 bg-white rounded-lg shadow-xl border z-50 animate-fade-in-down">
            <div className="p-4 font-bold border-b text-gray-700">Notificaciones</div>
            <div className="max-h-80 overflow-y-auto">
                {loading ? <div className="p-4 text-center text-sm text-gray-500">Cargando...</div> :
                 notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div key={notif.id} className="p-4 border-b last:border-b-0 hover:bg-gray-50 flex items-start gap-3">
                            <span className="mt-1 text-xl">{getIconForType(notif.type)}</span>
                            <p className="text-sm text-gray-800">{notif.message}</p>
                        </div>
                    ))
                 ) : (
                    <div className="p-4 text-center text-sm text-gray-500">No hay notificaciones nuevas.</div>
                 )}
            </div>
        </div>
    );
};

export default NotificationDropdown;