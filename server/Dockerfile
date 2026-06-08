# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY migrations ./migrations
EXPOSE 4000
CMD ["node", "dist/index.js"]
