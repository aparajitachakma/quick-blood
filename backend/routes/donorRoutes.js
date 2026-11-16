const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');

// ১. নতুন ডোনার রেজিস্ট্রেশন (POST /api/donors/register)
router.post('/register', async (req, res) => {
    try {
        const { fullName, phone, bloodGroup, district, area, lastDonationDate } = req.body;

        const existingDonor = await Donor.findOne({ phone });
        if (existingDonor) {
            return res.status(400).json({ success: false, message: 'এই মোবাইল নম্বর দিয়ে আগেই রেজিস্ট্রেশন করা হয়েছে!' });
        }

        const donationLogs = lastDonationDate 
            ? [{ donatedAt: new Date(lastDonationDate), hospitalOrNote: 'Initial Registration Log' }] 
            : [];

        const newDonor = new Donor({
            fullName,
            phone,
            bloodGroup,
            district,
            area,
            lastDonationDate: lastDonationDate || null,
            donationLogs
        });

        await newDonor.save();
        res.status(201).json({
            success: true,
            message: 'রক্তদাতা হিসেবে রেজিস্ট্রেশন সফল হয়েছে!',
            data: newDonor
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ২. ডোনার খোঁজা ও ফিল্টার ইঞ্জিন (GET /api/donors?bloodGroup=O+&district=ঢাকা)
router.get('/', async (req, res) => {
    try {
        const { bloodGroup, district, area } = req.query;
        let query = {};

        if (bloodGroup) query.bloodGroup = bloodGroup;
        if (district) query.district = new RegExp(district, 'i');
        if (area) query.area = new RegExp(area, 'i');

        const donors = await Donor.find(query).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: donors.length,
            data: donors
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ৩. লাইভ স্ট্যাটিস্টিক্স কাউন্টার (GET /api/donors/stats)
router.get('/stats', async (req, res) => {
    try {
        const totalDonors = await Donor.countDocuments();
        const donorsWithLogs = await Donor.find({}, 'donationLogs');
        const totalDonations = donorsWithLogs.reduce((sum, d) => sum + d.donationLogs.length, 0);

        res.status(200).json({
            success: true,
            data: {
                activeDonors: totalDonors,
                successfulDonations: totalDonations,
                districtsCovered: 64
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ৪. ডোনার অ্যাভেইলেবিলিটি টগল (PATCH /api/donors/:id/toggle-status)
router.patch('/:id/toggle-status', async (req, res) => {
    try {
        const donor = await Donor.findById(req.params.id);
        if (!donor) {
            return res.status(404).json({ success: false, message: 'ডোনার খুঁজে পাওয়া যায়নি' });
        }

        if (donor.cooldownStatus.inCooldown) {
            return res.status(400).json({
                success: false,
                message: `আপনি ৯০-দিনের কুলডাউনে আছেন। আরও ${donor.cooldownStatus.daysRemaining} দিন পর স্ট্যাটাস পরিবর্তন করতে পারবেন।`
            });
        }

        donor.isAvailable = !donor.isAvailable;
        await donor.save();

        res.status(200).json({
            success: true,
            message: `স্ট্যাটাস পরিবর্তিত হয়ে এখন ${donor.isAvailable ? 'Active' : 'Unavailable'}`,
            data: donor
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ৫. সর্বশেষ রক্তদানের তারিখ আপডেট ও লগ যোগ (PATCH /api/donors/:id/log-donation)
router.patch('/:id/log-donation', async (req, res) => {
    try {
        const { donationDate, hospitalOrNote } = req.body;
        const donor = await Donor.findById(req.params.id);

        if (!donor) {
            return res.status(404).json({ success: false, message: 'ডোনার খুঁজে পাওয়া যায়নি' });
        }

        const dateObj = donationDate ? new Date(donationDate) : new Date();
        donor.lastDonationDate = dateObj;
        donor.donationLogs.push({
            donatedAt: dateObj,
            hospitalOrNote: hospitalOrNote || 'Emergency Blood Donation'
        });

        await donor.save();

        res.status(200).json({
            success: true,
            message: 'রক্তদানের তারিখ আপডেট হয়েছে এবং ৯০-দিনের কুলডাউন চালু হয়েছে।',
            data: donor
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;