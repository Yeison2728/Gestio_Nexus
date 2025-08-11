const pool = require('../db/database');
const ExcelJS = require('exceljs');
const { jsPDF } = require("jspdf");
const autoTable = require('jspdf-autotable');

const getFinancialLedger = async (req, res) => {
    // Aceptamos parámetros de paginación y filtros
    const { page = 1, limit = 15, startDate, endDate, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let baseQuery = 'FROM financial_ledger';
    const conditions = [];
    const params = [];

    if (startDate && endDate) {
        conditions.push('entry_date BETWEEN ? AND ?');
        params.push(`${startDate} 00:00:00`, `${endDate} 23:59:59`);
    }
    if (search) {
        conditions.push('concept LIKE ?');
        params.push(`%${search}%`);
    }
    if (conditions.length > 0) {
        baseQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    try {
        // Consulta para obtener los datos de la página actual
        const [entries] = await pool.query(`SELECT * ${baseQuery} ORDER BY entry_date DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
        
        // Consulta para obtener el conteo total de registros que coinciden con los filtros
        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total ${baseQuery}`, params);

        // Nueva lógica para calcular los totales para el período filtrado
        const [[summary]] = await pool.query(`
            SELECT
                SUM(income) as totalIncome,
                SUM(expense) as totalExpense
            ${baseQuery}
        `, params);

        res.json({
            entries,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            summary: {
                totalIncome: summary.totalIncome || 0,
                totalExpense: summary.totalExpense || 0,
                netBalance: (summary.totalIncome || 0) - (summary.totalExpense || 0)
            }
        });
    } catch (error) {
        console.error("Error al obtener el libro contable:", error);
        res.status(500).json({ msg: 'Error al obtener los reportes' });
    }
};

const createFinancialEntry = async (req, res) => {
    const { entry_date, concept, income, expense } = req.body;
    try {
        await pool.query(
            'INSERT INTO financial_ledger (entry_date, concept, income, expense) VALUES (?, ?, ?, ?)',
            [entry_date, concept || null, income || 0, expense || 0]
        );
        res.status(201).json({ msg: 'Entrada contable creada' });
    } catch (error) {
        console.error("Error al registrar movimiento:", error);
        const errorMsg = error.response?.data?.errors?.[0]?.msg || error.response?.data?.msg || 'No se pudo registrar el movimiento.';
        res.status(500).json({ msg: errorMsg });
    }
};

const exportLedgerToExcel = async (req, res) => {
    try {
        // Para exportar, traemos todos los datos, sin paginación
        const [ledgerData] = await pool.query('SELECT entry_date, concept, income, expense FROM financial_ledger ORDER BY entry_date ASC');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reporte Financiero');
        worksheet.columns = [
            { header: 'Fecha', key: 'date', width: 15 },
            { header: 'Concepto', key: 'concept', width: 40 },
            { header: 'Ingresos', key: 'income', width: 15, style: { numFmt: '"$"#,##0.00' } },
            { header: 'Egresos', key: 'expense', width: 15, style: { numFmt: '"$"#,##0.00' } },
        ];
        ledgerData.forEach(row => {
            worksheet.addRow({
                date: new Date(row.entry_date),
                concept: row.concept,
                income: parseFloat(row.income),
                expense: parseFloat(row.expense)
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-financiero.xlsx');
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } catch (error) {
        console.error("Error al generar el Excel:", error);
        res.status(500).json({ msg: 'Error al generar el reporte en Excel' });
    }
};

module.exports = { 
    getFinancialLedger, 
    createFinancialEntry, 
    exportLedgerToExcel 
};