.PHONY: up down migrate-up migrate-down

# Docker Compose commands
up:
	docker compose up -d --build

down:
	docker compose down

# Database migration commands using sqlx
migrate-up:
	sqlx migrate run --database-url "postgresql://user:password@localhost:5432/smolhog_analytics"

migrate-down:
	sqlx migrate revert --database-url "postgresql://user:password@localhost:5432/smolhog_analytics"