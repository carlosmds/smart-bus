#!/bin/bash
set -e

docker network create --driver bridge --subnet=172.42.0.0/24 --gateway=172.42.0.1 sockets-network || echo "!! REDE JÁ CRIADA"
./run.sh redis || echo "!! REDIS JÁ CRIADO"

CURRENT_DATE=$(date +%s)
CURRENT_DATE_LAST_4_DIGITS=${CURRENT_DATE: -4}
APP_PORT=$CURRENT_DATE_LAST_4_DIGITS
APP_NAME="socket-app-$APP_PORT"
APP_COMMAND="./run.sh app $APP_NAME $APP_PORT"

bash -c "$APP_COMMAND"