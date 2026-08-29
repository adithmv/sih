require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Migrant Health Backend running' });
});

app.use('/api/v1', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const treatmentRoutes = require('./src/routes/treatmentRoutes');
// ...
app.use('/api/v1', treatmentRoutes);

const claimRoutes = require('./src/routes/claimRoutes');
// ...
app.use('/api/v1', claimRoutes);