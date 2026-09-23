#!/usr/bin/env bash
# Update the live site from GitHub.
# First time, clone the repo and create .env, then run this script.
# After that, push from your PC and run: bash /var/www/ecom/app/scripts/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Missing .env in $(pwd). Copy .env.example to .env and fill it in before deploying."
  exit 1
fi

git pull --ff-only origin main
npm ci
npm run build

if pm2 describe ecom >/dev/null 2>&1; then
  pm2 restart ecom --update-env
else
  pm2 start npm --name ecom -- start -- -p 3000
  pm2 save
fi

echo "Live site updated."
