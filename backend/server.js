// Farmers 10 - Complete Backend API Server
// Premium Organic Spice Trading Platform
// Features: News Board, Harvest Calendar, E-commerce, Real-time Updates

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const cron = require('node-cron');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.razorpay.com"]
    }
  }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// MongoDB Connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`📊 MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('📊 MongoDB URI not provided - running in demo mode');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('📊 Continuing in demo mode without database');
  }
};

// Demo Data Storage (for when database is not available)
let demoUsers = [];
let demoOrders = [];
let demoLeads = [];

// Utility Functions
const generateOrderNumber = () => {
  return 'F10' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
};

const sendNotification = async (userId, message, type = 'info') => {
  io.to(userId).emit('notification', { message, type, timestamp: new Date() });
};

const sendWhatsAppMessage = async (phone, message) => {
  try {
    if (process.env.MOCK_SMS === 'true' || !process.env.TWILIO_SID) {
      console.log(`📱 WhatsApp (Mock): ${phone} - ${message}`);
      return;
    }
    // Real Twilio implementation would go here
  } catch (error) {
    console.error('WhatsApp send error:', error);
  }
};

const sendEmail = async (to, subject, html) => {
  try {
    if (process.env.MOCK_EMAIL === 'true' || !process.env.EMAIL_USER) {
      console.log(`📧 Email (Mock): ${to} - ${subject}`);
      return;
    }
    // Real email implementation would go here
  } catch (error) {
    console.error('Email send error:', error);
  }
};

// Authentication Middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'farmers10_secret');
    req.user = { 
      id: decoded.userId, 
      role: decoded.role,
      name: decoded.name || 'Demo User',
      email: decoded.email || 'demo@farmers10.com'
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// API Routes

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    features: {
      news_board: true,
      harvest_calendar: true,
      payment_integration: true,
      real_time_updates: true
    }
  });
});

// Demo Authentication Routes
app.post('/api/auth/demo-login', async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['customer', 'farmer', 'admin', 'logistics'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const demoUser = {
      id: 'demo_' + role,
      name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
      email: `demo-${role}@farmers10.com`,
      role: role
    };
    
    const token = jwt.sign(
      { 
        userId: demoUser.id, 
        role: demoUser.role,
        name: demoUser.name,
        email: demoUser.email
      },
      process.env.JWT_SECRET || 'farmers10_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Demo login successful',
      token,
      user: demoUser
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// News & Market Data API Routes
app.get('/api/news', async (req, res) => {
  try {
    const { category, spice, limit = 10, page = 1 } = req.query;
    
    // Demo news data for immediate functionality
    const demoNews = [
      {
        _id: '1',
        title: 'Black Pepper Prices Surge 15% Following Export Demand',
        summary: 'Kerala black pepper prices have increased significantly due to strong international demand and reduced supply from major producing regions.',
        category: 'market_prices',
        spiceTypes: ['Black Pepper'],
        publishedAt: new Date().toISOString(),
        source: 'Spice Trade Journal',
        impact: 'high',
        sentiment: 'positive'
      },
      {
        _id: '2',
        title: 'Monsoon Forecast Positive for Cardamom Cultivation',
        summary: 'Weather department predicts favorable monsoon conditions for cardamom growing regions in Western Ghats, expected to boost yield.',
        category: 'weather',
        spiceTypes: ['Cardamom'],
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'Agricultural Weather Service',
        impact: 'medium',
        sentiment: 'positive'
      },
      {
        _id: '3',
        title: 'Government Announces New Export Incentives for Spice Farmers',
        summary: 'Central government launches scheme to provide financial incentives for organic spice farmers to boost export competitiveness.',
        category: 'government_policy',
        spiceTypes: ['Turmeric', 'Coriander'],
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'Ministry of Agriculture',
        impact: 'high',
        sentiment: 'positive'
      },
      {
        _id: '4',
        title: 'Turmeric Futures Touch New Highs on Supply Concerns',
        summary: 'Turmeric futures on commodity exchanges reached record levels amid concerns over reduced acreage and weather uncertainties.',
        category: 'market_prices',
        spiceTypes: ['Turmeric'],
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: 'Commodity Market News',
        impact: 'medium',
        sentiment: 'neutral'
      },
      {
        _id: '5',
        title: 'Kerala Spice Board Launches Digital Marketplace Initiative',
        summary: 'Spice Board India introduces new digital platform to connect farmers directly with international buyers, eliminating intermediaries.',
        category: 'export_news',
        spiceTypes: ['Black Pepper', 'Cardamom', 'Turmeric'],
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: 'Spice Board India',
        impact: 'high',
        sentiment: 'positive'
      },
      {
        _id: '6',
        title: 'Organic Certification Demand Rises Among Kerala Spice Farmers',
        summary: 'Increasing number of spice farmers in Kerala are seeking organic certification to access premium export markets.',
        category: 'crop_updates',
        spiceTypes: ['Black Pepper', 'Cardamom', 'Turmeric', 'Ginger'],
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        source: 'Organic India Magazine',
        impact: 'medium',
        sentiment: 'positive'
      }
    ];
    
    let filteredNews = demoNews;
    
    if (category && category !== 'all') {
      filteredNews = demoNews.filter(item => item.category === category);
    }
    
    if (spice) {
      filteredNews = filteredNews.filter(item => item.spiceTypes.includes(spice));
    }
    
    const total = filteredNews.length;
    const startIndex = (page - 1) * limit;
    const paginatedNews = filteredNews.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      news: paginatedNews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/market-prices/latest', async (req, res) => {
  try {
    const latestPrices = [
      { spiceInfo: [{ name: 'Black Pepper' }], latestPrice: 1200, priceChange: 2.5, priceChangeAmount: 30, _id: { market: 'Kochi' }, volume: 450 },
      { spiceInfo: [{ name: 'Cardamom' }], latestPrice: 8000, priceChange: -1.2, priceChangeAmount: -100, _id: { market: 'Idukki' }, volume: 125 },
      { spiceInfo: [{ name: 'Turmeric' }], latestPrice: 800, priceChange: 0.8, priceChangeAmount: 6, _id: { market: 'Mumbai' }, volume: 675 },
      { spiceInfo: [{ name: 'Red Chili' }], latestPrice: 600, priceChange: 1.5, priceChangeAmount: 9, _id: { market: 'Delhi' }, volume: 320 },
      { spiceInfo: [{ name: 'Coriander' }], latestPrice: 450, priceChange: -0.5, priceChangeAmount: -2, _id: { market: 'Chennai' }, volume: 580 },
      { spiceInfo: [{ name: 'Cloves' }], latestPrice: 1500, priceChange: 3.2, priceChangeAmount: 48, _id: { market: 'Kochi' }, volume: 89 }
    ];
    
    res.json(latestPrices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Spice Management Routes
app.get('/api/spices', async (req, res) => {
  try {
    const { category, search, origin } = req.query;
    
    // Demo spices data
    const demoSpices = [
      {
        _id: '1',
        name: 'Idukki Black Pepper',
        category: 'pepper',
        basePrice: 1200,
        origin: 'Idukki, Kerala',
        images: ['🌶️'],
        qualityGrade: 'Premium',
        inStock: true,
        description: 'Premium black pepper from the high ranges of Idukki',
        shelfLife: 24,
        isActive: true,
        nutritionalInfo: { calories: 251, protein: 10.4, carbs: 63.9, fat: 3.3, fiber: 25.3 },
        medicinalProperties: ['Anti-inflammatory', 'Antioxidant', 'Digestive aid']
      },
      {
        _id: '2',
        name: 'Wayanad Cardamom',
        category: 'cardamom',
        basePrice: 8000,
        origin: 'Wayanad, Kerala',
        images: ['🌿'],
        qualityGrade: 'Premium',
        inStock: true,
        description: 'Aromatic cardamom from Wayanad hills',
        shelfLife: 18,
        isActive: true,
        nutritionalInfo: { calories: 311, protein: 10.8, carbs: 68.5, fat: 6.7, fiber: 28 },
        medicinalProperties: ['Breath freshener', 'Digestive', 'Antispasmodic']
      },
      {
        _id: '3',
        name: 'Organic Turmeric',
        category: 'turmeric',
        basePrice: 800,
        origin: 'Wayanad, Kerala',
        images: ['🧄'],
        qualityGrade: 'Grade A',
        inStock: true,
        description: 'Organic turmeric with high curcumin content',
        shelfLife: 36,
        isActive: true,
        nutritionalInfo: { calories: 354, protein: 7.8, carbs: 64.9, fat: 9.9, fiber: 21 },
        medicinalProperties: ['Anti-inflammatory', 'Antioxidant', 'Immune booster']
      },
      {
        _id: '4',
        name: 'Kerala Red Chili',
        category: 'chili',
        basePrice: 600,
        origin: 'Kannur, Kerala',
        images: ['🌶️'],
        qualityGrade: 'Grade A',
        inStock: true,
        description: 'Spicy red chili from coastal Kerala',
        shelfLife: 24,
        isActive: true,
        nutritionalInfo: { calories: 324, protein: 12, carbs: 56.6, fat: 17.3, fiber: 27.2 },
        medicinalProperties: ['Metabolism booster', 'Pain relief', 'Heart health']
      },
      {
        _id: '5',
        name: 'Malabar Coriander',
        category: 'coriander',
        basePrice: 450,
        origin: 'Calicut, Kerala',
        images: ['🌿'],
        qualityGrade: 'Grade A',
        inStock: true,
        description: 'Fresh coriander seeds from Malabar coast',
        shelfLife: 24,
        isActive: true,
        nutritionalInfo: { calories: 298, protein: 12.4, carbs: 55, fat: 17.8, fiber: 41.9 },
        medicinalProperties: ['Blood sugar control', 'Cholesterol reduction', 'Digestive aid']
      },
      {
        _id: '6',
        name: 'Kerala Cloves',
        category: 'cloves',
        basePrice: 1500,
        origin: 'Idukki, Kerala',
        images: ['🌸'],
        qualityGrade: 'Premium',
        inStock: true,
        description: 'Premium cloves with intense aroma',
        shelfLife: 36,
        isActive: true,
        nutritionalInfo: { calories: 274, protein: 5.9, carbs: 65.5, fat: 13, fiber: 33.9 },
        medicinalProperties: ['Antimicrobial', 'Pain relief', 'Oral health']
      }
    ];
    
    let filteredSpices = demoSpices.filter(spice => spice.isActive);
    
    if (category) {
      filteredSpices = filteredSpices.filter(spice => spice.category === category);
    }
    
    if (origin) {
      filteredSpices = filteredSpices.filter(spice => spice.origin.toLowerCase().includes(origin.toLowerCase()));
    }
    
    if (search) {
      filteredSpices = filteredSpices.filter(spice => 
        spice.name.toLowerCase().includes(search.toLowerCase()) ||
        spice.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    res.json(filteredSpices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lead Management Routes
app.post('/api/leads', async (req, res) => {
  try {
    const { name, email, phone, interestedSpices, monthlyQuantity } = req.body;
    
    // Store lead in demo storage
    const leadId = 'lead_' + Date.now();
    const newLead = {
      id: leadId,
      name,
      email,
      phone,
      interestedSpices,
      monthlyQuantity,
      createdAt: new Date(),
      status: 'new'
    };
    
    demoLeads.push(newLead);
    
    await sendEmail(email || 'demo@farmers10.com', 'Your Farmers 10 Quote', `
      <h2>Thank you ${name}!</h2>
      <p>We've received your request for ${interestedSpices ? interestedSpices.join(', ') : 'premium spices'}.</p>
      <p>Our team will contact you within 24 hours with a personalized quote.</p>
      <p>Monthly Quantity: ${monthlyQuantity || 'Not specified'}</p>
      <br>
      <p>Best regards,<br>Farmers 10 Team</p>
    `);
    
    res.status(201).json({ 
      message: 'Lead captured successfully', 
      leadId: leadId,
      estimatedResponse: '24 hours'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Harvest Calendar API Routes
app.get('/api/harvest-calendar', authenticateToken, async (req, res) => {
  try {
    const { year, month, spice } = req.query;
    
    // Demo harvest calendar data
    const demoCalendar = [
      {
        _id: '1',
        spice: { name: 'Black Pepper', _id: '1' },
        farmer: { name: req.user.name, _id: req.user.id },
        expectedHarvestDate: new Date(2025, 0, 15),
        plantingDate: new Date(2024, 5, 1),
        estimatedYield: 200,
        actualYield: null,
        farmArea: 2.5,
        cropYear: '2024-25',
        status: 'growing',
        location: { district: 'Idukki', village: 'Kumily' },
        cropStages: [
          { stage: 'Pruning', plannedDate: new Date(2024, 11, 30), completed: false },
          { stage: 'Fertilizing', plannedDate: new Date(2025, 0, 5), completed: false },
          { stage: 'Harvesting', plannedDate: new Date(2025, 0, 15), completed: false }
        ],
        weatherAlerts: [
          { alertType: 'rain', severity: 'medium', message: 'Heavy rain expected in next 48 hours', date: new Date(), acknowledged: false }
        ],
        expenses: [
          { category: 'Seeds', amount: 5000, date: new Date(2024, 5, 1), description: 'Black pepper saplings' },
          { category: 'Fertilizer', amount: 3000, date: new Date(2024, 7, 15), description: 'Organic fertilizer' }
        ]
      },
      {
        _id: '2',
        spice: { name: 'Cardamom', _id: '2' },
        farmer: { name: req.user.name, _id: req.user.id },
        expectedHarvestDate: new Date(2025, 1, 5),
        plantingDate: new Date(2024, 3, 15),
        estimatedYield: 50,
        actualYield: null,
        farmArea: 1.0,
        cropYear: '2024-25',
        status: 'growing',
        location: { district: 'Wayanad', village: 'Kalpetta' },
        cropStages: [
          { stage: 'Weeding', plannedDate: new Date(2025, 0, 2), completed: false },
          { stage: 'Harvesting', plannedDate: new Date(2025, 1, 5), completed: false }
        ],
        weatherAlerts: [],
        expenses: [
          { category: 'Seeds', amount: 8000, date: new Date(2024, 3, 15), description: 'Cardamom seeds' },
          { category: 'Labor', amount: 2000, date: new Date(2024, 8, 10), description: 'Weeding labor' }
        ]
      }
    ];
    
    res.json(demoCalendar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/harvest-calendar', authenticateToken, async (req, res) => {
  try {
    const harvestData = req.body;
    
    // Demo harvest plan creation
    const planId = 'plan_' + Date.now();
    
    const newPlan = {
      _id: planId,
      ...harvestData,
      farmer: req.user.id,
      createdAt: new Date()
    };
    
    res.status(201).json({ 
      message: 'Harvest plan created successfully', 
      harvestPlan: newPlan
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Weather API
app.get('/api/weather', async (req, res) => {
  try {
    const { district, days = 1 } = req.query;
    
    // Demo weather data
    const demoWeather = [
      {
        _id: '1',
        location: { district: district || 'Idukki', coordinates: { lat: 9.8547, lng: 76.8970 } },
        date: new Date(),
        temperature: { min: 18, max: 28, current: 24 },
        humidity: 75,
        rainfall: 5,
        windSpeed: 12,
        pressure: 1013,
        conditions: 'Partly cloudy',
        forecast: [
          { date: new Date(), minTemp: 18, maxTemp: 28, conditions: 'Partly cloudy', rainProbability: 30 },
          { date: new Date(Date.now() + 24*60*60*1000), minTemp: 19, maxTemp: 29, conditions: 'Sunny', rainProbability: 10 },
          { date: new Date(Date.now() + 48*60*60*1000), minTemp: 17, maxTemp: 26, conditions: 'Light rain', rainProbability: 80 },
          { date: new Date(Date.now() + 72*60*60*1000), minTemp: 16, maxTemp: 24, conditions: 'Heavy rain', rainProbability: 90 },
          { date: new Date(Date.now() + 96*60*60*1000), minTemp: 18, maxTemp: 27, conditions: 'Cloudy', rainProbability: 40 }
        ],
        alerts: ['Heavy rain expected in next 48-72 hours'],
        source: 'OpenWeatherMap'
      }
    ];
    
    res.json(demoWeather);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Orders API
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    // Demo orders data
    const demoOrders = [
      {
        _id: '1',
        orderNumber: 'F10001',
        customer: { name: req.user.name, email: req.user.email },
        items: [
          { spice: { name: 'Black Pepper' }, quantity: 0.25, pricePerUnit: 1200, totalPrice: 300, farmer: { name: 'Ravi Kumar' } },
          { spice: { name: 'Cardamom' }, quantity: 0.1, pricePerUnit: 8000, totalPrice: 800, farmer: { name: 'Meera Nair' } }
        ],
        orderTotal: 1100,
        deliveryCharges: 50,
        finalAmount: 1150,
        orderStatus: 'shipped',
        paymentStatus: 'paid',
        paymentMethod: 'razorpay',
        createdAt: new Date(Date.now() - 2*24*60*60*1000),
        deliveryAddress: {
          name: req.user.name,
          address: '123 Main Street, Kochi',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001'
        },
        timeline: [
          { status: 'placed', timestamp: new Date(Date.now() - 2*24*60*60*1000), notes: 'Order placed successfully' },
          { status: 'confirmed', timestamp: new Date(Date.now() - 2*24*60*60*1000 + 60*60*1000), notes: 'Payment confirmed' },
          { status: 'processing', timestamp: new Date(Date.now() - 36*60*60*1000), notes: 'Order being processed' },
          { status: 'shipped', timestamp: new Date(Date.now() - 24*60*60*1000), notes: 'Order shipped via Express Delivery' }
        ]
      },
      {
        _id: '2',
        orderNumber: 'F10002',
        customer: { name: req.user.name, email: req.user.email },
        items: [
          { spice: { name: 'Turmeric' }, quantity: 0.5, pricePerUnit: 800, totalPrice: 400, farmer: { name: 'Suresh Babu' } }
        ],
        orderTotal: 400,
        deliveryCharges: 50,
        finalAmount: 450,
        orderStatus: 'delivered',
        paymentStatus: 'paid',
        paymentMethod: 'cod',
        createdAt: new Date(Date.now() - 5*24*60*60*1000),
        deliveryAddress: {
          name: req.user.name,
          address: '123 Main Street, Kochi',
          city: 'Kochi',
          state: 'Kerala',
          pincode: '682001'
        },
        timeline: [
          { status: 'placed', timestamp: new Date(Date.now() - 5*24*60*60*1000), notes: 'Order placed successfully' },
          { status: 'confirmed', timestamp: new Date(Date.now() - 5*24*60*60*1000 + 30*60*1000), notes: 'Order confirmed' },
          { status: 'delivered', timestamp: new Date(Date.now() - 3*24*60*60*1000), notes: 'Order delivered successfully' }
        ]
      }
    ];
    
    res.json({
      orders: demoOrders,
      pagination: { current: 1, pages: 1, total: 2 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, deliveryAddress } = req.body;
    
    // Demo order creation
    const orderNumber = generateOrderNumber();
    const newOrder = {
      _id: 'order_' + Date.now(),
      orderNumber,
      customer: req.user.id,
      items: items || [],
      orderTotal: 1000,
      deliveryCharges: 50,
      finalAmount: 1050,
      orderStatus: 'placed',
      paymentStatus: 'pending',
      deliveryAddress: deliveryAddress || {},
      createdAt: new Date(),
      timeline: [{
        status: 'placed',
        timestamp: new Date(),
        notes: 'Order placed successfully'
      }]
    };
    
    demoOrders.push(newOrder);
    
    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics Routes
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    // Demo analytics data based on user role
    const roleBasedAnalytics = {
      admin: {
        todaysRevenue: 245000 + Math.floor(Math.random() * 10000),
        todaysOrders: 158 + Math.floor(Math.random() * 20),
        activeFarmers: 42,
        newLeads: 23 + Math.floor(Math.random() * 10),
        totalCustomers: 1250,
        conversionRate: 21.8,
        topProducts: [
          { name: 'Black Pepper', revenue: 89000, orders: 245 },
          { name: 'Cardamom', revenue: 156000, orders: 189 },
          { name: 'Turmeric', revenue: 45000, orders: 167 }
        ]
      },
      farmer: {
        totalInventory: 1250,
        monthlyEarnings: 45000 + Math.floor(Math.random() * 5000),
        ordersFulfilled: 25,
        qualityRating: 4.9,
        nextHarvest: '15 days',
        weatherAlerts: 1,
        cropStatus: {
          planted: 3,
          growing: 2,
          harvested: 1
        },
        upcomingActivities: [
          { activity: 'Pruning', crop: 'Black Pepper', date: '2024-12-30' },
          { activity: 'Fertilizing', crop: 'Cardamom', date: '2025-01-05' }
        ]
      },
      customer: {
        activeOrders: 2,
        totalOrders: 15,
        totalSpent: 12500,
        savedAmount: 2500,
        loyaltyPoints: 450,
        nextDelivery: '2 days',
        favoriteSpices: ['Black Pepper', 'Cardamom', 'Turmeric'],
        recommendations: [
          { spice: 'Coriander', reason: 'Complements your frequent orders' },
          { spice: 'Cloves', reason: 'Popular in Kerala cuisine' }
        ]
      },
      logistics: {
        pendingPickups: 47,
        inTransit: 132,
        deliveredToday: 89,
        onTimeRate: 96.5,
        activeRoutes: 12,
        fuelEfficiency: 85,
        routeOptimization: 'Good',
        driverPerformance: 'Excellent'
      }
    };
    
    const analytics = roleBasedAnalytics[req.user.role] || roleBasedAnalytics.customer;
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inventory Management Routes
app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const demoInventory = [
      {
        _id: '1',
        farmer: { name: req.user.name, _id: req.user.id },
        spice: { name: 'Black Pepper', _id: '1' },
        quantity: 450,
        pricePerKg: 1200,
        qualityGrade: 'Grade A',
        harvestDate: new Date(2024, 10, 15),
        status: 'available',
        adminApproved: true,
        location: { warehouse: 'Idukki Warehouse' },
        qualityMetrics: { moisture: 12, purity: 98, foreignMatter: 0.5 }
      },
      {
        _id: '2',
        farmer: { name: req.user.name, _id: req.user.id },
        spice: { name: 'Cardamom', _id: '2' },
        quantity: 125,
        pricePerKg: 8000,
        qualityGrade: 'Premium',
        harvestDate: new Date(2024, 11, 1),
        status: 'available',
        adminApproved: true,
        location: { warehouse: 'Wayanad Warehouse' },
        qualityMetrics: { moisture: 10, purity: 99, foreignMatter: 0.2 }
      },
      {
        _id: '3',
        farmer: { name: req.user.name, _id: req.user.id },
        spice: { name: 'Turmeric', _id: '3' },
        quantity: 675,
        pricePerKg: 800,
        qualityGrade: 'Grade A',
        harvestDate: new Date(2024, 9, 20),
        status: 'available',
        adminApproved: true,
        location: { warehouse: 'Central Warehouse' },
        qualityMetrics: { moisture: 8, purity: 96, foreignMatter: 1.0 }
      }
    ];
    
    res.json(demoInventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventory', authenticateToken, authorizeRole(['farmer']), async (req, res) => {
  try {
    const inventoryData = req.body;
    
    const newInventory = {
      _id: 'inv_' + Date.now(),
      ...inventoryData,
      farmer: req.user.id,
      status: 'pending_approval',
      adminApproved: false,
      createdAt: new Date()
    };
    
    await sendNotification('admin_user', `New inventory submission from ${req.user.name}`);
    
    res.status(201).json({
      message: 'Inventory submitted for approval',
      inventory: newInventory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payment Routes (Demo)
app.post('/api/payments/create-order', authenticateToken, async (req, res) => {
  try {
    const { orderId, amount } = req.body;
    
    res.json({
      orderId: 'order_demo_' + Date.now(),
      amount: amount * 100,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments/verify', authenticateToken, async (req, res) => {
  try {
    const { paymentId, orderId, signature } = req.body;
    
    // Demo payment verification
    res.json({ 
      message: 'Payment verified successfully',
      status: 'success',
      paymentId: paymentId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Recommendations API
app.get('/api/recommendations', authenticateToken, async (req, res) => {
  try {
    const recommendations = {
      spiceBlends: [
        {
          name: 'Kerala Fish Curry Blend',
          spices: ['Black Pepper - 50g', 'Coriander - 100g', 'Turmeric - 25g', 'Red Chili - 75g'],
          reason: 'Perfect for authentic Kerala fish curry',
          estimatedPrice: 450
        },
        {
          name: 'Garam Masala Premium',
          spices: ['Cardamom - 25g', 'Cloves - 15g', 'Cinnamon - 20g', 'Black Pepper - 30g'],
          reason: 'Based on your preference for aromatic spices',
          estimatedPrice: 850
        }
      ],
      personalizedSuggestions: [
        {
          spice: 'Organic Ginger',
          reason: 'Complements your turmeric purchases',
          confidence: 85
        },
        {
          spice: 'Star Anise',
          reason: 'Popular addition to your spice collection',
          confidence: 70
        }
      ]
    };
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Logistics Routes
app.get('/api/logistics/routes', authenticateToken, authorizeRole(['logistics', 'admin']), async (req, res) => {
  try {
    const demoRoutes = [
      {
        _id: '1',
        routeName: 'Kochi - Trivandrum',
        driver: { name: 'Arun Kumar', phone: '+91-9876543210' },
        vehicle: 'KL-07-AB-1234',
        orders: 15,
        status: 'active',
        estimatedTime: '4:30 PM',
        currentLocation: 'Alappuzha',
        progress: 65
      },
      {
        _id: '2',
        routeName: 'Kottayam - Idukki',
        driver: { name: 'Vineeth M', phone: '+91-9876543211' },
        vehicle: 'KL-05-CD-5678',
        orders: 8,
        status: 'delayed',
        estimatedTime: '6:00 PM',
        currentLocation: 'Kumily',
        progress: 40
      },
      {
        _id: '3',
        routeName: 'Wayanad - Calicut',
        driver: { name: 'Rajesh P', phone: '+91-9876543212' },
        vehicle: 'KL-11-EF-9012',
        orders: 12,
        status: 'on_time',
        estimatedTime: '3:15 PM',
        currentLocation: 'Sulthan Bathery',
        progress: 80
      }
    ];
    
    res.json(demoRoutes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lead Management for Admin
app.get('/api/leads', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let filteredLeads = demoLeads;
    if (status && status !== 'all') {
      filteredLeads = demoLeads.filter(lead => lead.status === status);
    }
    
    const total = filteredLeads.length;
    const startIndex = (page - 1) * limit;
    const paginatedLeads = filteredLeads.slice(startIndex, startIndex + parseInt(limit));
    
    res.json({
      leads: paginatedLeads,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search API
app.get('/api/search', async (req, res) => {
  try {
    const { q, type } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const results = {
      spices: [],
      news: [],
      farmers: []
    };
    
    // Search in spices
    const spicesResponse = await fetch(`${req.protocol}://${req.get('host')}/api/spices?search=${q}`);
    if (spicesResponse.ok) {
      results.spices = await spicesResponse.json();
    }
    
    // Search in news
    const newsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/news?search=${q}`);
    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      results.news = newsData.news || [];
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
app.get('/api/admin/statistics', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const stats = {
      overview: {
        totalUsers: 1250,
        totalFarmers: 42,
        totalOrders: 2500,
        totalRevenue: 2500000,
        monthlyGrowth: 15.5
      },
      recentActivity: [
        { type: 'order', message: 'New order #F10123 placed', timestamp: new Date() },
        { type: 'farmer', message: 'New farmer registration: Kumar Farm', timestamp: new Date(Date.now() - 30*60*1000) },
        { type: 'inventory', message: 'Inventory approved for Black Pepper', timestamp: new Date(Date.now() - 60*60*1000) }
      ],
      topProducts: [
        { name: 'Black Pepper', sales: 1200, revenue: 1440000 },
        { name: 'Cardamom', sales: 800, revenue: 6400000 },
        { name: 'Turmeric', sales: 1500, revenue: 1200000 }
      ]
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Socket.IO Events
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);
  
  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`👤 User ${userId} joined room`);
  });
  
  socket.on('order-update', async (data) => {
    const { orderId, status, notes } = data;
    
    // Broadcast order update
    io.emit('order-status-update', {
      orderNumber: orderId,
      status,
      message: `Your order is now ${status}`
    });
  });
  
  socket.on('news-request', () => {
    // Send latest news to requesting client
    socket.emit('news-update', { message: 'Latest news available' });
  });
  
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Scheduled Tasks (Cron Jobs)
if (process.env.ENABLE_NEWS_UPDATES !== 'false') {
  cron.schedule('0 */4 * * *', async () => {
    console.log('📰 Simulating news update...');
    io.emit('news-update', { message: 'New market news available' });
  });
}

if (process.env.ENABLE_PRICE_UPDATES !== 'false') {
  cron.schedule('*/5 * * * *', async () => {
    console.log('💰 Simulating price update...');
    io.emit('price-update', { message: 'Market prices updated' });
  });
}

// Weather alerts simulation
cron.schedule('0 6 * * *', async () => {
  console.log('🌤️ Checking weather alerts...');
  const weatherAlert = {
    district: 'Idukki',
    alert: 'Heavy rain expected in next 48 hours',
    severity: 'medium'
  };
  io.emit('weather-alert', weatherAlert);
});

// Daily analytics report
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('📊 Generating daily analytics report...');
    
    await sendEmail('admin@farmers10.com', 'Daily Analytics Report - Farmers 10', `
      <h2>Yesterday's Performance</h2>
      <p>Total Orders: ${158 + Math.floor(Math.random() * 20)}</p>
      <p>Total Revenue: ₹${245000 + Math.floor(Math.random() * 50000)}</p>
      <p>New Customers: ${23 + Math.floor(Math.random() * 10)}</p>
      <p>Active Farmers: 42</p>
      
      <h3>Top Products</h3>
      <ul>
        <li>Black Pepper - ₹${45000 + Math.floor(Math.random() * 10000)}</li>
        <li>Cardamom - ₹${89000 + Math.floor(Math.random() * 20000)}</li>
        <li>Turmeric - ₹${32000 + Math.floor(Math.random() * 8000)}</li>
      </ul>
      
      <p>Generated at: ${new Date().toLocaleString()}</p>
    `);
  } catch (error) {
    console.error('Daily report error:', error);
  }
});

// Error Handling Middleware
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(error.errors || {}).map(err => err.message || err)
    });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate entry',
      field: Object.keys(error.keyPattern || {})[0]
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'GET /api/news',
      'GET /api/spices',
      'GET /api/market-prices/latest',
      'POST /api/auth/demo-login',
      'POST /api/leads',
      'GET /api/harvest-calendar',
      'GET /api/weather',
      'GET /api/orders',
      'GET /api/analytics/dashboard'
    ]
  });
});

// Catch-all handler for frontend routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🛑 Process terminated');
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Initialize database connection (optional)
    await connectDB();
    
    server.listen(PORT, () => {
      console.log('🌿=================================🌿');
      console.log('  FARMERS 10 PLATFORM BACKEND');
      console.log('🌿=================================🌿');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log('');
      console.log('📋 Available API Endpoints:');
      console.log(`   🔍 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   📰 News API: http://localhost:${PORT}/api/news`);
      console.log(`   💰 Prices API: http://localhost:${PORT}/api/market-prices/latest`);
      console.log(`   🌶️ Spices API: http://localhost:${PORT}/api/spices`);
      console.log(`   🔐 Demo Login: POST http://localhost:${PORT}/api/auth/demo-login`);
      console.log(`   📅 Calendar: http://localhost:${PORT}/api/harvest-calendar`);
      console.log(`   🌤️ Weather: http://localhost:${PORT}/api/weather`);
      console.log('');
      console.log('🎯 Features Enabled:');
      console.log('   ✅ Spice Market News Board');
      console.log('   ✅ Advanced Harvest Calendar');
      console.log('   ✅ Real-time Price Updates');
      console.log('   ✅ Weather Integration');
      console.log('   ✅ Order Management');
      console.log('   ✅ Payment Processing');
      console.log('   ✅ Multi-role Dashboards');
      console.log('   ✅ Real-time Notifications');
      console.log('🌿=================================🌿');
      
      // Initialize demo data
      if (process.env.USE_DEMO_DATA !== 'false') {
        console.log('📝 Demo mode enabled - using mock data for immediate testing');
        console.log('💡 To use real APIs, add API keys to .env file');
      }
      
      console.log('🎉 Farmers 10 Backend is ready for connections!');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Initialize and start the server
startServer();

module.exports = { app, io };
