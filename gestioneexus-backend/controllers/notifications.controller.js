const pool = require('../db/database');

const getNotifications = async (req, res) => {
    try {
        const notifications = [];

        // 1. Alerta de bajo stock (menos de 3 unidades)
        const [lowStockProducts] = await pool.query('SELECT name, quantity FROM products WHERE quantity < 3 AND is_active = TRUE');
        lowStockProducts.forEach(p => {
            notifications.push({
                id: `stock-${p.name.replace(/\s/g, '-')}`,
                type: 'stock_alert',
                message: `Reponer stock de '${p.name}', quedan solo ${p.quantity} unidades.`
            });
        });

        // 2. Alerta de clientes en mora (fecha límite ya pasó)
        const [overduePlans] = await pool.query(
            "SELECT id, customer_name FROM layaway_plans WHERE deadline < CURDATE() AND status = 'active'"
        );
        overduePlans.forEach(p => {
            notifications.push({
                id: `overdue-${p.id}`,
                type: 'payment_due',
                message: `¡El plan separe del cliente ${p.customer_name} está VENCIDO!`
            });
        });

        // 3. Alerta: Clientes con fecha próxima a vencer (en los próximos 3 días)
        const [dueSoonPlans] = await pool.query(
            "SELECT id, customer_name, deadline FROM layaway_plans WHERE deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND status = 'active'"
        );
        dueSoonPlans.forEach(p => {
            const formattedDate = new Date(p.deadline);
            formattedDate.setDate(formattedDate.getDate() + 1);
            notifications.push({
                id: `duesoon-${p.id}`,
                type: 'payment_soon',
                message: `El plazo de ${p.customer_name} vence pronto (${formattedDate.toLocaleDateString('es-CO', {day: 'numeric', month: 'long'})}).`
            });
        });

        res.json(notifications);

    } catch (error) {
        console.error("Error al obtener las notificaciones:", error);
        res.status(500).json({ msg: 'Error al obtener las notificaciones' });
    }
};

module.exports = { getNotifications };