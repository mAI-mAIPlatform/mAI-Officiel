#!/bin/bash
export NEXT_PUBLIC_BASE_PATH=""
export AUTH_SECRET=secret
export POSTGRES_URL=postgres://user:password@localhost:5432/db
pnpm dev
