import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom'; // Importamos el hook
import api from '../api/api';
import Swal from 'sweetalert2';

const AuditLogPage = () => {
    // Obtenemos el término de búsqueda desde el layout principal
    const { searchTerm } = useOutletContext(); 

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    // Estado para el término de búsqueda con "debouncing"
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    // Efecto para aplicar el debouncing al término de búsqueda
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reseteamos a la página 1 en cada nueva búsqueda
        }, 500);

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);

    // Efecto para obtener los datos, ahora depende del término con debounce y de la página
    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/logs', {
                    params: { 
                        page: currentPage,
                        search: debouncedSearchTerm // Usamos el término con debounce
                    }
                });
                setLogs(data.logs);
                setTotalPages(data.totalPages);
            } catch (error) {
                console.error("Error al obtener los logs:", error);
                Swal.fire('Error', 'No se pudieron cargar los registros de auditoría.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [currentPage, debouncedSearchTerm]);

    const formatDate = (dateString) => new Date(dateString).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Historial de Cambios (Auditoría)</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-lg overflow-x-auto">
                {loading ? <div className="text-center py-8">Cargando...</div> :
                logs.length > 0 ? (
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th className="px-6 py-3">Fecha y Hora</th>
                                <th className="px-6 py-3">Usuario</th>
                                <th className="px-6 py-3">Acción Realizada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4">{formatDate(log.created_at)}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{log.user_name}</td>
                                    <td className="px-6 py-4">{log.action}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-8 text-gray-500">No se encontraron registros para la búsqueda.</div>
                )}
            </div>

            {/* Paginación */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50">Anterior</button>
                    <span>Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong></span>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50">Siguiente</button>
                </div>
            )}
        </div>
    );
};

export default AuditLogPage;