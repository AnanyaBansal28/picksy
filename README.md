# 💎 Picksy — Pick Smartly, Shop Wisely.

> **An intelligent Shopping Decision Engine that helps users decide what to buy, where to buy it, when to buy it, and whether a deal is genuinely worth their money.**

---

## 🎨 Aesthetic & Design System

Picksy is built with an **ultra-clean, modern luxury SaaS aesthetic** inspired by Stripe, Linear, and Apple:
- **Primary Background:** Crisp Alabaster / Soft Off-White (`#FAFAFC`) with pure white elevated surface cards (`#FFFFFF`).
- **Primary Typography:** Deep Slate Charcoal (`#0F172A`) with cool gray (`#64748B`) secondary labels (Plus Jakarta Sans & Inter).
- **Primary Accent:** Deep Royal Indigo (`#4F46E5`).
- **Semantic Badges:**
  - 🟢 **Soft Emerald** (`#10B981` on `#ECFDF5` tint): `VERDICT: BUY NOW` & Real Deal Scores ≥ 80.
  - 🟡 **Warm Amber** (`#F59E0B` on `#FFFBEB` tint): `VERDICT: WAIT` & Pre-Sale price spikes.
  - 🔴 **Soft Coral** (`#EF4444` on `#FEF2F2` tint): `Overpriced / Fake Discount` alerts.
- **Micro-Styling:** Subtle `1px solid #E2E8F0` borders, `16px` rounded corners (`rounded-2xl`), interactive charts, and smooth transitions.

---

## 🧠 Core Features & Decision Engine

### 1. E-Commerce Shopping Decision Engine (Amazon, Flipkart, Myntra, Tata CliQ)
- **Best Buying Decision (Not Just Cheapest):** Evaluates beyond base price by factoring in delivery charges, return policy quality (e.g. 14-day refund vs service center inspection), and seller reliability score (4.8★ authorized) to highlight **"Picksy's Top Recommendation"** with transparent bullet-point reasoning.
- **Signature Feature — "Buy Now vs. Wait" Verdict:** Prominent decision banner backed by 30-day and 90-day price trend analysis, calculating exact percentage delta against historical averages and floor prices.
- **Interactive 30-Day/90-Day Price History Chart:** Smooth Area/Line Chart powered by Recharts with dynamic average reference lines and verified price milestones.
- **Coupon Reality Check & Real Deal Score (0–100):** Unmasks artificially inflated catalog MRPs (e.g. fake "60% off" claims) and restrictive coupon requirements (minimum spend or specific credit cards).
- **Review Intelligence:** Synthesizes verified purchases into verified buyer consensus, categorized **Pros**, **Cons**, and a **Review Authenticity Check** that flags suspicious wording bursts.

### 2. Quick-Commerce Mode (Blinkit, Zepto, Swiggy Instamart)
- **Mode A — Individual Item Comparison:** Search groceries and compare item price, delivery fees, and ETAs (9–14 mins) across quick-commerce apps.
- **Mode B — Smart Cart Optimizer:** Unified Picksy Cart automatically computes:
  1. Single-platform checkout totals factoring in item subtotals, packaging/handling fees, and free-delivery thresholds.
  2. Multi-platform Split-Cart optimization for maximum per-item discounts.
  Highlights **Cheapest Cart** and **Fastest Delivery** with an honest warning if splitting triggers redundant delivery fees.

### 3. User Accounts, Wishlist & Target Price Alerts
- JWT-based authentication with bcrypt password hashing.
- One-click **Demo User Sign-In** (`aarav@picksy.io` / `picksy123`).
- Personal Wishlist and Target Price Drop Alerts stored in MongoDB.

---

## ⚙️ Full-Stack Technical Architecture

```
picksy/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection with In-Memory fallback
│   │   └── inMemoryStore.js      # Zero-dependency in-memory store for instant evaluation
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile
│   │   ├── productController.js  # Product catalog, dynamic decision engine
│   │   ├── cartController.js     # Quick-commerce single vs split cart optimizer
│   │   ├── wishlistController.js # Wishlist management
│   │   └── alertController.js    # Target price drop alerts
│   ├── middleware/
│   │   ├── auth.js               # JWT verification
│   │   └── errorHandler.js       # Structured API error handling
│   ├── models/
│   │   ├── User.js               # User schema with hashed passwords
│   │   ├── Product.js            # Product schema with price history & platform listings
│   │   └── PriceAlert.js         # Price alert schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── wishlistRoutes.js
│   │   └── alertRoutes.js
│   ├── seed/
│   │   ├── seedData.js           # Realistic Indian e-commerce & quick-commerce products
│   │   └── seed.js               # Database seed runner
│   ├── utils/
│   │   └── decisionEngine.js     # Real Deal Score, Verdict & Recommendation algorithms
│   ├── server.js                 # Express server & static asset serving
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── DecisionBadge.jsx       # Semantic Soft Emerald / Amber / Coral badges
│   │   │   ├── PriceHistoryChart.jsx   # Interactive Recharts price trend chart
│   │   │   ├── DealScoreGauge.jsx      # 0-100 Real Deal Score radial dial
│   │   │   ├── PlatformMatrix.jsx      # Multi-platform comparison matrix table
│   │   │   ├── CouponInspector.jsx     # Anti-trap coupon reality check
│   │   │   ├── ReviewIntelligence.jsx  # Pros, cons, authenticity score
│   │   │   └── PriceAlertModal.jsx     # Price drop alert modal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx         # User auth & wishlist state
│   │   │   └── CartContext.jsx         # Unified cart & auto-optimizer trigger
│   │   ├── pages/
│   │   │   ├── HomePage.jsx            # Hero, interactive preview, spotlight deals
│   │   │   ├── ExplorerPage.jsx        # E-Commerce catalog with filters
│   │   │   ├── ProductDetailPage.jsx   # Complete Decision Dashboard
│   │   │   ├── QuickCommercePage.jsx   # Groceries & Smart Cart Optimizer split-screen
│   │   │   ├── WishlistPage.jsx        # Wishlist & active price alerts
│   │   │   ├── LoginPage.jsx           # Minimalist SaaS login + demo button
│   │   │   └── RegisterPage.jsx
│   │   ├── services/
│   │   │   └── api.js                  # Axios client with JWT interceptor
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json                        # Root workspace scripts
└── README.md
```

---

## 🚀 Quickstart & Setup Instructions

### Prerequisites
- **Node.js**: v18 or higher (tested on Node v24).
- **MongoDB** *(Optional)*: If local MongoDB is running at `mongodb://127.0.0.1:27017/picksy`, Picksy automatically connects and uses native collections. If local MongoDB is offline, Picksy automatically operates in **Self-Contained In-Memory Mode** with pre-seeded data so the application runs immediately without any database configuration!

---

### Step 1: Install Dependencies

```bash
# In backend
cd backend
npm install

# In frontend
cd ../frontend
npm install
```

---

### Step 2: Seed the Database (Optional)

If running with a local or remote MongoDB instance:

```bash
cd backend
npm run seed
```

---

### Step 3: Run the Application

#### Option A: Unified Full-Stack Server (Recommended)

The backend is configured to serve both the REST API and the compiled React production frontend from a single port (`http://localhost:5000`):

```bash
# Build frontend
cd frontend
npm run build

# Start backend server
cd ../backend
npm start
```
Now open your browser and navigate to: **`http://localhost:5000`**

#### Option B: Independent Development Servers

Run backend and Vite hot-reloading dev server concurrently:

```bash
# Terminal 1 - Backend API (Port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend Vite Dev Server (Port 5173 with proxy)
cd frontend
npm run dev
```
Navigate to: **`http://localhost:5173`**

---

## 🔑 Demo Credentials

For instant testing of protected features (Wishlist & Price Alerts), click the **"1-Click Instant Demo Sign In"** button on the Login page or use:
- **Email:** `aarav@picksy.io`
- **Password:** `picksy123`

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/health` | Service health check | Public |
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Authenticate & retrieve JWT | Public |
| `GET` | `/api/auth/me` | Current authenticated user profile | Private |
| `GET` | `/api/products` | Filterable product catalog with dynamic decision metrics | Public |
| `GET` | `/api/products/spotlight/deals`| Top recommended deals for homepage | Public |
| `GET` | `/api/products/:id` | Detailed Decision Dashboard for single product | Public |
| `POST` | `/api/cart/optimize` | Multi-platform Quick-Commerce Cart Optimizer | Public |
| `GET` | `/api/wishlist` | User's saved wishlist products | Private |
| `POST` | `/api/wishlist/:id` | Add product to wishlist | Private |
| `DELETE`| `/api/wishlist/:id` | Remove product from wishlist | Private |
| `GET` | `/api/alerts` | Active & triggered price drop alerts | Private |
| `POST` | `/api/alerts` | Create new target price alert | Private |
| `DELETE`| `/api/alerts/:id` | Dismiss/delete price alert | Private |

---

## 🛡️ License

Built with pride for smart, informed shoppers everywhere. Pick Smartly, Shop Wisely.

