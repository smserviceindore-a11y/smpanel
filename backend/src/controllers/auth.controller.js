const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
  verificationStatus: user.verificationStatus,
  profile: user.profile,
  commissionRate: user.commissionRate,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (user.status !== 'active') {
      return sendError(res, 'Account is inactive or suspended. Contact administrator.', 403);
    }

    if (user.role === 'developer' && user.verificationStatus === 'rejected') {
      return sendError(res, 'Developer account was rejected. Contact administrator.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    sendSuccess(
      res,
      {
        token,
        user: publicUser(user),
        dashboardPath:
          user.role === 'super_admin'
            ? '/super-admin'
            : user.role === 'admin'
              ? '/admin'
              : user.role === 'support_agent'
                ? '/support'
                : user.role === 'developer'
                  ? '/developer'
                  : '/client',
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role, company, skills, experience, portfolio, github } = req.body;

    if (!['client', 'developer'].includes(role)) {
      return sendError(res, 'Only client or developer registration is allowed here.', 400);
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return sendError(res, 'Email already registered', 409);
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
      status: 'active',
      verificationStatus: role === 'developer' ? 'pending' : 'verified',
      profile: {
        company: company || '',
        bio: '',
        skills: skills || [],
        experience: experience || '',
        portfolio: portfolio || '',
        github: github || '',
      },
    });

    const token = generateToken(user._id);

    sendSuccess(
      res,
      {
        token,
        user: publicUser(user),
        dashboardPath: role === 'developer' ? '/developer' : '/client',
        message:
          role === 'developer'
            ? 'Registered. Pending admin verification for marketplace publish rights.'
            : 'Client account created successfully.',
      },
      'Registration successful',
      201
    );
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    sendSuccess(res, publicUser(req.user), 'Profile fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { login, register, getMe, publicUser };
