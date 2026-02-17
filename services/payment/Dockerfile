FROM node:24-slim

WORKDIR /app

COPY . .

RUN --mount=type=cache,target=/root/.npm npm ci

CMD ["node", "--import", "./services/payment/src/instrumentation.ts", "services/payment/src/app.ts"]
