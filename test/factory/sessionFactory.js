const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const key = require('../../config/keys');
const keygrip = Keygrip([key.cookieKey]);

// Number.prototype._called = {};

module.exports = (user) => {

    const sessionObject = {
        passport : {
            user: user._id.toString()
        }
    };

    const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');

    const sig = keygrip.sign(`session=${session}`);

    return {
        session, sig
    }
};