#!/bin/bash

# Farmers 10 - Quick Deployment Script
# This script sets up the complete platform for immediate testing

echo "🌿 Starting Farmers 10 Platform Deployment..."
echo "=================================================="

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Create project directory
PROJECT_NAME="farmers10-platform"
echo "📁 Creating project directory: $PROJECT_NAME"

if [ -d "$PROJECT_NAME" ]; then
    echo "⚠️  Directory $PROJECT_NAME already exists. Removing it..."
    rm -rf "$PROJECT_NAME"
fi

mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Create directory structure
echo "📂 Creating directory structure..."
mkdir -p {backend,frontend,k8s,terraform,scripts,docs}

# Create package.json for backend
echo "📦 Creating backend package.json..."
cat > backend/package.json << 'EOF'
{
  "name": "farmers10-backend",
  "version": "1.0.0",
  "description": "Farmers 10 - Premium Organic Spice Trading Platform Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint ."
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.6.3",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.7.4",
    "razorpay": "^2.9.2",
    "nodemailer": "^6.9.7",
    "twilio": "^4.19.0",
    "node-cron": "^3.0.3",
    "dotenv": "^16.3.1",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create simplified backend server
echo "🚀 Creating backend server..."
cat > backend/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Mock API routes for demo
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Farmers 10 Backend Running' });
});

app.get('/api/news', (req, res) => {
    const demoNews = [
        {
            _id: '1',
            title: 'Black Pepper Prices Surge 15% Following Export Demand',
            summary: 'Kerala black pepper prices have increased significantly due to strong international demand.',
            category: 'market_prices',
            publishedAt: new Date().toISOString(),
            source: 'Spice Trade Journal',
            impact: 'high',
            sentiment: 'positive'
        },
        {
            _id: '2',
            title: 'Monsoon Forecast Positive for Cardamom Cultivation',
            summary: 'Weather department predicts favorable conditions for cardamom growing regions.',
            category: 'weather',
            publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            source: 'Agricultural Weather Service',
            impact: 'medium',
            sentiment: 'positive'
        }
    ];
    res.json({ news: demoNews });
});

app.get('/api/market-prices/latest', (req, res) => {
    const demoPrices = [
        { spiceInfo: [{ name: 'Black Pepper' }], latestPrice: 1200, priceChange: 2.5, _id: { market: 'Kochi' } },
        { spiceInfo: [{ name: 'Cardamom' }], latestPrice: 8000, priceChange: -1.2, _id: { market: 'Idukki' } },
        { spiceInfo: [{ name: 'Turmeric' }], latestPrice: 800, priceChange: 0.8, _id: { market: 'Mumbai' } }
    ];
    res.json(demoPrices);
});

app.get('/api/spices', (req, res) => {
    const demoSpices = [
        {
            _id: '1',
            name: 'Idukki Black Pepper',
            category: 'pepper',
            basePrice: 1200,
            origin: 'Idukki, Kerala',
            images: ['🌶️'],
            qualityGrade: 'Premium',
            inStock: true
        },
        {
            _id: '2',
            name: 'Wayanad Cardamom',
            category: 'cardamom',
            basePrice: 8000,
            origin: 'Wayanad, Kerala',
            images: ['🌿'],
            qualityGrade: 'Premium',
            inStock: true
        }
    ];
    res.json(demoSpices);
});

// Catch all handler for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`🌿 Farmers 10 Backend running on http://localhost:${PORT}`);
    console.log(`📱 Frontend available at http://localhost:${PORT}`);
    console.log(`🔗 API endpoints at http://localhost:${PORT}/api/*`);
});
EOF

# Create Dockerfile for backend
echo "🐳 Creating backend Dockerfile..."
cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
EOF

# Create environment file
echo "⚙️ Creating environment configuration..."
cat > .env << 'EOF'
# Farmers 10 Environment Variables
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5000

# Demo mode - no external APIs required
DEMO_MODE=true
MOCK_PAYMENTS=true
MOCK_SMS=true
MOCK_EMAIL=true

# Optional: Add real API keys for full functionality
# NEWS_API_KEY=your_newsapi_key
# WEATHER_API_KEY=your_openweather_key
# RAZORPAY_KEY_ID=your_razorpay_key
EOF

# Create Docker Compose for quick setup
echo "🐳 Creating Docker Compose configuration..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  farmers10:
    build: ./backend
    container_name: farmers10-app
    ports:
      - "5000:5000"
    volumes:
      - ./frontend:/app/frontend:ro
      - ./backend:/app:rw
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=5000
      - DEMO_MODE=true
    restart: unless-stopped
    command: npm start

  # Optional: Add MongoDB for full functionality
  # mongodb:
  #   image: mongo:6
  #   container_name: farmers10-db
  #   ports:
  #     - "27017:27017"
  #   volumes:
  #     - mongo_data:/data/db
  #   environment:
  #     - MONGO_INITDB_ROOT_USERNAME=admin
  #     - MONGO_INITDB_ROOT_PASSWORD=password123

# volumes:
#   mongo_data:
EOF

# Copy frontend files (placeholder - user will paste the actual content)
echo "🎨 Setting up frontend..."
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Farmers 10 - Premium Organic Spices</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f5f5dc 0%, #f0f8e8 100%);
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            text-align: center;
        }
        .header {
            background: linear-gradient(135deg, #2d5016 0%, #4a7c59 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
        }
        .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .card {
            background: white;
            padding: 2rem;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            margin: 1rem 0;
        }
        .success {
            color: #28a745;
            font-size: 1.2rem;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌿 Farmers 10</div>
            <h1>Platform Successfully Deployed!</h1>
            <p>Premium Organic Spice Trading Platform</p>
        </div>
        
        <div class="card">
            <h2 class="success">✅ Deployment Successful!</h2>
            <p>Your Farmers 10 platform is now running and ready for testing.</p>
            
            <h3>🚀 Next Steps:</h3>
            <ol style="text-align: left; max-width: 600px; margin: 0 auto;">
                <li><strong>Replace this file</strong> with the complete frontend from the artifacts</li>
                <li><strong>Replace backend/server.js</strong> with the full backend code</li>
                <li><strong>Add API keys</strong> to .env file for full functionality</li>
                <li><strong>Test all features</strong> and customize as needed</li>
            </ol>
            
            <h3>📋 Current Status:</h3>
            <ul style="text-align: left; max-width: 600px; margin: 0 auto;">
                <li>✅ Backend server running on port 5000</li>
                <li>✅ Frontend served from same port</li>
                <li>✅ Basic API endpoints working</li>
                <li>✅ Docker containerized</li>
                <li>⚠️ Demo mode - replace with full code</li>
            </ul>
        </div>
        
        <div class="card">
            <h3>🔗 Quick Links</h3>
            <p><a href="/api/health">API Health Check</a></p>
            <p><a href="/api/news">Sample News API</a></p>
            <p><a href="/api/spices">Sample Spices API</a></p>
        </div>
    </div>
</body>
</html>
EOF

# Create deployment instructions
echo "📖 Creating deployment instructions..."
cat > README-DEPLOY.md << 'EOF'
# 🌿 Farmers 10 - Quick Deployment Guide

## ✅ Deployment Complete!

Your Farmers 10 platform is now deployed and running.

### 🔗 Access Your Platform

- **Frontend & Backend**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health
- **Sample APIs**: 
  - http://localhost:5000/api/news
  - http://localhost:5000/api/spices

### 🚀 Next Steps

1. **Replace Frontend**: Copy the complete frontend code from the artifacts into `frontend/index.html`
2. **Replace Backend**: Copy the complete backend code from the artifacts into `backend/server.js`
3. **Add Dependencies**: Run `cd backend && npm install` to install all packages
4. **Configure Environment**: Add real API keys to `.env` file
5. **Restart**: Run `docker-compose restart` to apply changes

### 📁 File Structure
```
farmers10-platform/
├── backend/
│   ├── server.js          # Replace with full backend code
│   ├── package.json       # Dependencies included
│   └── Dockerfile         # Docker configuration
├── frontend/
│   └── index.html         # Replace with full frontend code
├── docker-compose.yml     # Container orchestration
├── .env                   # Environment variables
└── README-DEPLOY.md       # This file
```

### 🛠️ Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop platform
docker-compose down

# Rebuild and start
docker-compose up --build -d
```

### 🎯 Testing Checklist

- [ ] Frontend loads properly
- [ ] API endpoints respond
- [ ] News board displays
- [ ] Market prices show
- [ ] Navigation works
- [ ] Responsive design
- [ ] All modals open/close

### 🔧 Troubleshooting

**If container won't start:**
```bash
docker-compose logs farmers10
```

**If port 5000 is busy:**
```bash
# Kill process using port 5000
sudo lsof -ti:5000 | xargs kill -9
# Or change port in docker-compose.yml
```

**For full database features:**
Uncomment MongoDB service in docker-compose.yml

### 🎉 Success!

Your platform is ready for testing and development!
EOF

# Make script executable and run deployment
echo "🏗️ Building and starting the platform..."

# Install backend dependencies
cd backend
npm install --no-audit
cd ..

# Start the platform
docker-compose up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo ""
    echo "🎉 SUCCESS! Farmers 10 Platform Deployed Successfully!"
    echo "=================================================="
    echo ""
    echo "🔗 Access your platform:"
    echo "   Frontend: http://localhost:5000"
    echo "   API Health: http://localhost:5000/api/health"
    echo ""
    echo "📁 Project location: $(pwd)"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Replace frontend/index.html with complete frontend code"
    echo "   2. Replace backend/server.js with complete backend code"
    echo "   3. Run: docker-compose restart"
    echo ""
    echo "📖 Read README-DEPLOY.md for detailed instructions"
    echo ""
    echo "🎯 Platform is ready for testing!"
else
    echo "❌ Deployment failed. Check logs with: docker-compose logs"
    exit 1
fi
EOF
