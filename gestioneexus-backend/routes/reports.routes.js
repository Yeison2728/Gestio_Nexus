const { Router } = require('express');
const { getFinancialLedger, createFinancialEntry, exportLedgerToExcel } = require('../controllers/reports.controller');
const { validateJWT } = require('../middlewares/validate-jwt');
const { isAdminRole } = require('../middlewares/validate-roles');
const { check, body } = require('express-validator');
const { validateFields } = require('../middlewares/validate-fields');

const router = Router();

router.use(validateJWT, isAdminRole);

router.get('/financial-ledger', getFinancialLedger);

// --- VALIDACIÓN AÑADIDA AQUÍ ---
router.post('/financial-ledger', [
    check('entry_date', 'La fecha de entrada es obligatoria.').isISO8601().toDate(),
    check('entry_date').custom((value) => {
        // Comparamos la fecha de entrada con la fecha actual
        const entryDate = new Date(value);
        const today = new Date();
        // Ponemos la hora a cero para comparar solo las fechas
        entryDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        if (entryDate > today) {
            throw new Error('La fecha del movimiento no puede ser en el futuro.');
        }
        return true;
    }),
    check('concept', 'El concepto es obligatorio.').not().isEmpty(),
    validateFields
], createFinancialEntry);

router.get('/export/excel', exportLedgerToExcel);

module.exports = router;