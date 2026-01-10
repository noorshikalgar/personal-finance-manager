# Personal Finance Tracker

A **simple, privacy-focused, self-hosted** personal finance tracker built with Next.js, PostgreSQL, and Prisma. Track your money like Excel, but automated and clean.

## 🎯 Philosophy

- **Simple mental model**: Money in, money out, balance changes
- **No accounting jargon**: No payee, cleared status, or reconciliation
- **User-controlled truth**: You decide what happened, the app records & visualizes
- **Excel-like simplicity** with automation

## ✨ Features

- 🔐 **Simple Authentication**: Single-user, email + password, optional PIN protection
- 💳 **Two Account Types**:
  - Bank/Salary accounts with balance tracking
  - Credit card accounts with limit management
- 💰 **Smart Transactions**: Simple income/expense tracking with automatic balance updates
- 📊 **Flat Categories**: No nesting, optional monthly budgets (visual only)
- 🔄 **Recurring Transactions**: Monthly payments with idempotent processing
- 📈 **Dashboard**: Overview with next month projections (read-only)
- 🔍 **Transaction Filters**: Search, filter by date/account/category
- 📤 **Export**: CSV and PDF export capabilities (coming soon)
- 🐳 **Self-Hosted**: Complete Docker setup for easy deployment

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router, TypeScript)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: NextAuth.js v5
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd personal-finance-manager
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update:
   - `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
   - `CRON_SECRET`: Generate with `openssl rand -base64 32`
   - Leave `DATABASE_URL` as is for Docker setup

3. **Start with Docker** (Recommended)
   ```bash
   docker compose up -d
   ```
   
   The app will be available at `http://localhost:3000`

### Local Development (Without Docker)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start PostgreSQL** (with Docker)
   ```bash
   docker run --name finance-db \
     -e POSTGRES_USER=financeuser \
     -e POSTGRES_PASSWORD=financepass \
     -e POSTGRES_DB=financedb \
     -p 5432:5432 \
     -d postgres:16-alpine
   ```

3. **Run migrations**
   ```bash
   npx prisma migrate dev
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 📖 User Guide

### First Time Setup

1. **Create Account**: Visit `/auth/signup` to create your account
2. **Add Bank Account**: Navigate to Accounts → Add Account
   - Choose "Bank/Salary" type
   - Enter current balance
   - Optionally add monthly income
   - Choose whether to import past transactions
3. **Add Categories**: Create spending categories (e.g., Groceries, Rent, Entertainment)
4. **Set Up Recurring Payments**: Add monthly bills (rent, subscriptions, etc.)

### Daily Usage

#### Adding a Transaction
1. Go to Dashboard → Add Transaction
2. Select account and category
3. Enter amount (positive for income, negative for expenses)
4. Add optional note
5. Submit

### Recurring Transactions

Recurring transactions automatically create transactions on specified days each month.

**Rules**:
- Paused before run date → skips current month
- Paused after run date → current month transaction stays, next month skipped
- Unpaused after run date → resumes next cycle (no retroactive transactions)
- System prevents duplicates (idempotent)

**Cron Setup**:
To process recurring transactions, set up a daily cron job:

```bash
curl -X POST https://your-domain.com/api/cron/recurring \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## 🐳 Docker Deployment

### Production Deployment

1. **Update environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Build and start**
   ```bash
   docker compose up -d --build
   ```

3. **Run migrations**
   ```bash
   docker compose exec app npx prisma migrate deploy
   ```

### Docker Commands

```bash
# View logs
npm run docker:logs

# Stop containers
npm run docker:down

# Restart
docker compose restart
```

## 🔧 Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Create migration
npm run db:migrate

# Push schema changes (development only)
npm run db:push
```

## 🚫 What This App Doesn't Do

- ❌ Multi-currency support
- ❌ AI categorization
- ❌ Bank account sync
- ❌ Investment tracking
- ❌ Multi-user/family accounts

## 📝 License

MIT License - feel free to use and modify for personal use.

---

**Made with ❤️ for people who want simple, private finance tracking.**


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
