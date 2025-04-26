# Etapa 1: Build del proyecto
FROM maven:3.9.4-eclipse-temurin-17 AS build

WORKDIR /app

# Copiamos el pom.xml y descargamos dependencias (cache eficiente)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiamos el resto del código fuente
COPY src ./src

# Construimos el proyecto
RUN mvn clean package -DskipTests

# Etapa 2: Imagen final más ligera
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copiamos el jar generado en la etapa anterior
COPY --from=build /app/target/*.jar /app/my-springboot-app.jar

# Exponemos el puerto
EXPOSE 8080

# Variable de entorno para OpenAI API Key (valor será pasado en docker-compose o como -e OPENAI_API_KEY)
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

# Comando para ejecutar la app
ENTRYPOINT ["java", "-jar", "/app/my-springboot-app.jar"]