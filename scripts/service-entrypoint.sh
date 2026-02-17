#!/bin/sh
set -e

if [ -n "$MIGRATIONS_DIR" ]; then
  echo "Running database migrations from $MIGRATIONS_DIR..."
  dbmate --wait --migrations-dir "$MIGRATIONS_DIR" up
fi

exec node "$@"
