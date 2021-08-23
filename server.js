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

async function handleSocket(socket) 
{
    keepRoutesFresh(socket)

    socket.on('addRoute', route => {
        setRoute(socket, route);
    });

    socket.on('removeBus', route => {
        deleteRoute(socket, route);
    });
}

function setRoute(socket, route){
    route.id = uuidv4()
    key = getRoomKey('default', `routes:${route.id}`);
    route = JSON.stringify(route);
    redisClient.set(key, route);
    refreshRoutes()
}

function deleteRoute(socket, route){
    key = getRoomKey('default', `routes:${route.id}`);
    redisClient.del(key);
    refreshRoutes()
}

async function keepRoutesFresh(socket){

    let secondsFresh = 5

    setInterval(async function() {

        await updateRoutes()
        await refreshRoutes(socket)
    
    }, secondsFresh * 1000);
}

async function updateRoutes(){
    let freshRoutes = await getFreshRoutes()

    console.log(freshRoutes);
}

async function refreshRoutes(socket){
    let freshRoutes = await getFreshRoutes()
    socket.broadcast.emit('refreshRoutes', freshRoutes);
}

function getFreshRoutes(){
    return new Promise((resolve, reject) => {
        pattern = getRoomKey('default', `routes:*`);
        redisClient.keys(pattern, function(err, keys) {  
            redisClient.mget(keys, function(err, routes) {
                if (err) {
                    console.log("Ainda não existem rotas cadastradas.");
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
    console.log('Server started at 3000');
});