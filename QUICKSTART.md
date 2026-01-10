# 🚀 Quick Start Guide - Personal Finance Tracker

## First Time Setup

### 1. Install Dependencies (Already done!)
```bash
npm install
```

### 2. Set Up PostgreSQL Database

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL in Docker
docker run --name finance-db \
  -e POSTGRES_USER=financeuser \
  -e POSTGRES_PASSWORD=financepass \
  -e POSTGRES_DB=financedb \
  -p 5432:5432 \
  -d postgres:16-alpine
```

#### Option B: Use Full Docker Compose
```bash
# This will start both the database and the app
docker compose up -d
```

### 3. Set Up Environment Variables

Your `.env` file should already exist. Make sure it has:

```env
DATABASE_URL="postgresql://financeuser:financepass@localhost:5432/financedb"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
CRON_SECRET="your-cron-secret-here"
```

Generate secure secrets:
```bash
# For NEXTAUTH_SECRET
openssl rand -base64 32

# For CRON_SECRET  
openssl rand -base64 32
```

### 4. Create Database Tables
```bash
# Create the initial migration
npx prisma migrate dev --name init

# Or if you just want to push the schema (for development)
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## 📝 First Steps After Starting

1. **Sign Up**: Go to `/auth/signup` and create your account
2. **Add an Account**: 
   - Click "Accounts" → "Add Account"
   - Choose "Bank/Salary" for your main account
   - Enter your current balance
3. **Create Categories**:
   - Click "Categories" → "Add Category"
   - Create categories like: Groceries, Rent, Entertainment, Transport
4. **Add a Transaction**:
   - Click "Add Transaction" from the dashboard
   - Select account, amount, type, and category

## 🐳 Docker Deployment

### Full Stack with Docker
```bash
# Start everything (database + app)
docker compose up -d

# View logs
docker compose logs -f app

# Stop everything
docker compose down
```

The app will be available at http://localhost:3000

### Run Migrations in Docker
```bash
docker compose exec app npx prisma migrate deploy
```

## 🔧 Useful Commands

### Database Management
```bash
# Open Prisma Studio (visual database editor)
npm run db:studio

# Create a new migration
npm run db:migrate

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset
```

### Development
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Docker
```bash
# Start
npm run docker:up

# Stop
npm run docker:down

# View logs
npm run docker:logs
```

## 🔄 Setting Up Recurring Transactions

Recurring transactions need a daily cron job. Here are your options:

### Option 1: GitHub Actions (Free & Easy)
Create `.github/workflows/cron.yml`:

```yaml
name: Process Recurring Transactions
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger cron
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/recurring \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add repository secrets:
- `APP_URL`: Your app URL
- `CRON_SECRET`: Your cron secret from `.env`

### Option 2: System Cron (Linux/Mac)
```bash
crontab -e
# Add:
0 2 * * * curl -X POST http://localhost:3000/api/cron/recurring -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Option 3: Manual Trigger
```bash
curl -X POST http://localhost:3000/api/cron/recurring \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🐛 Troubleshooting

### Port 5432 already in use
```bash
# Find what's using port 5432
lsof -i :5432

# Kill it or change the port in docker-compose.yml
```

### Database connection failed
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker restart finance-db
```

### Can't login after creating account
- Make sure the database migration ran successfully
- Check that the User table exists in Prisma Studio

### Prisma Client errors
```bash
# Regenerate Prisma Client
npx prisma generate
```

## 📊 Understanding the App

### Account Types

**Bank/Salary Account**:
- Tracks real money you have
- Balance = what's in your account
- Positive for income, negative for expenses

**Credit Card**:
- Tracks credit limit
- Available limit decreases when you spend
- Increases when you make payments

### Transaction Types

- **INCOME**: Money coming in (salary, refunds)
- **EXPENSE**: Money going out (bills, purchases)
- **ADJUSTMENT**: System-generated balance corrections

### Monthly Budget Flow

1. Set budgets on categories (optional)
2. Transactions are categorized
3. Dashboard shows spending vs budget (visual only, no blocking)
4. Budget tracking resets each month automatically

## 🎯 Next Steps

1. ✅ Create your account
2. ✅ Add your bank account(s)
3. ✅ Create expense categories
4. ✅ Add some transactions
5. ✅ Set up recurring payments (rent, subscriptions)
6. ✅ Check your dashboard for next month projection

---

**Need Help?** Check the main README.md for detailed documentation.
