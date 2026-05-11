FROM node:22-bookworm-slim AS build

ARG GITHUB_REF_NAME=develop
ARG GITHUB_REPOSITORY=Software-Engineering-Projekt-WI24A3/dhbw-pawsitters-se2
ARG GITHUB_SHA=

ENV GITHUB_REF_NAME=${GITHUB_REF_NAME}
ENV GITHUB_REPOSITORY=${GITHUB_REPOSITORY}
ENV GITHUB_SHA=${GITHUB_SHA}

WORKDIR /workspace/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
COPY backend/src/main/java/com/pawsitters/model/PetChoice.java ../backend/src/main/java/com/pawsitters/model/
COPY backend/src/main/resources/API_Calls/dhbw_pawsitters_se2-openapi.yaml ../backend/src/main/resources/API_Calls/
COPY README.md ../README.md

RUN npm run build \
    && mkdir -p /static \
    && cp -r index.html 404.html assets register repository git kanban playwright api-overview 404 en ro /static/

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /static/ /usr/share/nginx/html/

EXPOSE 80
