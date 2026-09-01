require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');
const treatmentRoutes = require('./src/routes/treatmentRoutes');
const claimRoutes = require('./src/routes/claimRoutes');
const disputeRoutes = require('./src/routes/disputeRoutes');
const workerRoutes = require('./src/routes/workerRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Migrant Health Backend running' });
});

app.use('/api/v1', authRoutes);
app.use('/api/v1', treatmentRoutes);
app.use('/api/v1', doctorRoutes);
app.use('/api/v1', claimRoutes);
app.use('/api/v1', disputeRoutes);
app.use('/api/v1', workerRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
