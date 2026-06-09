# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY migrations ./migrations
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh
EXPOSE 4000
CMD ["sh", "entrypoint.sh"]
