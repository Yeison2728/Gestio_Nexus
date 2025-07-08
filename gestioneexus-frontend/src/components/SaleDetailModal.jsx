import React from 'react';

const SaleDetailModal = ({ sale }) => {
    if (!sale) return null;

    const formatCurrency = (value) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    const formatDate = (dateString) => new Date(dateString).toLocaleString('es-CO');

    const finalAmount = sale.total_amount * (1 - (sale.discount / 100));

    return (
        <div className="space-y-4">
            <div>
                <p><strong>Vendido por:</strong> {sale.user_name}</p>
                <p><strong>Fecha:</strong> {formatDate(sale.created_at)}</p>
                <p><strong>Subtotal:</strong> {formatCurrency(sale.total_amount)}</p>
                <p><strong>Descuento:</strong> {sale.discount}%</p>
                <p className="font-bold"><strong>Total Pagado:</strong> {formatCurrency(finalAmount)}</p>
            </div>
            <h4 className="font-bold text-lg pt-4 border-t">Productos Vendidos</h4>
            <div className="overflow-y-auto max-h-60">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 text-left">Producto</th>
                            <th className="p-2 text-center">Cant.</th>
                            <th className="p-2 text-right">Precio Unit.</th>
                            <th className="p-2 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.details?.map((item, index) => (
                            <tr key={index} className="border-b">
                                <td className="p-2">{item.product_name}</td>
                                <td className="p-2 text-center">{item.quantity}</td>
                                <td className="p-2 text-right">{formatCurrency(item.unit_price)}</td>
                                <td className="p-2 text-right font-semibold">{formatCurrency(item.quantity * item.unit_price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SaleDetailModal;