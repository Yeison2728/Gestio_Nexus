import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, getWeek, getYear } from 'date-fns';
import { es } from 'date-fns/locale';
import Swal from 'sweetalert2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Componentes Auxiliares ---

const MetricCard = ({ title, value, colorClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-md text-center">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
    </div>
);

const RankingTable = ({ headers, data, renderRow }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                    <th className="px-6 py-3">Pos.</th>
                    {headers.map(header => <th key={header} className="px-6 py-3">{header}</th>)}
                </tr>
            </thead>
            <tbody>
                {data && data.length > 0 ? data.map((item, index) => (
                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold">{index + 1}</td>
                        {renderRow(item)}
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={headers.length + 1} className="text-center py-8 text-gray-500">No hay datos para mostrar.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const FilterButton = ({ onClick, label, isActive }) => (
    <button onClick={onClick} className={`px-4 py-1 rounded-md text-sm font-semibold transition-colors ${isActive ? 'bg-white shadow' : 'bg-transparent text-gray-600 hover:bg-white hover:bg-opacity-50'}`}>
        {label}
    </button>
);


// --- Componente Principal ---
const MetricsPage = () => {
    const [metrics, setMetrics] = useState({ 
        salesData: [], 
        employeeRanking: [], 
        productRankingByQuantity: [],
        mostProfitableProducts: [],
        stagnantProducts: [],
        grossProfit: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeQuickFilter, setActiveQuickFilter] = useState('monthly');

    // Estado para los filtros de fecha. Inicia con el mes actual por defecto.
    const [dateRange, setDateRange] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    // Carga inicial de datos al montar el componente
    useEffect(() => {
        fetchMetrics(dateRange);
    }, []);

    // Función principal para obtener los datos aplicando los filtros
    const fetchMetrics = (filters) => {
        setLoading(true);
        api.get('/metrics', { params: filters })
            .then(response => { 
                setMetrics(response.data); 
            })
            .catch(err => {
                console.error("Error fetching metrics:", err);
                Swal.fire('Error', 'No se pudieron cargar las métricas.', 'error');
            })
            .finally(() => setLoading(false));
    };

    // Se ejecuta cuando el usuario cambia las fechas en los inputs
    const handleDateChange = (e) => {
        setActiveQuickFilter(null); // Deselecciona los botones de filtro rápido
        setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Se ejecuta al hacer clic en el botón "Aplicar Filtro"
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchMetrics(dateRange);
    };

    // Se ejecuta al hacer clic en los botones de filtro rápido
    const handleQuickFilterClick = (filterType) => {
        setActiveQuickFilter(filterType);
        const now = new Date();
        let newStartDate, newEndDate;

        if (filterType === 'daily') {
            newStartDate = now;
            newEndDate = now;
        } else if (filterType === 'weekly') {
            newStartDate = startOfWeek(now, { locale: es });
            newEndDate = endOfWeek(now, { locale: es });
        } else if (filterType === 'monthly') {
            newStartDate = startOfMonth(now);
            newEndDate = endOfMonth(now);
        } else if (filterType === 'yearly') {
            newStartDate = startOfYear(now);
            newEndDate = endOfYear(now);
        }

        const newFilters = {
            startDate: format(newStartDate, 'yyyy-MM-dd'),
            endDate: format(newEndDate, 'yyyy-MM-dd')
        };
        setDateRange(newFilters);
        fetchMetrics(newFilters);
    };
    
    // El resto de funciones y lógica que ya teníamos
    const processSalesData = () => {
        const data = metrics.salesData;
        if (!data || data.length === 0) return { labels: [], datasets: [] };
        const aggregation = data.reduce((acc, sale) => {
            const date = new Date(sale.sale_date);
            const adjustedDate = new Date(date.valueOf() + date.getTimezoneOffset() * 60000);
            const key = format(adjustedDate, 'PPP', { locale: es });
            acc[key] = (acc[key] || 0) + parseFloat(sale.daily_total);
            return acc;
        }, {});
        return {
            labels: Object.keys(aggregation),
            datasets: [{ label: 'Ventas Totales', data: Object.values(aggregation), backgroundColor: 'rgba(93, 18, 39, 0.6)', borderWidth: 1 }]
        };
    };
    const chartData = processSalesData();
    const chartOptions = { responsive: true, maintainAspectRatio: false };
    const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value ?? 0);
    
    if (loading) return <div className="text-center py-10">Cargando métricas...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Métricas y Analíticas de Negocio</h1>

            <div className="bg-white p-4 rounded-lg shadow-md border space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">Filtros Rápidos:</span>
                    <div className="flex bg-gray-200 rounded-lg p-1">
                        <FilterButton onClick={() => handleQuickFilterClick('daily')} label="Hoy" isActive={activeQuickFilter === 'daily'} />
                        <FilterButton onClick={() => handleQuickFilterClick('weekly')} label="Esta Semana" isActive={activeQuickFilter === 'weekly'} />
                        <FilterButton onClick={() => handleQuickFilterClick('monthly')} label="Este Mes" isActive={activeQuickFilter === 'monthly'} />
                        <FilterButton onClick={() => handleQuickFilterClick('yearly')} label="Este Año" isActive={activeQuickFilter === 'yearly'} />
                    </div>
                </div>
                <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="startDate" className="text-sm font-medium text-gray-700 block mb-1">Rango Personalizado (Inicio)</label>
                        <input type="date" id="startDate" name="startDate" value={dateRange.startDate} onChange={handleDateChange} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="text-sm font-medium text-gray-700 block mb-1">Rango Personalizado (Fin)</label>
                        <input type="date" id="endDate" name="endDate" value={dateRange.endDate} onChange={handleDateChange} className="w-full mt-1 p-2 border rounded-md" />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 h-10">Aplicar Filtro</button>
                </form>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Ingresos en Período" value={formatCurrency(metrics.salesData.reduce((sum, s) => sum + parseFloat(s.daily_total), 0))} colorClass="text-blue-600" />
                <MetricCard title="Ganancia en Período" value={formatCurrency(metrics.grossProfit)} colorClass="text-green-600" />
                <MetricCard title="Nº de Ventas en Período" value={metrics.employeeRanking.reduce((sum, e) => sum + e.sales_count, 0)} colorClass="text-purple-600" />
                <MetricCard title="Productos sin Venta" value={metrics.stagnantProducts.length} colorClass="text-orange-600" />
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg h-[400px]">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Rendimiento de Ventas en el Período</h3>
                <div className="h-[300px]">
                    <Bar options={chartOptions} data={chartData} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">🏆 Productos Más Rentables</h3>
                    <RankingTable headers={['Producto', 'Ganancia Total']} data={metrics.mostProfitableProducts} renderRow={(item) => (
                        <><td className="px-6 py-4 font-medium text-gray-900">{item.name}</td><td className="px-6 py-4 text-right text-green-600 font-semibold">{formatCurrency(item.total_profit)}</td></>
                    )} />
                </div>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Productos Más Vendidos (Cantidad)</h3>
                    <RankingTable headers={['Producto', 'Unidades Vendidas']} data={metrics.productRankingByQuantity} renderRow={(item) => (
                        <><td className="px-6 py-4 font-medium text-gray-900">{item.name}</td><td className="px-6 py-4 text-center">{item.total_quantity_sold}</td></>
                    )} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">⭐ Ranking de Empleados por Ventas</h3>
                <RankingTable headers={['Empleado', 'Nº de Ventas', 'Total Vendido']} data={metrics.employeeRanking} renderRow={(item) => (
                    <><td className="px-6 py-4 font-medium text-gray-900">{item.full_name}</td><td className="px-6 py-4 text-center">{item.sales_count}</td><td className="px-6 py-4 text-right font-semibold">{formatCurrency(item.total_sold)}</td></>
                )} />
            </div>
            
             <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-4">📦 Productos Sin Movimiento (Stock Estancado)</h3>
                <RankingTable headers={['Producto', 'Stock Actual', 'Valor en Stock (Costo)']} data={metrics.stagnantProducts} renderRow={(item) => (
                    <><td className="px-6 py-4 font-medium text-gray-900">{item.name}</td><td className="px-6 py-4 text-center">{item.stock}</td><td className="px-6 py-4 text-right text-orange-600">{formatCurrency(item.stock * item.cost)}</td></>
                )} />
            </div>
        </div>
    );
};

export default MetricsPage;