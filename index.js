const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();  // Load environment variables
const rateLimit = require('express-rate-limit');  // Rate limit for security

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const corsOptions = {
  origin: ["http://localhost:3000"],  // Add your production frontend URL here
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,  // Get email user from .env
    pass: process.env.EMAIL_PASS   // Get email password from .env
  }
});

// Email and phone validation functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^\+?[0-9\s\-]+$/;  // Basic validation for phone numbers
  return re.test(phone);
};

// Rate limiter middleware for contact form
const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,  // 10 minutes window
  max: 5,  // limit each IP to 5 requests per windowMs
  message: 'Too many requests, please try again later.'
});

app.get("/", (req, res) => {
  res.send('Welcome to your Express app with rate limiting!');
});

// Contact form route
app.post('/contact', async (req, res) => {
    const { firstName, lastName, email, phone, message } = req.body;
  
    console.log('Received data:', req.body);  // Log received data
  
    // Validate form data
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ code: 400, message: 'All fields are required.' });
    }
  
    if (!validateEmail(email)) {
      return res.status(400).json({ code: 400, message: 'Invalid email format.' });
    }
  
    if (phone && !validatePhone(phone)) {
      return res.status(400).json({ code: 400, message: 'Invalid phone number format.' });
    }
  
    try {
      // Email setup
      const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER,
        subject: `Contact Form Submission from ${firstName} ${lastName}`,
        text: `Name: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nMessage: ${message}`
      };
  
      console.log('Attempting to send email with options:', mailOptions);
  
      const info = await transporter.sendMail(mailOptions);
      console.log('Message sent: %s', info.messageId);
      res.json({ code: 200, message: 'Message sent successfully' });
    } catch (error) {
      console.error('Error sending email:', error);
      if (error.response) {
        console.error('SMTP Response:', error.response);
      }
      res.status(500).json({ code: 500, message: 'Failed to send message. Please try again later.' });
    }
  });
  

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});