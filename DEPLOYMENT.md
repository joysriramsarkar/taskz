# Deployment Guide

## Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

## Production Deployment

### Option 1: Node.js Server

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Option 2: Docker Deployment

```bash
# Build Docker image
docker build -t task-manager .

# Run Docker container
docker run -p 3000:3000 task-manager
```

### Option 3: Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables:
   - `DATABASE_URL`: Your database connection string
   - `NEXTAUTH_SECRET`: A random secret string

### Option 4: Railway/Render

1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm run start`
4. Add environment variables

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NODE_ENV="production"
```

## Database Setup

```bash
# Push database schema
npx prisma db push

# (Optional) Seed database
npx prisma db seed
```

## Troubleshooting

### Build Errors
- Make sure Node.js version is 18+
- Clear cache: `rm -rf .next node_modules && npm install`

### Database Issues
- Check DATABASE_URL environment variable
- Run `npx prisma generate` after installing dependencies

### Port Issues
- Change PORT environment variable if needed
- Default port is 3000

## Features

- ✅ Task Management (Create, Read, Update, Delete)
- ✅ Recurring Tasks (Daily, Weekly)
- ✅ Calendar View with Bengali dates
- ✅ Responsive Design (Mobile, Tablet, TV)
- ✅ Bengali Number Support
- ✅ Real-time Updates with Socket.IO
- ✅ Categories and Priorities
- ✅ Task Statistics

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `GET /api/categories` - Get categories
- `GET /api/statistics` - Get task statistics