const pool = require('../db/database');

const getLogs = async (req, res) => {
    // Obtenemos los parámetros de paginación y búsqueda
    const { page = 1, limit = 15, search = '' } = req.query;
    const offset = (page - 1) * limit;

    try {
        const searchTerm = `%${search}%`;
        
        // --- CONSULTA PRINCIPAL ACTUALIZADA CON BÚSQUEDA ---
        const [logs] = await pool.query(`
            SELECT 
                l.id,
                l.action,
                l.created_at,
                u.full_name as user_name
            FROM audit_logs l
            JOIN users u ON l.user_id = u.id
            WHERE u.full_name LIKE ? OR l.action LIKE ?
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        `, [searchTerm, searchTerm, parseInt(limit), parseInt(offset)]);

        // --- CONSULTA DE CONTEO TOTAL ACTUALIZADA CON BÚSQUEDA ---
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total 
             FROM audit_logs l
             JOIN users u ON l.user_id = u.id
             WHERE u.full_name LIKE ? OR l.action LIKE ?`,
            [searchTerm, searchTerm]
        );
        
        res.json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
        });

    } catch (error) {
        console.error("Error al obtener los logs de auditoría:", error);
        res.status(500).json({ msg: 'Error al obtener los registros de auditoría' });
    }
};

module.exports = {
    getLogs
};