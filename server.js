const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Announcement = require('./models/Announcement');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://ravikumar850840_db_user:7SytKuP80n56JUzP@cluster0.l3awcew.mongodb.net/employee-leave-management?retryWrites=true&w=majority&appName=Cluster0';
mongoose.set('bufferTimeoutMS', 30000);
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 30000 })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    if (err.message.includes('whitelisted') || err.message.includes('servers in your MongoDB Atlas cluster')) {
      console.error('\n*** ACTION REQUIRED ***');
      console.error('Your IP address is not whitelisted in MongoDB Atlas.');
      console.error('1. Go to MongoDB Atlas Dashboard > Network Access.');
      console.error('2. Click "Add IP Address".');
      console.error('3. Select "Allow Access from Anywhere" (0.0.0.0/0) or "Add Current IP Address".');
      console.error('4. Wait 1-2 minutes and restart this server.\n');
    }
  });

// Seed Admin
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'Admin' });
    if (!adminExists) {
      const email = process.env.ADMIN_EMAIL || 'admin@company.com';
      // Generate a temporary random password and store hashed in DB.
      // Admin should set their password via the Forgot Password page.
      const tempPassword = Math.random().toString(36).slice(-12);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(tempPassword, salt);
      const admin = new User({
        name: 'Super Admin',
        email,
        password: hashedPassword,
        role: 'Admin',
        firstLogin: false
      });
      await admin.save();
      console.log(`Admin user created: ${email}`);
      console.log('Set the admin password via the Forgot Password page using the admin email.');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
};
seedAdmin();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/manager', require('./routes/manager'));
app.use('/api/employee', require('./routes/employee'));

// Public API Routes
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find({ active: true }).sort({ createdAt: -1 }).limit(5);
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// View Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));
app.get('/forgot', (req, res) => res.sendFile(path.join(__dirname, 'views', 'forgot.html')));
app.get('/admin-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));
app.get('/manager-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'manager.html')));
app.get('/employee-dashboard', (req, res) => res.sendFile(path.join(__dirname, 'views', 'employee.html')));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\nServer running on port ${PORT}`);
    console.log(`Access the app at: http://localhost:${PORT}\n`);
  });
}

module.exports = app;
