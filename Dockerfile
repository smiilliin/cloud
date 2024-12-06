FROM node:22-alpine as development

WORKDIR /app

EXPOSE 3000
CMD ["npm", "start"]

FROM node:22-alpine as production

WORKDIR /app
COPY package.json .
COPY package-lock.json .
RUN npm install

COPY . .

RUN npm run build
RUN npm install -g serve

EXPOSE 3000
CMD ["serve", "-s", "build"]