const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // <--- CAMBIA ESTA LÍNEA
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares
// AÑADE TODO ESTE BLOQUE EN LUGAR DE app.use(cors());
const corsOptions = {
  origin: "*", // Para ser más seguro, aquí deberías poner la URL de tu frontend
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(morgan('dev')); // <-- AÑADE ESTA LÍNEA PARA USARLO


// Rutas
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/sales', require('./routes/sales.routes'));
app.use('/api/layaway', require('./routes/layaway.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/logs', require('./routes/logs.routes'));
app.use('/api/suppliers', require('./routes/suppliers.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/metrics', require('./routes/metrics.routes')); // <-- RUTA NUEVA AÑADIDA

// Iniciar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});