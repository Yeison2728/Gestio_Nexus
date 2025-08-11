const { Router } = require('express');
const { getNotifications } = require('../controllers/notifications.controller');
const { validateJWT } = require('../middlewares/validate-jwt');

const router = Router();

// Todas las rutas de notificaciones requieren un token válido
router.use(validateJWT);

router.get('/', getNotifications);

module.exports = router;