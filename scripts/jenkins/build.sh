#!/usr/bin/env bash
set -euo pipefail
[[ "$(hostname)" == TH-AIN ]] || { echo 'Run on the TH-AI Jenkins agent (TH-AIN host)' >&2; exit 1; }
revision=$(git rev-parse HEAD)
image="beltonpreview:$revision"
for script in scripts/jenkins/*.sh scripts/container-entrypoint.sh; do bash -n "$script"; done
python3 -m unittest discover -s tests -p 'test_*.py'
docker build --label "org.opencontainers.image.revision=$revision" -t "$image" .
docker run --rm --entrypoint node "$image" scripts/check-syntax.js
docker run --rm --entrypoint npm "$image" test
