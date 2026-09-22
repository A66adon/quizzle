FROM gradle:9.5.1-jdk21 AS build
WORKDIR /build
COPY quizzle/settings.gradle quizzle/build.gradle ./
COPY quizzle/src ./src
RUN gradle --no-daemon bootJar

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /build/build/libs/quizzle-0.0.1-SNAPSHOT.jar app.jar
COPY ./branding /branding
RUN mkdir -p /data/quizzes /data/db
ENV SERVER_PORT=8080 \
    QUIZ_FOLDER=/data/quizzes \
    BRANDING_FOLDER=/branding \
    QUIZ_DATABASE_PATH=/data/db/quiz-snapshots.db \
    ACCOUNTS_FILE=/data/db/accounts.yml
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
