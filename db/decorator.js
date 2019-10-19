const User = require('./models/User');
// const Product = require('./models/Product');

module.exports = function(req, res, next) {
  req.db = {
    User: User
    // Product: Product
  };
  next();
};
