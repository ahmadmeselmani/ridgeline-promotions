.DEFAULT_GOAL := help
.PHONY: help setup dev api web build lint fmt fmtcheck tc test e2e check clean gen migdev migdeploy dbreset seed studio

## ---- Getting started ----

setup: ## First run: install deps, create .env files from examples, migrate + seed SQLite
	pnpm bootstrap

## ---- Local development (wraps root package.json scripts) ----

dev: ## Run API (:3004) and web (:3003) in dev mode (turbo run dev)
	pnpm dev

api: ## Run only the API in dev mode (builds shared packages, migrates + seeds first)
	pnpm turbo run dev --filter=promo-hub

web: ## Run only the web app in dev mode (builds shared packages first)
	pnpm turbo run dev --filter=promo-web

build: ## Build all apps and packages (turbo run build)
	pnpm build

lint: ## Lint all apps and packages
	pnpm lint

fmt: ## Format the codebase with prettier
	pnpm format

fmtcheck: ## Check formatting without writing (not yet in `check`: see plans/ACTIVE.md)
	pnpm format:check

tc: ## Type-check all apps and packages (tc = type check)
	pnpm check-types

test: ## Run unit tests (pricing engine + API, each API test on its own SQLite copy)
	pnpm test

e2e: ## Run the API end-to-end tests over HTTP
	pnpm test:e2e

check: ## Everything CI would run: build, type-check, lint, unit + e2e tests
	pnpm turbo run build check-types lint test
	pnpm test:e2e

clean: ## Remove node_modules, build output, generated Prisma client, and caches
	pnpm clean

## ---- Prisma / database (SQLite, at whatever DATABASE_URL apps/promo-hub/.env points to) ----

gen: ## Regenerate the Prisma client
	pnpm generate

migdev: ## Create + apply a new migration locally (ARGS="--name add_x")
	pnpm db:migrate:dev -- $(ARGS)

migdeploy: ## Apply pending migrations (non-interactive, no new migration created)
	pnpm db:migrate:deploy

dbreset: ## Wipe the demo database, re-migrate, and re-seed
	pnpm db:reset

seed: ## Seed rulebooks (idempotent: never overwrites an existing draft)
	pnpm db:seed

studio: ## Open Prisma Studio
	pnpm db:studio

help: ## Show this help
	@grep -E '^[a-zA-Z0-9_-]+:.*## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'
