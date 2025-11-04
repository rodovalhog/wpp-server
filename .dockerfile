# Imagem com Node + Chromium + dependências do Puppeteer
FROM ghcr.io/puppeteer/puppeteer:22-slim

# Diretório de trabalho
WORKDIR /app

# Copia package.json e lock
COPY package*.json ./

# Instala dependências (inclui puppeteer, wppconnect e afins)
RUN npm ci --omit=dev=false

# Copia o código
COPY tsconfig.json ./
COPY src ./src

# Build TS
RUN npm run build

# ENV necessários (caso não venham da Fly)
ENV PORT=8080
ENV CHROME_PATH=/usr/bin/chromium
ENV SESSION_DIR=/app/.wppconnect
ENV SESSION_NAME=next-wpp-session
ENV NODE_ENV=production

# Exponha a porta
EXPOSE 8080

# Cria a pasta de sessão (será montado volume nela)
RUN mkdir -p /app/.wppconnect

# Comando
CMD ["npm", "start"]
