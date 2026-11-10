# BorrowHub

Peer-to-peer rentals for Bangladesh: **Don't Buy It. Borrow It.**

## Setup

1. Install dependencies with `npm i`.
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL=http://localhost:8000`.
3. Start the Express backend on port 8000 first (`cd server && npm start`).
4. Run `npm run dev` and open http://localhost:3000.

The frontend only uses the public API URL. Database credentials and other server secrets belong in the backend environment and must never be added here.

## Notes

Public items and categories, auth, quote and booking request screens use the documented API envelope. Dashboard, conversation, admin, image upload, and several other endpoints in the requested contract are not implemented in the supplied Express server; those screens show API errors or unavailable states until the backend adds them.
