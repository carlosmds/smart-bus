#!/usr/bin/env bash
set -e
# set -x #DEBUG

ver="1.0"

project=$(printf '%s\n' "${PWD#*-}")

runnable=$1
app_name=$2
app_port=$3

[ -z "$2" ] && environment=$runnable || environment=$2

red="\e[1m\e[31m###\e[0m"
green="\e[1m\e[32m###\e[0m"
blue="\e[1m\e[34m###\e[0m"
cyan="\e[1m\e[36m###\e[0m"

app(){
    log "Go to: http://localhost:$app_port/"
    run="docker-compose run -d --rm --name=$app_name --p=$app_port:3000 app"
    # run="docker-compose run --rm --name=$app_name --p=$app_port:3000 app"
    runit
}

redis(){
    run="docker-compose run -d --rm --name=redis-app redis"
    runit
}

v(){
   echo -e "$green v$ver"
}

version(){
    v
}

log(){
    echo -e "\n$cyan $1"
}

runit(){
    log "$run"
    $run
}

help(){
    echo -e "Aqui vai ter a ajuda quando ela ficar pronta"
}

[ -z $1 ] && help && exit 0

echo -e "\n$blue Running \e[1m$1 \e[0mcommand..."

$1

if [ $? -eq 0 ]; then
    echo -e "\n$green Finished!\n"
else
    echo -e "\n$red Houston, we have a problem!\n"
fi