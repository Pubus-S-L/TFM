FROM node:23-alpine as builder

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

RUN --mount=type=secret,id=openai_api_key,env=VITE_OPENAI_API_KEY \
    --mount=type=secret,id=websocket_server,env=VITE_WS_URI npm run build

FROM node:23-alpine

RUN npm i -g serve

WORKDIR /app

COPY --from=builder /app/dist /app/dist

EXPOSE 3000

CMD ["serve", "-s", "/app/dist"]