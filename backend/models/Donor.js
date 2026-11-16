const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'পূর্ণ নাম আবশ্যক'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'মোবাইল নম্বর আবশ্যক'],
        unique: true,
        trim: true
    },
    bloodGroup: {
        type: String,
        required: [true, 'রক্তের গ্রুপ আবশ্যক'],
        enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },
    district: {
        type: String,
        required: [true, 'জেলা আবশ্যক'],
        trim: true
    },
    area: {
        type: String,
        required: [true, 'উপজেলা বা এলাকা আবশ্যক'],
        trim: true
    },
    lastDonationDate: {
        type: Date,
        default: null
    },
    // ডোনারের ম্যানুয়াল অ্যাভেইলেবিলিটি টগল (Active / Temporarily Unavailable)
    isAvailable: {
        type: Boolean,
        default: true
    },
    // রক্তদানের ইতিহাস ও টাইমস্ট্যাম্প লগ
    donationLogs: [
        {
            donatedAt: { type: Date, required: true },
            hospitalOrNote: { type: String, default: 'Voluntary Donation' }
        }
    ]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// ৯০-দিনের মেডিকেল কুলডাউন ক্যালকুলেশন (Virtual Field)
donorSchema.virtual('cooldownStatus').get(function () {
    if (!this.lastDonationDate) {
        return {
            inCooldown: false,
            daysRemaining: 0,
            effectiveAvailability: this.isAvailable
        };
    }

    const today = new Date();
    const lastDate = new Date(this.lastDonationDate);
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays < 90) {
        return {
            inCooldown: true,
            daysRemaining: 90 - diffDays,
            effectiveAvailability: false // ৯০ দিনের মধ্যে থাকলে স্বয়ংক্রিয়ভাবে Unavailable
        };
    }

    return {
        inCooldown: false,
        daysRemaining: 0,
        effectiveAvailability: this.isAvailable
    };
});

module.exports = mongoose.model('Donor', donorSchema);