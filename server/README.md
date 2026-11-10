# BorrowHub API

Express + MongoDB API for the BorrowHub client (`../`). It also serves Better Auth
(`/api/auth/*`) and Socket.io for messaging.

## Setup

```bash
cd server
npm install
cp .env.example .env   # already created here; edit the values for your environment
npm run dev            # or: npm start
```

Health check: <http://localhost:8000/api/health>

## Environment

| Variable | Notes |
| --- | --- |
| `PORT` | Port the API listens on. The client's `NEXT_PUBLIC_API_URL` must match it. |
| `NODE_ENV` | `development` \| `test` \| `production`. Secure cookies are enabled in production. |
| `MONGODB_URI` | Atlas/local connection string. The database name must be the one the site uses (`borrowhub`). |
| `BETTER_AUTH_SECRET` | At least 32 characters. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `BETTER_AUTH_URL` | Public URL of this API **including the port** — `http://localhost:8000` when running locally with `PORT=8000`. |
| `FRONTEND_URL` | Client origin, used for CORS and trusted auth origins (`http://localhost:3000`). |
| `COOKIE_SAME_SITE` | `lax` locally; `none` (with HTTPS) if the client and API are on different sites. |
| `CLOUDINARY_*` | Required by `/api/uploads/images`. Placeholder values keep the server booting but uploads will fail until real credentials are set. |

## Listings and the homepage

`POST /api/items` publishes a listing with `status: "approved"`, so it is returned by
`GET /api/items` immediately and shows up on the homepage (which requests
`/api/items?sort=newest&limit=6`). Admins can still moderate any listing through
`PATCH /api/admin/items/:id` with `approved`, `rejected`, or `paused`.

`GET /api/items` supports `q`, `category`, `condition`, `area`, `minRating`,
`minPrice`, `maxPrice`, `startDate`/`endDate`, `page`, `limit`, and `sort`
(`recommended`, `newest`, `price_asc`, `price_desc`, `rating`).

## Notes

- The client and API must share a host for the auth cookie to be sent
  (`localhost:3000` and `localhost:8000` share `localhost`).
- If port 8000 is already taken, stop the other server or change `PORT` here and
  `NEXT_PUBLIC_API_URL` in `../.env.local` together.
