FROM node:22-bookworm-slim AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build \
    && mkdir -p /static \
    && cp -r index.html 404.html assets register repository git kanban playwright api-overview 404 /static/

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /static/ /usr/share/nginx/html/

EXPOSE 80
