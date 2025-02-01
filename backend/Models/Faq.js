const mongoose = require('mongoose');
const Schema=mongoose.Schema;
const faqSchema=new Schema({
    question:{
        type:String,
        required:true
    },
    answer:{
        type:String,
        required:true
    },
    translations:{
        hi: {
            question: { type: String },
            answer: { type: String },
          },
          bn: {
            question: { type: String },
            answer: { type: String },
          },
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }
});
module.exports=mongoose.model('Faq',faqSchema);