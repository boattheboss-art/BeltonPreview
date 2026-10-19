#!/bin/sh
set -eu
if [ ! -f "$SQLITE_PATH" ]; then
    cp /app/data/scada.db "$SQLITE_PATH"
fi
exec "$@"
