const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique: true, // No Duplicates but allows multiple null values
        trim:true, 
        lowercase:true
    },
    password:{
        type: String,
        required:true
    },
    role:{ // {For authorization like 'user','admin' etc}
        type:String,
        enum:['user','admin'],
        default:'user'
    },
    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model('User',UserSchema);