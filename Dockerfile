FROM gradle:9.5.1-jdk21 AS build
WORKDIR /build
COPY quizzle/settings.gradle quizzle/build.gradle ./
COPY quizzle/src ./src
RUN gradle --no-daemon bootJar

FROM eclipse-temurin:21-jre
RUN useradd --system --create-home --uid 10001 quizzle
WORKDIR /app
COPY --from=build /build/build/libs/quizzle-0.0.1-SNAPSHOT.jar app.jar
COPY ./quizzes /data/quizzes
COPY quizzle/branding /data/branding
RUN mkdir -p /data/db && chown -R quizzle:quizzle /data

USER quizzle
ENV SERVER_PORT=8080 \
    QUIZ_FOLDER=/data/quizzes \
    BRANDING_FOLDER=/data/branding \
    QUIZ_DATABASE_PATH=/data/db/quiz-snapshots.db
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
