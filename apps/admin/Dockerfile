FROM node:24-slim AS builder

WORKDIR /app

COPY . .

RUN --mount=type=cache,target=/root/.npm npm ci

RUN npm run build -w apps/admin

FROM nginx:alpine

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
