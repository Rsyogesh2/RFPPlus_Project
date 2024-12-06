// src/app.js
const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const db = require('./config/db');
const dataRoutes = require('./routes/dataRoutes');

const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt'); // Consider using for password hashing
const jwt = require('jsonwebtoken'); // Consider using for authentication
const login = require('./login/login');
const addUsers = require('./routes/addUsers')
// const bcrypt = require("bcryptjs");
const cors = require("cors");

// Allow requests from the frontend
app.use(cors({
  origin: "https://rfpplus-frontend.onrender.com", // Frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
}));

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
// 

app.use(bodyParser.json());

app.use('/', login);
app.use('/', addUsers);
// Home route
// app.use(express.static(path.join(__dirname, 'client/build')));

// API routes (if any)
app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});
// Mount the API routes under `/api`
app.use('/api', dataRoutes);
// Catch-all to serve React frontend for any route
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
// });
// app.use('/api', dataRoutes);

// let transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'bcaboy27@gmail.com',
//     pass: '3years?waste!'  // Use App Password if 2FA is enabled
//   }
// });

// // Test the connection to the server without sending an email
// transporter.verify((error, success) => {
//   if (error) {
//     console.log('Error: ', error);
//   } else {
//     console.log('Server is ready to take messages');
//   }
// });


// Nodemailer transporter (replace with your email credentials)
// const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: 'bcaboy27@gmail.com',
//       pass: '3Years?waste!'
  
//     }
//   });
  
//   // Generate OTP
//   function generateOTP() {
//     return Math.floor(100000 + Math.random() * 900000);
//   }
  
//   // Send OTP via email
//   async function sendOTP(email) {
//     const otp = generateOTP();
//     const mailOptions = {
//       from: 'Yogesh <yogesh@infocuzbpm.com>',
//       to: email,
//       subject: 'Your OTP',
//       text: `Your OTP is: ${otp}`
//     };
  
//     try {
//       await transporter.sendMail(mailOptions);
//       return otp;
//     } catch (error) {
//       console.error('Error sending OTP:', error);   
  
//       throw new Error('Failed to send OTP');
//     }
//   }
  
//   // API endpoint to send OTP
//   app.post('/send-otp', async (req, res) => {
//     const { email } = req.body;
  
//     try {
//       // Check if user exists in the database (optional)
//       // ...
  
//       const otp = await sendOTP(email);
  
//       // Store OTP in the database (e.g., with a time limit)
//       await db.query('INSERT INTO otp_codes (user_id, otp, expires_at) VALUES (?, ?, NOW() + INTERVAL 10 MINUTE)', [/* user_id */, otp]);
  
//       res.json({ message: 'OTP sent successfully' });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });
  
//   // API endpoint to verify OTP
//   app.post('/verify-otp', async (req, res) => {
//     const { email, otp } = req.body;
  
//     try {
//       // Check if OTP is valid and not expired
//       const [rows] = await db.query('SELECT * FROM otp_codes WHERE user_id = ? AND otp = ? AND expires_at > NOW()', [/* user_id */, otp]);
//       if (rows.length === 0) {
//         throw new Error('Invalid OTP or OTP expired');
//       }
  
//       // If OTP is valid, proceed with authentication or other actions
//       // ...
  
//       res.json({ message: 'OTP verified successfully' });
//     } catch (error) {
//       res.status(401).json({ error: error.message });
//     }
//   });
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// async function createGlobalUser(){
//     const password = "system@123";
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);
      
//     const query1 = "INSERT INTO Users_Login (Username, Password,Role,Entity_Name) VALUES (?, ?,?, ?)";
//     db.query(query1, ["AdminUser", hashedPassword,"Global Admin","AppControl"], (err, results) => {
//         if (err) throw err;
//         console.log("User created!");
//     }) }
//     createGlobalUser()
