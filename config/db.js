const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        // Remove process.exit(1) to prevent Vercel 500 FUNCTION_INVOCATION_FAILED crashes
    }
};

module.exports = connectDB;
