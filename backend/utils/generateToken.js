const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    const secret = process.env.JWT_SECRET || 'emergency_secret_voxxera_pos_2026';
    return jwt.sign({ id }, secret, {
        expiresIn: '30d',
    });
};

module.exports = generateToken;
