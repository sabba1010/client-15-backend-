const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        businessName: {
            type: String,
            required: true,
            trim: true,
        },
        abn: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        suburb: {
            type: String,
            trim: true,
        },
        servicesOffered: {
            type: String,
            trim: true,
        },
        website: {
            type: String,
            trim: true,
        },
        yearsInBusiness: {
            type: String,
        },
        shortDescription: {
            type: String,
            trim: true,
        },
        longDescription: {
            type: String,
            trim: true,
        },
        contactPhone: {
            type: String,
            trim: true,
        },
        contactEmail: {
            type: String,
            trim: true,
        },
        logo: {
            type: String,
            default: '',
        },
        coverImage: {
            type: String,
            default: '',
        },
        gallery: [
            {
                url: { type: String },
                title: { type: String, default: '' },
            },
        ],
        tags: [{ type: String }],
        rating: {
            type: String,
            default: '0.0',
        },
        reviews: {
            type: Number,
            default: 0,
        },
        experience: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

const Business = mongoose.model('Business', businessSchema);
module.exports = Business;
