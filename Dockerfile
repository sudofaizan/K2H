FROM node:18-alpine
WORKDIR /app
COPY *.json /app
COPY *.js /app/
COPY public /app/public
RUN apk add ffmpeg
RUN npm install && mkdir temp
CMD [ "node","server_wav.js" ]