# CodeKidzz

A modern, responsive educational website for kids learning Scratch. The app combines a playful public-facing academy site with enrollment, contact, and admin management views.

## Features

- Animated, kid-friendly home page
- Course catalog with enrollment calls to action
- Projects gallery for Scratch games and demos
- Validated enrollment form with local record storage
- Contact form, WhatsApp link, and map embed
- Admin dashboard with first-admin setup and staff account management
- Dark/light mode toggle
- Mobile-friendly responsive layout

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- CSS3

## Admin Login

Visit `/admin` and create the first Admin account with your own email and password. After login, Admin users can create additional Admin or Tutor accounts from Platform Config.

This project currently uses browser localStorage for data and staff credentials. It is functional for local/single-browser use, but production deployment should connect the auth and records to a backend database and server-side authentication.

## Development

- Install dependencies: npm install
- Start development server: npm run dev
- Build for production: npm run build
- Preview production build: npm run preview

## Deployment

This project is ready for Netlify or Vercel deployment.
