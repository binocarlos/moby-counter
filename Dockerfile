FROM node:16.15-slim
MAINTAINER Kai Davenport <kaiyadavenport@gmail.com>
ADD . /srv/app
WORKDIR /srv/app
RUN npm install
EXPOSE 80
ENTRYPOINT ["node", "index.js"]
