const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Conectado correctamente a MongoDB');
  } catch (error) {
    console.error('Error al concetar con MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
