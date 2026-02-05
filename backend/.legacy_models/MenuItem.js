const mongoose = require('mongoose');

const menuItemSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        price: {
            type: Number,
            required: true,
        },
        costPrice: {
            type: Number,
            default: 0,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        image: {
            type: String,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        preparationTime: {
            type: Number, // in minutes
            default: 15,
        },
        variants: [
            {
                name: String,
                price: Number,
            },
        ],
        allergens: [String],
        nutritionalInfo: {
            calories: Number,
            protein: Number,
            carbs: Number,
            fat: Number,
        },
    },
    {
        timestamps: true,
    }
);

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
