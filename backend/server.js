const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const donorRoutes = require('./routes/donorRoutes');

const app = express();

// Middleware
app.use(cors()); // ফ্রন্টএন্ড HTML থেকে API কল করার অনুমতি দেয়
app.use(express.json()); // JSON ডেটা পার্স করার জন্য

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully!'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// API Routes
app.use('/api/donors', donorRoutes);

// Root Test Route
app.get('/', (req, res) => {
    res.json({
        project: 'DevDuo Local Blood Donor Discovery & Emergency Portal API',
        status: 'Running',
        endpoints: {
            registerDonor: 'POST /api/donors/register',
            searchDonors: 'GET /api/donors?bloodGroup=O+&district=ঢাকা',
            liveStats: 'GET /api/donors/stats',
            toggleStatus: 'PATCH /api/donors/:id/toggle-status',
            logDonation: 'PATCH /api/donors/:id/log-donation'
        }
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});