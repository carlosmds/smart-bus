const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const redis = require('redis');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const REDIS_HOST = "172.42.0.24"
const REDIS_PORT = "6379"
const redisClient = redis.createClient(REDIS_PORT, REDIS_HOST);
 
redisClient.on('error', (err) => {
    console.log("Error " + err)
});

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use('/', (req, res) => {
    res.render('index.html');
});

io.on('connection', socket => {
    handleSocket(socket);
});

keepRoutesFresh(io)

async function handleSocket(socket) 
{
    socket.on('addRoute', route => {
        setRoute(socket, route);
    });

    socket.on('cancelRoute', route_id => {
        deleteRoute(socket, route_id);
    });
}

function setRoute(socket, route){
    route.id = uuidv4()
    key = getRoomKey('default', `routes:${route.id}`);
    route = JSON.stringify(route);
    redisClient.set(key, route);
    refreshRoutes(socket)
}

function deleteRoute(socket, route_id){
    key = getRoomKey('default', `routes:${route_id}`);
    redisClient.del(key);
    refreshRoutes(socket)
}

async function keepRoutesFresh(socket){

    let secondsFresh = 1

    setInterval(async function() {

        await updateRoutes()
        await refreshRoutes(socket)
    
    }, secondsFresh * 1000);
}

async function updateRoutes(){
    let freshRoutes = await getFreshRoutes()

    freshRoutes.forEach(freshRoute => {

        console.log(freshRoute);

        if (freshRoute.status == "alive") {
            freshRoute.current_location = freshRoute.data.routes[0].overview_path[freshRoute.current_step] || false

            if (freshRoute.current_location == false) {
                freshRoute.status = "done"
                freshRoute.current_step = -1
            } else {
                freshRoute.current_step++
            }
            
            key = getRoomKey('default', `routes:${freshRoute.id}`);
            route = JSON.stringify(freshRoute);
            redisClient.set(key, route);
        }
    });
}

async function refreshRoutes(socket){
    let freshRoutes = await getFreshRoutes()
    socket.emit('refreshRoutes', freshRoutes);
}

function getFreshRoutes(){
    return new Promise((resolve, reject) => {
        pattern = getRoomKey('default', `routes:*`);
        redisClient.keys(pattern, function(err, keys) {  
            redisClient.mget(keys, function(err, routes) {
                if (err) {
                    resolve([]);
                } else {
                    previousRoutes = routes.map(user => JSON.parse(user));
                    resolve(previousRoutes);
                }   
            });
        });
    });
}

function getRoomKey(room, key) {
    return `rooms:${room}:${key}`;
}

server.listen(3000, () => {
    console.log('Server started at port 3000');
});