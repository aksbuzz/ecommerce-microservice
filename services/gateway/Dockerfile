FROM node:24-slim

WORKDIR /app

COPY . .

RUN --mount=type=cache,target=/root/.npm npm ci

EXPOSE 3000

CMD ["node", "--import", "./services/gateway/src/instrumentation.ts", "services/gateway/src/app.ts"]
