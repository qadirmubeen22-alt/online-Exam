const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'proctor_jwt_secret_key_987654321_secure';

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists' });
    }

    // Attach user without sensitive passwordHash
    req.user = {
      id: String(user._id),
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired authentication token', error: error.message });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Requires one of roles: [${roles.join(', ')}]. Current role: ${req.user ? req.user.role : 'none'}`
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
  requireTeacher: requireRole('teacher'),
  requireStudent: requireRole('student'),
  JWT_SECRET,
};
