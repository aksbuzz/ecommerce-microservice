FROM amacneil/dbmate:2 AS dbmate

FROM node:24-slim

WORKDIR /app

COPY --from=dbmate /usr/local/bin/dbmate /usr/local/bin/dbmate

COPY . .

RUN --mount=type=cache,target=/root/.npm npm ci

COPY scripts/service-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3004

ENV MIGRATIONS_DIR=/app/services/ordering/db/migrations
ENTRYPOINT ["/entrypoint.sh"]
CMD ["--import", "./services/ordering/src/instrumentation.ts", "services/ordering/src/app.ts"]
