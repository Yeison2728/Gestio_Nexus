// /routes/layaway.routes.js
const { Router } = require('express');
const { check } = require('express-validator');

// --- 1. IMPORTAMOS LA NUEVA FUNCIÓN DEL CONTROLADOR ---
const { 
    createLayawayPlan, 
    getLayawayPlans, 
    updateLayawayPlan, 
    deleteLayawayPlan,
    getLayawayPlanById // <-- ¡Importante!
} = require('../controllers/layaway.controller');

const { validateJWT } = require('../middlewares/validate-jwt');
const { validateFields } = require('../middlewares/validate-fields');

const router = Router();

router.use(validateJWT);

router.get('/', getLayawayPlans);

// --- 2. AÑADIMOS LA RUTA QUE FALTABA ---
// Esta ruta maneja las peticiones para obtener un plan específico por su ID
router.get('/:id', getLayawayPlanById);

router.post('/', [
    check('customer_name', 'El nombre del cliente es obligatorio').not().isEmpty(),
    check('total_value', 'El valor total es obligatorio').isNumeric(),
    check('down_payment', 'El abono inicial es obligatorio').isNumeric(),
    check('deadline', 'La fecha límite es obligatoria').isISO8601().toDate(),
    check('products', 'La lista de productos no puede estar vacía').isArray({ min: 1 }),
    validateFields
], createLayawayPlan);

router.put('/:id', updateLayawayPlan);

router.delete('/:id', deleteLayawayPlan);

module.exports = router;
