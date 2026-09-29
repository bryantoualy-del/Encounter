FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY rpg-connect-server.js ./
ENV PORT=3000
EXPOSE 3000
CMD ["node", "rpg-connect-server.js"]
