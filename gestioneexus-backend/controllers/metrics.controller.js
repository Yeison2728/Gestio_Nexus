const pool = require('../db/database');

const getMetrics = async (req, res) => {
    // Aceptamos startDate y endDate del frontend
    const { startDate, endDate } = req.query;

    try {
        let salesWhereClause = '';
        let salesParams = [];
        if (startDate && endDate) {
            salesWhereClause = 'WHERE s.created_at BETWEEN ? AND ?';
            salesParams = [`${startDate} 00:00:00`, `${endDate} 23:59:59`];
        }

        // 1. Datos para los gráficos de ventas, ahora filtrados por fecha
        const [salesData] = await pool.query(`
            SELECT 
                DATE(s.created_at) as sale_date,
                SUM(s.total_amount * (1 - s.discount / 100)) as daily_total
            FROM sales s
            ${salesWhereClause.replace('s.created_at', 'created_at')}
            GROUP BY sale_date
            ORDER BY sale_date ASC;
        `, salesParams);

        // 2. Ranking de empleados por ventas, ahora filtrado por fecha
        const [employeeRanking] = await pool.query(`
            SELECT 
                u.full_name,
                COUNT(s.id) as sales_count,
                SUM(s.total_amount * (1 - s.discount / 100)) as total_sold
            FROM sales s
            JOIN users u ON s.user_id = u.id
            ${salesWhereClause}
            GROUP BY s.user_id
            ORDER BY total_sold DESC;
        `, salesParams);

        // 3. Ranking de productos por cantidad vendida, ahora filtrado por fecha
        const [productRankingByQuantity] = await pool.query(`
            SELECT
                p.name,
                SUM(sd.quantity) as total_quantity_sold
            FROM sale_details sd
            JOIN sales s ON sd.sale_id = s.id
            JOIN products p ON sd.product_id = p.id
            ${salesWhereClause}
            GROUP BY sd.product_id
            ORDER BY total_quantity_sold DESC
            LIMIT 10;
        `, salesParams);

        // 4. Productos Más Rentables, ahora filtrado por fecha
        const [mostProfitableProducts] = await pool.query(`
            SELECT 
                p.name,
                SUM((sd.unit_price - sd.unit_cost) * sd.quantity) as total_profit
            FROM sale_details sd
            JOIN sales s ON sd.sale_id = s.id
            JOIN products p ON sd.product_id = p.id
            ${salesWhereClause}
            GROUP BY sd.product_id
            HAVING total_profit > 0
            ORDER BY total_profit DESC
            LIMIT 10;
        `, salesParams);

        // 5. Productos Sin Movimiento (esta consulta no depende de la fecha)
        const [stagnantProducts] = await pool.query(`
            SELECT p.name, p.quantity as stock, p.cost, p.price
            FROM products p
            LEFT JOIN sale_details sd ON p.id = sd.product_id
            WHERE sd.product_id IS NULL AND p.is_active = TRUE;
        `);
        
        // 6. Ganancia Bruta Total, ahora filtrada por fecha
        const [[{ grossProfit }]] = await pool.query(`
            SELECT SUM((sd.unit_price - sd.unit_cost) * sd.quantity) as grossProfit 
            FROM sale_details sd
            JOIN sales s ON sd.sale_id = s.id
            ${salesWhereClause}
        `, salesParams);

        res.json({
            salesData,
            employeeRanking,
            productRankingByQuantity,
            mostProfitableProducts,
            stagnantProducts,
            grossProfit: grossProfit || 0
        });

    } catch (error) {
        console.error("Error al obtener las métricas:", error);
        res.status(500).json({ msg: 'Error al procesar las métricas' });
    }
};

module.exports = {
    getMetrics
};