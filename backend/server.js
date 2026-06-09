const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/students', require('./routes/students'));
app.use('/api/teachers', require('./routes/teachers'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/settings', require('./routes/settings'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
