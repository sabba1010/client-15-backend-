const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
    try {
        // Set custom DNS servers to bypass ISP DNS block of SRV records
        try {
            dns.setServers(['1.1.1.1', '8.8.8.8']);
        } catch (dnsErr) {
            console.warn('Failed to set DNS servers:', dnsErr.message);
        }
        
        if (dns.setDefaultResultOrder) {
            dns.setDefaultResultOrder('ipv4first');
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
