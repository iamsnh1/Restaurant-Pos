const { prisma } = require('../config/db');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user.id, // compatibility
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public (Initial setup) / Admin
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;

    const userExists = await prisma.user.findUnique({
        where: { email },
    });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role || 'waiter',
        },
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user.id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    One-time setup: create first admin if no users exist
// @route   POST /api/auth/setup
// @access  Public (only works when no users in DB)
const setupFirstUser = async (req, res) => {
    const { name, email, password } = req.body;
    const count = await prisma.user.count();
    if (count > 0) {
        return res.status(400).json({ message: 'Setup already completed' });
    }
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password required' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await prisma.user.create({
        data: {
            name: name || 'Admin',
            email,
            password: hashedPassword,
            role: 'admin',
        },
    });
    res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id),
    });
};

const setupAdminEmergency = async (req, res) => {
    try {
        const count = await prisma.user.count();
        if (count > 0) {
            return res.send('<h1>✅ Database already has users.</h1><p>Setup is not needed. Try logging in with your credentials.</p>');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await prisma.user.create({
            data: {
                name: 'Main Admin',
                email: 'admin@restaurant.com',
                password: hashedPassword,
                role: 'admin',
            },
        });

        res.send('<h1>🎉 Admin Created Successfully!</h1><p><b>Email:</b> admin@restaurant.com<br><b>Password:</b> admin123</p><p>You can now go to Vercel and log in.</p>');
    } catch (error) {
        res.status(500).send(`<h1>❌ Setup Failed</h1><p>${error.message}</p>`);
    }
};

module.exports = { authUser, registerUser, setupFirstUser, setupAdminEmergency };
