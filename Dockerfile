# Usamos una imagen de OpenJDK (Java 17 como ejemplo)
FROM openjdk:17-jdk-slim

# Definimos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos el JAR de Spring Boot al contenedor
COPY target/my-springboot-app.jar /app/my-springboot-app.jar

# Exponemos el puerto en el que se ejecuta la aplicación
EXPOSE 8080

# Definimos la variable de entorno para la API Key de OpenAI
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

# Ejecutamos el JAR de la aplicación Spring Boot
ENTRYPOINT ["java", "-jar", "/app/my-springboot-app.jar"]
