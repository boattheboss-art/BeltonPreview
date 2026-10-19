FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8080 SQLITE_PATH=/app/runtime/scada.db
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=node:node package.json server.js ./
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node data/scada.db data/belton_slides_database.json data/seagate_exam_questions.json ./data/
COPY --chown=node:node scripts/check-syntax.js scripts/smoke-test.js scripts/container-entrypoint.sh ./scripts/
COPY --chown=node:node tests ./tests
RUN mkdir /app/runtime && chown node:node /app/runtime
USER node
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=6 \
    CMD node -e "fetch('http://127.0.0.1:8080'+(process.env.BASE_PATH||'')+'/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["sh", "scripts/container-entrypoint.sh"]
CMD ["node", "server.js"]
