#!/bin/bash
docker build -t docker.lab.somansa.com:5001/lgen-approval-server:latest --platform=linux/amd64 --no-cache .
echo "ehzjdlalwl1\!" | docker login -u docker docker.lab.somansa.com:5001 --password-stdin | docker image push docker.lab.somansa.com:5001/lgen-approval-server:latest
docker image tag docker.lab.somansa.com:5001/lgen-approval-server:latest docker.lab.somansa.com:5001/lgen-approval-server:1.0.0
echo "ehzjdlalwl1\!" | docker login -u docker docker.lab.somansa.com:5001 --password-stdin | docker image push docker.lab.somansa.com:5001/lgen-approval-server:1.0.0