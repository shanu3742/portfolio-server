const mongoose  = require("mongoose");

const feedackSchema = new  mongoose.Schema({
    name:{
        type:String,
        require:true
    },
    number:{
        type:String,
        require:true
    },
    email:{
        type:String,
        require:true
    },
    message:{
        type:String,
        require:true
    }


})

exports.FEEDBACK = mongoose.model('Feedback',feedackSchema);

