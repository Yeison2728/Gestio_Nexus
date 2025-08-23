const pool = require('../db/database');
const { logAction } = require('../helpers/audit.helper');

const getLayawayPlans = async (req, res) => {
    const { search = '', status = 'active' } = req.query;

    try {
        await pool.query("UPDATE layaway_plans SET status = 'overdue' WHERE deadline < CURDATE() AND status = 'active'");
        
        const searchTerm = `%${search}%`;
        const queryParams = [searchTerm, searchTerm];
        
        let query = 'SELECT * FROM layaway_plans WHERE (customer_name LIKE ? OR customer_id_doc LIKE ?)';
        
        if (status && status !== 'all') {
            query += ' AND status = ?';
            queryParams.push(status);
        }

        query += ' ORDER BY created_at DESC';

        const [plans] = await pool.query(query, queryParams);
        
        res.json(plans);
    } catch (error) {
        console.error("Error al obtener planes separe:", error);
        res.status(500).json({ msg: 'Error al obtener los planes separe' });
    }
};

const getLayawayPlanById = async (req, res) => {
    const { id } = req.params;
    try {
        const [[plan]] = await pool.query('SELECT * FROM layaway_plans WHERE id = ?', [id]);

        if (!plan) {
            return res.status(404).json({ msg: 'Plan separe no encontrado' });
        }

        // Se corrige la consulta para tomar el precio actual del producto
        const [products] = await pool.query(
            `SELECT 
                d.quantity, 
                p.price as price_at_sale, 
                p.name as product_name, 
                p.id as product_id 
            FROM layaway_plan_details d 
            JOIN products p ON d.product_id = p.id 
            WHERE d.layaway_plan_id = ?`,
            [id]
        );

        res.json({
            ...plan,
            products: products
        });

    } catch (error) {
        console.error("Error al obtener el detalle del plan separe:", error);
        res.status(500).json({ msg: 'Error al obtener el detalle del plan' });
    }
};


const createLayawayPlan = async (req, res) => {
    const { customer_name, customer_id_doc, customer_contact, total_value, down_payment, deadline, products } = req.body;
    const balance_due = total_value - down_payment;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        for (const product of products) {
            const [[dbProduct]] = await connection.query('SELECT quantity, name FROM products WHERE id = ?', [product.product_id]);
            if (!dbProduct || dbProduct.quantity < product.quantity) {
                await connection.rollback();
                return res.status(400).json({ msg: `Stock insuficiente para el producto: ${dbProduct.name}` });
            }
        }

        const [planResult] = await connection.query(
            'INSERT INTO layaway_plans (customer_name, customer_id_doc, customer_contact, total_value, down_payment, balance_due, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [customer_name, customer_id_doc, customer_contact, total_value, down_payment, balance_due, deadline]
        );
        const planId = planResult.insertId;

        for (const product of products) {
            // Se revierte al INSERT original, compatible con tu base de datos
            await connection.query(
                'INSERT INTO layaway_plan_details (layaway_plan_id, product_id, quantity) VALUES (?, ?, ?)',
                [planId, product.product_id, product.quantity]
            );
        }

        await connection.commit();
        const [newPlan] = await pool.query('SELECT * FROM layaway_plans WHERE id = ?', [planId]);
        await logAction(req.uid, `Creó un plan separe (ID: ${planId}) para el cliente ${customer_name}`);
        res.status(201).json(newPlan[0]);
    } catch (error) {
        await connection.rollback();
        console.error("Error al crear plan separe:", error);
        res.status(500).json({ msg: 'Error al crear el plan separe', error });
    } finally {
        connection.release();
    }
};

const updateLayawayPlan = async (req, res) => {
    const { id } = req.params;
    const { uid } = req;
    const { new_payment_amount, status } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const [[plan]] = await connection.query('SELECT * FROM layaway_plans WHERE id = ?', [id]);
        if (!plan) {
            await connection.rollback();
            return res.status(404).json({ msg: 'Plan separe no encontrado' });
        }
        let { down_payment, balance_due } = plan;
        let newStatus = status || plan.status;

        if (new_payment_amount && !isNaN(new_payment_amount)) {
            const payment = parseFloat(new_payment_amount);
            down_payment = parseFloat(down_payment) + payment;
            balance_due = parseFloat(balance_due) - payment;
            if (balance_due <= 0) {
                newStatus = 'completed';
                balance_due = 0;
            }
        }
        await connection.query(
            'UPDATE layaway_plans SET down_payment = ?, balance_due = ?, status = ? WHERE id = ?',
            [down_payment, balance_due, newStatus, id]
        );
        const [[updatedPlan]] = await connection.query('SELECT * FROM layaway_plans WHERE id = ?', [id]);
        await connection.commit();
        await logAction(uid, `Actualizó el plan separe (ID: ${id}) con un abono.`);
        res.json(updatedPlan);
    } catch (error) {
        await connection.rollback();
        console.error("Error al actualizar el plan:", error);
        res.status(500).json({ msg: 'Error al actualizar el plan' });
    } finally {
        connection.release();
    }
};

const deleteLayawayPlan = async (req, res) => {
    const { id } = req.params;
    const { uid } = req;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        await connection.query('DELETE FROM layaway_plan_details WHERE layaway_plan_id = ?', [id]);
        await connection.query('DELETE FROM layaway_plans WHERE id = ?', [id]);
        await connection.commit();
        await logAction(uid, `Eliminó/Canceló el plan separe (ID: ${id})`);
        res.json({ msg: 'Plan separe eliminado y stock devuelto.' });
    } catch (error) {
        await connection.rollback();
        console.error("Error al eliminar plan separe:", error);
        res.status(500).json({ msg: 'Error al eliminar el plan separe' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getLayawayPlans,
    getLayawayPlanById,
    createLayawayPlan,
    updateLayawayPlan,
    deleteLayawayPlan
};