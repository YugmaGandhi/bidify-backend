src/
  ├── config/         # Env vars, DB connection
  ├── modules/        # Domain Driven Design (DDD)
  │   ├── auth/       # Auth routes, controllers, services
  │   ├── auction/    # Auction routes, controllers, services
  │   └── bidding/    # Bidding logic
  ├── common/         # Shared middlewares (Error handling, Logger)
  ├── app.ts          # Express App setup
  └── server.ts       # Server entry point

  