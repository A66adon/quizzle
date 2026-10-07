FROM gradle:9.5.1-jdk21 AS build
WORKDIR /build
COPY quizzle/settings.gradle quizzle/build.gradle ./
COPY quizzle/src ./src
RUN gradle --no-daemon bootJar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl \
    && addgroup -S -g 10001 quizzle \
    && adduser -S -D -H -u 10001 -G quizzle quizzle
COPY --from=build /build/build/libs/quizzle-0.0.1-SNAPSHOT.jar app.jar
COPY ./branding /branding
ENV SERVER_PORT=8080 \
    BRANDING_FOLDER=/branding
USER 10001:10001
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=4 \
    CMD curl --fail --silent "http://127.0.0.1:${SERVER_PORT}/health" || exit 1
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
