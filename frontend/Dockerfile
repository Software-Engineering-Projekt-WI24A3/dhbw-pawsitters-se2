# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM node:22-bookworm-slim AS build

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

RUN npm run build

FROM node:22-bookworm-slim AS runtime-deps

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-bookworm-slim

WORKDIR /app/frontend

ENV PORT=80
ENV HOST=0.0.0.0
ENV BACKEND_ORIGIN=http://backend:8080

COPY --from=build /workspace/frontend/dist /app/frontend/dist
COPY --from=build /workspace/frontend/scripts /app/frontend/scripts
COPY --from=build /workspace/frontend/src /app/frontend/src
COPY --from=build /workspace/frontend/tailwind.config.js /app/frontend/tailwind.config.js
COPY --from=build /workspace/frontend/package.json /app/frontend/package.json
COPY --from=runtime-deps /app/frontend/node_modules /app/frontend/node_modules

EXPOSE 80

CMD ["node", "./scripts/serve.mjs"]
