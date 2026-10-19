# BeltonPreview on TH-AIN

- GitLab: http://gitlab.th.beltontechnology.com/tanupat.j/beltonpreview.git
- Jenkins: http://192.168.74.72:8084/job/beltonpreview-deploy/
- Agent: `TH-AI` (actual hostname `TH-AIN`, user `tanupatj`, Docker access)
- Branch: `main`; Pipeline script from SCM; script path: `Jenkinsfile`
- Web: https://th-ain.beltontechnology.com/beltonpreview/
- Health: https://th-ain.beltontechnology.com/beltonpreview/api/health

## Deployment

Run **Build Now** in the Jenkins job. The pipeline checks out the GitLab commit,
builds a Node.js 24 image using `npm ci`, checks JavaScript syntax and path tests,
then starts a temporary container against the persistent SQLite volume. HTTP
smoke tests check all six pages, assets, machine 27 and the 50-machine summary.
Only after those checks pass does it replace `beltonpreview`, validate its image
ID against the built image, configure nginx and run the smoke tests over HTTPS.
The health response exposes the deployed Git revision.

The agent deploys locally; no SSH password or token is required in the pipeline.
Use the existing Jenkins GitLab credential for SCM checkout. No automatic trigger
is configured; subsequent deployments run when **Build Now** is selected.

## Routing and persistence

The container joins the existing `belton-chatbot_default` Docker network without
publishing another host port. The shared reverse proxy routes only
`/beltonpreview/` to this container. The application receives the prefix unchanged
and uses `BASE_PATH=/beltonpreview` for pages, links and API calls.

SQLite persists in the named volume `beltonpreview-data`, mounted at
`/app/runtime`. The entrypoint copies the tracked seed database only when no
runtime database exists. Knowledge JSON remains part of the image and updates
with each release. The RAG SQLite fallback respects `SQLITE_PATH`.

nginx config: `/home/tanupatj/ProjectAI/belton-chatbot/nginx/nginx.conf`.
The managed block has `BEGIN BELTONPREVIEW` / `END BELTONPREVIEW` markers.
Before modifying it, the script writes and verifies a dated backup. Writes keep
the existing inode because nginx bind-mounts the file. `nginx -t` must pass before
reload; failure restores the original file. Other applications remain running.

## AI and simulation

SCADA uses the existing 50-machine demonstration dataset. The Python live
telemetry simulator is not started by this web deployment. Copilot uses the
existing vLLM service at `http://host.docker.internal:8000/v1`, model
`Qwen3.6-35B-A3B-AWQ`, with `LLM_PROVIDER=openai`. An adapter converts messages,
native tool calls and streaming into the orchestrator's existing contract.
Qwen thinking stays enabled; only answer tokens are sent to the browser.
The pipeline does not download models or change existing GPU workloads.
For local Ollama development, omit `LLM_PROVIDER` and use `OLLAMA_BASE_URL`.
Edge TTS requires outbound connectivity.

## Recovery

A failed replacement restores the previous container automatically. Successful
deployments retain the previous stopped container and its image. To roll back,
identify that container in the build log, stop and rename the current
`beltonpreview`, rename the previous container to `beltonpreview`, then start it.
The shared SQLite volume remains intact. Do not delete `beltonpreview-data`.

Local checks: `npm run check`, `npm test`, and
`python -m unittest discover -s tests -p 'test_*.py'`.
