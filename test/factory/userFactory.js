    const mongoose = require('mongoose');
    const User = mongoose.model('User');

    // Number.prototype._called = {};

    module.exports = () => {
        return new User({}).save();
    }