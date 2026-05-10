.PHONY: install build lint test smoke hooks up down

install:
	npm install

build:
	npm run build

lint:
	npm run lint

test:
	npm test

smoke:
	npm run smoke

hooks:
	npm run hooks:install

up:
	docker compose up --build

down:
	docker compose down
