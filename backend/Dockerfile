# syntax=docker/dockerfile:1

FROM --platform=$BUILDPLATFORM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -B -ntp -DskipTests package

FROM eclipse-temurin:17-jre

RUN groupadd --system pawsitters \
    && useradd --system --gid pawsitters --home-dir /app --shell /usr/sbin/nologin pawsitters

WORKDIR /app

COPY --from=build /workspace/target/*.jar /app/app.jar

RUN mkdir -p /app/uploads \
    && chown -R pawsitters:pawsitters /app

USER pawsitters

ENV APP_UPLOAD_DIR=/app/uploads

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
