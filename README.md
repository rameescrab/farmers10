# 🌿 Farmers 10 - Premium Organic Spice Trading Platform

A comprehensive e-commerce platform connecting Kerala's highland farmers directly with customers, specializing in premium organic spices.

![Farmers 10 Platform](https://img.shields.io/badge/Platform-Production_Ready-green) ![Node.js](https://img.shields.io/badge/Backend-Node.js-brightgreen) ![Frontend](https://img.shields.io/badge/Frontend-HTML5_CSS3_JS-blue) ![Database](https://img.shields.io/badge/Database-MongoDB-green)

## 🚀 **Features**

### **Core Business Features**
- 🛒 **Multi-role E-commerce** (Customer, Farmer, Admin, Logistics)
- 📦 **Order Management** with real-time tracking
- 🌾 **Inventory Management** with farmer approval workflow
- 💳 **Payment Integration** (Razorpay, COD, UPI)
- 📱 **WhatsApp Notifications** for order updates
- 🤖 **AI Recommendations** based on cooking style
- 📊 **Analytics Dashboard** with live metrics
- 🚚 **Logistics Management** with route optimization

### **Technical Features**
- 🔒 **Secure Authentication** with JWT
- ⚡ **Real-time Updates** with Socket.IO
- 📱 **Progressive Web App** (PWA)
- 🎯 **Auto-scaling** with Kubernetes
- 📈 **Monitoring** with Prometheus/Grafana
- 🔄 **CI/CD Pipeline** with GitHub Actions
- 🛡️ **Security** hardened for production

## 📁 **Project Structure**

```
farmers10/
├── backend/                 # Node.js API server
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Authentication, validation
│   ├── utils/              # Helper functions
│   └── server.js           # Main server file
├── frontend/               # HTML/CSS/JS frontend
│   ├── index.html          # Main application
│   ├── assets/             # Images, icons
│   └── sw.js               # Service worker (PWA)
├── k8s/                    # Kubernetes manifests
├── terraform/              # Infrastructure as code
├── docker-compose.yml      # Development setup
├── package.json            # Dependencies
└── README.md               # This file
```

## 🛠️ **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- MongoDB 6+
- Redis 7+
- Docker & Docker Compose (optional)

### **Option 1: Docker Setup (Recommended)**

```bash
# Clone the repository
git clone https://github.com/farmers10/platform
cd farmers10

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

**Access Points:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017
- Redis: localhost:6379
- Grafana: http://localhost:3001 (admin/admin123)
- Prometheus: http://localhost:9090

### **Option 2: Manual Setup**

```bash
# 1. Clone repository
git clone https://github.com/farmers10/platform
cd farmers10

# 2. Setup environment
cp .env.example .env
# Edit .env with your configurations

# 3. Install dependencies
npm install

# 4. Start MongoDB and Redis
# (Install and start locally or use cloud services)

# 5. Start backend
npm run dev

# 6. Start frontend
# Serve the frontend/index.html file using any web server
npx http-server frontend -p 3000
```

## 📋 **Environment Configuration**

Copy `.env.example` to `.env` and configure:

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/farmers10
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email Service
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS Service (Twilio)
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
```

## 🎯 **Usage Guide**

### **1. Access the Platform**
Visit http://localhost:3000 and select your role:

### **2. Customer Portal**
- Browse premium spices from Kerala farmers
- Add items to cart with custom quantities
- Secure checkout with multiple payment options
- Track orders in real-time
- Get AI-powered spice recommendations

### **3. Farmer Portal**
- Add inventory with harvest details
- Set pricing and quality grades
- Track earnings and sales analytics
- Receive order notifications
- Manage delivery schedules

### **4. Admin Dashboard**
- Monitor sales and revenue metrics
- Manage lead conversion funnel
- Approve farmer inventory submissions
- View order heat maps and analytics
- Export business reports

### **5. Logistics Management**
- Optimize delivery routes
- Track vehicle locations
- Monitor warehouse capacity
- Manage driver assignments
- Generate delivery reports

## 🏗️ **Production Deployment**

### **Kubernetes Deployment**

```bash
# 1. Setup infrastructure with Terraform
cd terraform
terraform init
terraform plan
terraform apply

# 2. Deploy to Kubernetes
kubectl create namespace farmers10
kubectl apply -f k8s/

# 3. Setup monitoring
helm install prometheus prometheus-community/kube-prometheus-stack
helm install grafana grafana/grafana
```

### **Environment Variables for Production**

```bash
NODE_ENV=production
MONGODB_URI=mongodb://username:password@production-db:27017/farmers10
JWT_SECRET=production-super-secret-key
RAZORPAY_KEY_ID=rzp_live_your_key_id
# ... other production values
```

## 📊 **API Documentation**

### **Authentication**
```bash
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### **Products**
```bash
GET    /api/spices              # List all spices
POST   /api/spices              # Add new spice (admin)
GET    /api/spices/:id          # Get spice details
PUT    /api/spices/:id          # Update spice (admin)
```

### **Orders**
```bash
GET    /api/orders              # List user orders
POST   /api/orders              # Create new order
GET    /api/orders/:id          # Order details
PUT    /api/orders/:id/status   # Update order status
```

### **Inventory**
```bash
GET    /api/inventory           # List inventory
POST   /api/inventory           # Add inventory (farmer)
PUT    /api/inventory/:id       # Update inventory
```

### **Payments**
```bash
POST   /api/payments/create-order    # Create Razorpay order
POST   /api/payments/verify         # Verify payment
```

## 🔧 **Development**

### **Running Tests**
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage report
```

### **Code Quality**
```bash
npm run lint               # ESLint
npm run format             # Prettier
npm run audit              # Security audit
```

### **Database Operations**
```bash
npm run db:seed            # Seed sample data
npm run db:migrate         # Run migrations
npm run db:backup          # Create backup
```

## 📈 **Monitoring & Analytics**

### **Application Metrics**
- Request/response times
- Error rates and types
- Database performance
- Cache hit rates
- User activity patterns

### **Business Metrics**
- Order conversion rates
- Average order values
- Farmer participation
- Customer satisfaction
- Revenue tracking

### **Alerts Configuration**
- High error rates (>5%)
- Slow response times (>2s)
- Database connection issues
- High memory usage (>80%)
- Failed payment attempts

## 🔒 **Security Features**

### **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Session management
- API rate limiting

### **Data Security**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure headers (Helmet.js)

### **Infrastructure Security**
- Network policies
- Pod security policies
- Secret management
- SSL/TLS encryption
- Regular security audits

## 🚀 **Performance Optimization**

### **Backend Optimizations**
- Database indexing
- Connection pooling
- Query optimization
- Caching strategies
- Compression middleware

### **Frontend Optimizations**
- Asset minification
- Image optimization
- Lazy loading
- Service worker caching
- CDN integration

### **Infrastructure Optimizations**
- Auto-scaling
- Load balancing
- Database replication
- Redis caching
- CDN for static assets

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Submit pull request

### **Development Guidelines**
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commits
- Ensure security best practices

## 📞 **Support**

### **Getting Help**
- 📧 Email: support@farmers10.com
- 💬 Discord: [Join our community]
- 📖 Documentation: [Full docs]
- 🐛 Issues: [GitHub Issues]

### **Business Inquiries**
- 📧 Email: business@farmers10.com
- 📱 Phone: +91-XXXX-XXXX
- 🌐 Website: https://farmers10.com

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- Kerala Spice Farmers for their trust and partnership
- Open source community for amazing tools
- Beta users for valuable feedback
- Development team for dedication

---

**Built with ❤️ for Kerala's farming community**

*Connecting highland farmers directly with customers for premium organic spices*
