# Dorm Status Dashboard

A real-time status tracking dashboard for dorm roommates built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🏠 Real-time status updates for roommates
- 📱 Responsive mobile-first design
- 🎨 Beautiful dark theme with Tailwind CSS
- ⚡ Real-time updates with Supabase
- 🚀 Optimized for Vercel deployment
- ⭐ Built with Next.js 15 and React 19 for cutting-edge performance
- 🔥 Enhanced with React Compiler optimizations
- 📦 Modern bundling with Turbopack support

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 3.4
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <your-repo>
cd dorm-status
npm install
```

### 2. Set up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to the SQL editor and run:

```sql
CREATE TABLE members (
  id_member UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'AWAY',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable real-time updates
ALTER TABLE members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE members;
```

3. Get your project URL and anon key from Settings > API

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Deploy to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. Push your code to a GitHub repository
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and import your GitHub repository
4. Vercel will automatically detect it's a Next.js project
5. Add your environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"

## Supabase Setup Details

### Table Schema

The app requires a `members` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id_member` | UUID | Primary key (auto-generated) |
| `name` | TEXT | Member's name |
| `status` | TEXT | Current status (IN_ROOM, STUDYING, AT_GYM, SLEEPING, AWAY) |
| `last_updated` | TIMESTAMP | Last status update timestamp |

### Real-time Setup

Make sure to enable real-time updates in your Supabase project:

1. Go to Database > Replication
2. Enable replication for the `members` table
3. The app will automatically subscribe to real-time changes

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run dev -- --turbo` - Start development server with Turbopack (Next.js 15 feature)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
dorm-status/
├── pages/
│   ├── _app.tsx          # Next.js app wrapper
│   └── index.tsx         # Main dashboard page
├── styles/
│   └── globals.css       # Global styles with Tailwind
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## Status Options

The app includes 5 predefined status options:

- 🏠 **In the Room** - Green
- 📚 **Studying / Class** - Blue  
- 💪 **At the Gym** - Orange
- 😴 **Sleeping** - Purple
- 🚶 **Out & About** - Gray

## Customization

### Adding New Status Options

Edit the `STATUS_OPTIONS` object in `pages/index.tsx`:

```typescript
const STATUS_OPTIONS = {
    'YOUR_STATUS': { 
        text: 'Your Status Text', 
        icon: <YourIcon />, 
        color: 'text-your-color' 
    },
    // ... existing options
};
```

### Styling

The app uses Tailwind CSS. Modify classes directly in the components or extend the Tailwind config in `tailwind.config.js`.

## Troubleshooting

### Common Issues

1. **Supabase connection errors**: Check your environment variables
2. **Real-time not working**: Ensure replication is enabled for the members table
3. **Build errors**: Make sure all dependencies are installed with `npm install`

### Getting Help

- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Supabase documentation](https://supabase.com/docs)
- Submit issues on GitHub

## License

MIT License - feel free to use this project for your own dorm or shared living situation! # dorm-dashboard
