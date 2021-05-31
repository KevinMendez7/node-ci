const { clearCache } = require('../services/cache')

// Middleware function to clean the cache for specific user after post, delete or update any blog post
async function clearCacheMiddleware(req, res, next) {
    // await next() is a trick for wait till the last middleware and if all completes then is executed
    await next();
    clearCache(req.user.id);
}

module.exports = clearCacheMiddleware