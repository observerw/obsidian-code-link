# Default task: list all recipes
default:
	@just --list

# Build the plugin
build:
	pnpm run build

# Run linting
lint:
	pnpm run lint

# Run tests
test:
	pnpm run test

# Release a new version
# Usage: just release patch | minor | major
release version="patch": lint
	@echo "Bumping version and creating tag..."
	npm version {{version}}
	@echo "Pushing code and tags to origin..."
	git push origin main --tags
	@echo "Release workflow triggered on GitHub Actions."
