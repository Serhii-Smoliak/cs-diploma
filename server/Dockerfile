# Build context: repository root
#   docker build -t cybertactics-server -f server/Dockerfile .

FROM node:20-alpine AS build

WORKDIR /app

# --- shared ---
COPY shared/package.json shared/package-lock.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/src ./shared/src/

WORKDIR /app/shared
RUN npm ci && npm run build

# --- server ---
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./

RUN npm ci

COPY server/tsconfig.json ./
COPY server/prisma ./prisma/
COPY server/src ./src/

RUN npm run db:generate && npm run build
RUN npm prune --omit=dev

# --- production ---
FROM node:20-alpine AS production

RUN apk upgrade --no-cache

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/shared ./shared

WORKDIR /app/server
COPY --from=build /app/server/package.json /app/server/package-lock.json ./
COPY --from=build /app/server/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/prisma ./prisma

EXPOSE 3001

CMD ["node", "dist/index.js"]
