# Eylul Kurtcebe Portfolio - Ceramic Artist & R&D Chemist

A modern and fully-featured portfolio website for Eylül Kurtcebe, a ceramic artist and R&D chemist. Built with Next.js 15, React 19, TypeScript, Tailwind CSS, and MongoDB.

## Features

-   **Multilingual Support** - Full English and Turkish language support
-   **Responsive Design** - Mobile-first approach, looks perfect on all devices
-   **MongoDB Integration** - Dynamic content management with MongoDB
-   **Modern UI/UX** - Animated components with Framer Motion and GSAP
-   **Server Components** - Using Next.js 15 App Router with React Server Components
-   **Admin Panel** - Secure content management system
-   **SEO Optimized** - Built-in SEO features for better discoverability
-   **Optimized Images** - Efficient image loading and display
-   **3D Effects** - Three.js integration for immersive experiences
-   **Type-Safe** - Fully typed codebase with TypeScript

## Tech Stack

-   **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
-   **Styling**: Tailwind CSS, CLSX, Tailwind Merge
-   **Animations**: Framer Motion, GSAP
-   **3D Effects**: Three.js, React Three Fiber/Drei
-   **Database**: MongoDB with Mongoose
-   **i18n**: Custom internationalization solution
-   **State Management**: React Context API, Server Actions
-   **UI Components**: Custom components with Shadcn UI principles
-   **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

-   Node.js 18+ and npm/yarn
-   MongoDB database (local or Atlas)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/eylulkurtcebe-portfolio.git
cd eylulkurtcebe-portfolio
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Create a `.env` file in the root directory with the following variables:

```
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# JWT Secret for Admin Authentication
JWT_SECRET=your_jwt_secret

# Node Environment
NODE_ENV=development

# Revalidation Secret for On-Demand ISR
REVALIDATE_SECRET=your_revalidation_secret

# Hugging Face API Key for AI Features (client-side accessible)
NEXT_PUBLIC_HUGGINGFACE_API_KEY=your_huggingface_api_key

# Site URL
SITE_URL=http://localhost:3000

# SEO Default Logo Path
NEXT_PUBLIC_DEFAULT_LOGO_PATH=/logo.webp

# Brevo API Key for Contact Form
BREVO_API_KEY=your_brevo_api_key
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Database Setup and Migration

The project includes several migration scripts to help set up your database:

```bash
# Run the basic migration
npm run migrate

# Additional migration scripts
npm run migrate:status    # Update status fields
npm run migrate:slug      # Convert IDs to slugs
npm run migrate:footer    # Update footer content
npm run migrate:seo       # Add SEO fields
npm run migrate:nav       # Update navigation links

# Create an admin user
npm run create-admin
```

## Project Structure

-   `app/` - Next.js App Router structure
    -   `[lng]/` - Language-specific routes
    -   `admin/` - Admin panel
    -   `api/` - API routes
-   `components/` - Reusable UI components
-   `lib/` - Utility functions and server actions
-   `models/` - MongoDB schemas
-   `public/` - Static assets
-   `i18n/` - Internationalization configuration
-   `messages/` - Translation files
-   `scripts/` - Migration and utility scripts

## Multilingual Support

The application supports English and Turkish languages with a custom i18n implementation:

-   URL-based language switching (`/en/...` for English, `/tr/...` for Turkish)
-   Separate content for each language in the database
-   Translation files in the `messages/` directory

## Content Management

Projects and content can be managed through:

1. The Admin Panel at `/admin`
2. Direct database modifications
3. Server Actions in the codebase

## Deployment

This application can be deployed to Vercel with the following command:

```bash
vercel
```

Make sure to set up all environment variables in your Vercel project settings.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

-   [Next.js](https://nextjs.org/)
-   [React](https://reactjs.org/)
-   [MongoDB](https://www.mongodb.com/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [Framer Motion](https://www.framer.com/motion/)
-   [Three.js](https://threejs.org/)
