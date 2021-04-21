#!/bin/bash

echo Type the version:
read VERSION

sudo docker build -t adrianofr/modern-stack-project:$VERSION .
sudo docker push adrianofr/modern-stack-project:$VERSION

ssh root@159.203.80.215 "docker pull adrianofr/modern-stack-project:$VERSION && docker tag adrianofr/modern-stack-project:$VERSION dokku/api:latest && dokku tags:deploy api latest"