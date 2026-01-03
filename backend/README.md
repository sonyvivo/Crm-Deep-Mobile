# Mobile CRM Backend

Node.js + Express + PostgreSQL (Neon) backend for Mobile CRM.

## Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update with your Neon database URL:
```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://username:password@host.neon.tech/database?sslmode=require
JWT_SECRET=your-super-secret-key-change-this
PORT=3000
FRONTEND_URL=http://localhost:4200
```

### 3. Run Database Migration
```bash
npm run migrate
```

### 4. Register First Admin User
After migration, register your admin user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"kuldeepgupta577","password":"Deep@1122"}'
```

### 5. Start Development Server
```bash
npm run dev
```

Server runs at `http://localhost:3000`

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/verify` | GET | Verify JWT token |
| `/api/customers` | GET, POST | Customers CRUD |
| `/api/customers/:id` | GET, PUT, DELETE | Single customer |
| `/api/suppliers` | GET, POST, DELETE | Suppliers |
| `/api/purchases` | GET, POST | Purchases CRUD |
| `/api/purchases/:id` | GET, PUT, DELETE | Single purchase |
| `/api/sales` | GET, POST | Sales CRUD |
| `/api/sales/:id` | GET, PUT, DELETE | Single sale |
| `/api/expenses` | GET, POST | Expenses CRUD |
| `/api/expenses/:id` | GET, PUT, DELETE | Single expense |
| `/api/jobsheets` | GET, POST | Job sheets CRUD |
| `/api/jobsheets/:id` | GET, PUT, DELETE | Single job sheet |
| `/api/invoices` | GET, POST | Invoices CRUD |
| `/api/invoices/:id` | GET, PUT, DELETE | Single invoice |

## Deploy to Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repo
4. Set environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL` (your Vercel URL)
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
