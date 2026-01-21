FROM docker.lab.somansa.com/node:22.12.0

LABEL maintainer="const4636"
LABEL email="const4636@somansa.com"

ENV LANG=C.UTF-8

COPY ./ /build

RUN curl http://debian.mirror.lab.somansa.com/enable.sh | bash - 
RUN curl http://debian.mirror.lab.somansa.com/cert.sh | bash - 

RUN apt-get -y update && apt-get -y install \
  apt-utils \ 
  supervisor \
  dnsutils \
  logrotate \
  attr \
  vim \
  gawk \
  dateutils \
  net-tools \
  iproute2 \
  strace \
  traceroute \
  tcpdump \
  iputils-ping \
  default-mysql-client \
  && apt-get -y clean

WORKDIR /build

RUN yarn config set registry "http://npm.mirror.lab.somansa.com"
RUN yarn install
RUN yarn build

WORKDIR /

RUN mkdir /approval_server


RUN mv /build/html /approval_server/html
RUN mv /build/app/dist /approval_server/src
RUN mv /build/node_modules /approval_server
RUN mv /build/package.json /approval_server/package.json
RUN rm -rf /build

WORKDIR /approval_server

CMD ["node", "./src/index.js"]
