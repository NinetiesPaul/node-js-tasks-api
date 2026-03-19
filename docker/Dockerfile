FROM node:20-alpine

WORKDIR /usr/src/app

# Install dependencies first (better layer caching)
COPY package.json ./
RUN npm install

# Copy the rest of the application
COPY . .

EXPOSE 3000

# Create a sequelize-cli compatible config/config.json at container start
# (so we don't require a manually created config/config.json file).
CMD ["sh", "-c", "\
  node -e '\
    const fs = require(\"fs\");\
    const cfg = {\
      development: {\
        username: process.env.DB_USERNAME,\
        password: process.env.DB_PASSWORD,\
        database: process.env.DB_DATABASE,\
        host: process.env.DB_HOST,\
        dialect: process.env.DB_ENGINE,\
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined\
      }\
    };\
    if (cfg.development.port === undefined) delete cfg.development.port;\
    fs.mkdirSync(\"config\", { recursive: true });\
    fs.writeFileSync(\"config/config.json\", JSON.stringify(cfg, null, 2));\
  ' && ./node_modules/.bin/sequelize-cli db:migrate && node server.js"]
