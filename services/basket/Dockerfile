FROM node:24-slim

WORKDIR /app

COPY . .

RUN --mount=type=cache,target=/root/.npm npm ci

EXPOSE 3003

CMD ["node", "--import", "./services/basket/src/instrumentation.ts", "services/basket/src/app.ts"]
