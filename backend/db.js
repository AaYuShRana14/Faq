const mongoose = require('mongoose');
const DATABASE_URL = 'mongodb+srv://nothingmaster1464:x9690EYiFzdb85Qa@cluster0.nuq3e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const connectDB = async () => {
  try {
    await mongoose.connect(DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); 
  }
};
module.exports = connectDB;