#!/usr/bin/env bash
set -euo pipefail
[[ "$(hostname)" == TH-AIN ]] || { echo 'Wrong deployment host' >&2; exit 1; }
: "${APP_BASE_PATH:=/beltonpreview}" "${APP_NETWORK:=belton-chatbot_default}"
: "${APP_PUBLIC_URL:=https://th-ain.beltontechnology.com/beltonpreview/}"
: "${NGINX_CONFIG:=/home/tanupatj/ProjectAI/belton-chatbot/nginx/nginx.conf}"
: "${LLM_PROVIDER:=openai}" "${OPENAI_BASE_URL:=http://host.docker.internal:8000/v1}"
: "${MODEL_NAME:=Qwen3.6-35B-A3B-AWQ}"
revision=$(git rev-parse HEAD)
image="beltonpreview:$revision"
candidate="beltonpreview-check-${revision:0:12}"
backup="beltonpreview-previous-$(date +%Y%m%d%H%M%S)"
replaced=false
installed=false
success=false
docker network inspect "$APP_NETWORK" >/dev/null
docker image inspect "$image" >/dev/null
docker volume create beltonpreview-data >/dev/null

cleanup() {
    docker rm -f "$candidate" >/dev/null 2>&1 || true
    if [[ "$success" != true && "$installed" == true ]]; then
        docker logs --tail 60 beltonpreview >&2 || true
        docker rm -f beltonpreview >/dev/null 2>&1 || true
        if [[ "$replaced" == true ]]; then
            docker rename "$backup" beltonpreview
            docker start beltonpreview >/dev/null
            echo 'Restored previous container' >&2
        fi
    fi
}
trap cleanup EXIT

wait_healthy() {
    local container=$1
    for attempt in $(seq 1 60); do
        state=$(docker inspect --format '{{.State.Health.Status}}' "$container")
        [[ "$state" == healthy ]] && return 0
        [[ "$(docker inspect --format '{{.State.Running}}' "$container")" == true ]] || break
        sleep 2
    done
    docker logs --tail 60 "$container" >&2
    return 1
}

run_app() {
    docker run -d --name "$1" --network "$APP_NETWORK" \
        --restart "$2" --init --security-opt no-new-privileges:true \
        --add-host host.docker.internal:host-gateway \
        --mount source=beltonpreview-data,target=/app/runtime \
        -e "BASE_PATH=$APP_BASE_PATH" -e "APP_REVISION=$revision" \
        -e "LLM_PROVIDER=$LLM_PROVIDER" -e "OPENAI_BASE_URL=$OPENAI_BASE_URL" -e "MODEL_NAME=$MODEL_NAME" \
        -e NUM_GPU=26 -e NUM_CTX=6144 "$image"
}

# Check the immutable image with real SQLite and HTTP before replacing the service.
run_app "$candidate" no >/dev/null
wait_healthy "$candidate"
docker exec -e "EXPECTED_REVISION=$revision" "$candidate" node scripts/smoke-test.js "http://127.0.0.1:8080$APP_BASE_PATH/"
docker rm -f "$candidate" >/dev/null

if docker container inspect beltonpreview >/dev/null 2>&1; then
    docker stop --time 20 beltonpreview >/dev/null
    docker rename beltonpreview "$backup"
    replaced=true
fi
installed=true
run_app beltonpreview unless-stopped >/dev/null
wait_healthy beltonpreview
expected=$(docker image inspect --format '{{.Id}}' "$image")
actual=$(docker inspect --format '{{.Image}}' beltonpreview)
[[ "$actual" == "$expected" ]] || { echo 'Running image does not match built image' >&2; exit 1; }

python3 scripts/jenkins/configure-proxy.py "$NGINX_CONFIG"
docker exec -e "EXPECTED_REVISION=$revision" beltonpreview node scripts/wait-for-release.js "$APP_PUBLIC_URL"
docker exec -e "EXPECTED_REVISION=$revision" beltonpreview node scripts/smoke-test.js "$APP_PUBLIC_URL"
success=true
echo "Verified deployment $revision ($actual) at $APP_PUBLIC_URL"
if [[ "$replaced" == true ]]; then
    echo "Previous stopped container retained for rollback: $backup"
fi
