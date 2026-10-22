import mongoose from "mongoose";

let isConnecting = false;

export const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return;
    }

    if (isConnecting) {
        return;
    }

    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chat_db";

    try {
        isConnecting = true;
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        console.error("Check Backend/.env MONGODB_URI or start a local MongoDB instance before using auth routes.");
    } finally {
        isConnecting = false;
    }
};

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting reconnect...");
    setTimeout(() => {
        connectDB();
    }, 5000);
});