import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const DashboardLayout = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // --- CORRECCIÓN AQUÍ: Añadimos '/metrics' y '/profile' a la lista de exclusión ---
    // Lista de rutas donde el buscador global NO debe aparecer
    const hideGlobalSearchOnRoutes = [
        '/reports', 
        '/sales-history', 
        '/sales', 
        '/dashboard', 
        '/profile', 
        '/metrics'
    ];
    
    const showGlobalSearch = !hideGlobalSearchOnRoutes.includes(location.pathname);

    return (
        <div className="relative flex h-screen bg-[#F3F4F6]">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            {isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-black opacity-50 z-20 lg:hidden"></div>}

            <div className="flex-1 flex flex-col overflow-y-auto">
                <div className="flex-1 p-4 sm:p-6 md:p-8 m-4 md:m-8 bg-white rounded-2xl shadow-xl">
                    <Header 
                        searchTerm={searchTerm} 
                        setSearchTerm={setSearchTerm} 
                        toggleSidebar={toggleSidebar}
                        showGlobalSearch={showGlobalSearch}
                    />
                    <main className="mt-8">
                        <Outlet context={{ searchTerm, setSearchTerm }} />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;