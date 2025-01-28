FROM node:18-alpine
WORKDIR /app
COPY *.json /app
COPY *.js /app/
COPY public /app/public
RUN apk add ffmpeg
RUN npm install && mkdir temp
EXPOSE 8080
EXPOSE 80
CMD ["node","server.js"]
