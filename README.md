# FoodLoop City

Urban food waste intelligence network.

## Project Structure

```
foodloop/
├── client/          # React frontend
├── server/          # Node.js/Express backend
└── docs/            # Documentation
```

## Prerequisites

- **Node.js** 16+ (download from https://nodejs.org/)
- **PostgreSQL** 13+ (database)
- **Git** (for version control)

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/PamelaRopafadzo/foodloop-city.git
cd foodloop
```

### 2. Set up the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory with:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=foodloop_dev
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
```

Initialize the database:
```bash
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

### 3. Set up the frontend

```bash
cd ../client
npm install
```

Create a `.env` file in the `client/` directory with:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Project

### Terminal 1 - Start the backend server
```bash
cd server
npm run dev
```
Server runs on `http://localhost:5000`

### Terminal 2 - Start the frontend
```bash
cd client
npm start
```
Frontend runs on `http://localhost:3000`

## Demo Accounts

After seeding, use these credentials to test:

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@mkcafe.pl | password123 |
| Staff | staff@mkcafe.pl | password123 |
| Charity Coordinator | coordinator@warsawfoodbank.pl | password123 |
| Admin | admin@foodloop.city | password123 |

## Available Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm test` - Run tests
- `npx sequelize-cli db:migrate` - Run migrations
- `npx sequelize-cli db:seed:all` - Seed database with demo data

### Frontend
- `npm start` - Start development server
- `npm test` - Run tests
- `npm run build` - Build for production

## Troubleshooting

**"Cannot connect to database"**
- Ensure PostgreSQL is running
- Check DB credentials in `.env`

**"npm install fails"**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

**"Port already in use"**
- Backend: Change `PORT` in `server/.env`
- Frontend: Set `PORT=3001 npm start` in client terminal

See docs/ for full documentation and setup instructions.
