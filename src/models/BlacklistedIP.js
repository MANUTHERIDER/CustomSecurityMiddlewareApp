const mongoose = require('mongoose');


const BlackListedIPSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    reason: {// Optional: reason for blacklisting
        type: String,
        defaul: 'Mannual Blacklisting'
    },
    blackListedAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model('BlacklistedIP', BlacklistedIPSchema)