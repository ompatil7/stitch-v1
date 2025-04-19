const ErrorResponse = require('../utils/errorResponse');

// Admin access middleware
const adminAccess = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return next(
      new ErrorResponse('Not authorized as an admin', 403)
    );
  }
};

module.exports = adminAccess;