const mongoose = require('mongoose');
const redis = require('redis');
const promisify = require('util').promisify;
const redisUrl = require('../config/keys').redisUrl;

const exec = mongoose.Query.prototype.exec;
const client = redis.createClient(redisUrl);
client.hget = promisify(client.hget);

mongoose.Query.prototype.cache = function(options = {}) {
    // Enable _useCache for the model
    this._useCache = true;

    // Using a hashkey for passing whatever key for the cache key otherwise default string is set
    this._hashKey = JSON.stringify(options.key) || 'default'

    // Return this for continue with chaning
    return this;
}

mongoose.Query.prototype.exec = async function() {    
    // Old version
    // const key = Object.assign({}, this.getQuery(), {
    //     collection: this.mongooseCollection.name
    // })

    // Validate if we are using cache function
    if(!this._useCache) {
        return exec.apply(this, arguments);
    }

    // New version with spreed operator
    const key = JSON.stringify({...this.getQuery(), collection : this.mongooseCollection.name });

    // See if we have a value for 'key' in redis
    const cacheValue = await client.hget(this._hashKey, key);
    
    if(cacheValue) {
        console.log('there is cache')
        const model = JSON.parse(cacheValue);

        return Array.isArray(model) 
            ? model.map(modelItem => this.model(modelItem)) 
            : this.model(model); 
    }

    const result = await exec.apply(this, arguments);
    client.hset(this._hashKey, key, JSON.stringify(result));

    return result
};

module.exports = {
    clearCache(hashkey) {
        client.del(JSON.stringify(hashkey));
    }
};

