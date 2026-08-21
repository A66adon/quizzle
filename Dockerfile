FROM gradle:9.5.1-jdk21 AS build
WORKDIR /build
COPY Backend/Quiz/settings.gradle Backend/Quiz/build.gradle ./
COPY Backend/Quiz/src ./src
RUN gradle --no-daemon bootJar

FROM eclipse-temurin:21-jre
RUN useradd --system --create-home --uid 10001 quizzle
WORKDIR /app
COPY --from=build /build/build/libs/Quiz-0.0.1-SNAPSHOT.jar app.jar
COPY Backend/Quiz/quizzes /data/quizzes
RUN mkdir -p /data/db && chown -R quizzle:quizzle /data

USER quizzle
ENV SERVER_PORT=8080 \
    QUIZ_FOLDER=/data/quizzes \
    QUIZ_DATABASE_PATH=/data/db/quiz-snapshots.db
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
