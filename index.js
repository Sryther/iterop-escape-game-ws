const app = require("express")();
const httpServer = require("http").createServer(app);
const options = {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
};
const io = require("socket.io")(httpServer, options);

const connections = {};

const preserveInstance = (socket, instance) => {
    setInterval(() => {
        socket.emit("preserve-instance", instance);
    }, 10000);
}

const workspaces = io.of(/^\/instance-.*$/);

setInterval(() => {
    Object.values(connections).forEach(connection => {
       connection.server.broadcast.emit("shake-it", null);
    });
}, 5000);

workspaces.on("connection", (socket) => {
    const namespace = socket.nsp.name;
    const instance = namespace.replace(/^\/instance-/, "");
    if (connections[instance] === undefined) {
        connections[instance] = {
            "items": [],
            "sockets": [],
            "server": socket
        };
    }
    console.log(`Socket ${socket.id} connected (${instance})`);
    const items = connections[instance].items;
    const sockets = connections[instance].sockets;

    sockets.push(socket);

    preserveInstance(socket, instance);

    socket.on('message', console.log);

    socket.on("pamela-removed", (joueurs) => {
        const newJoueurs = joueurs.replace(" , Pamela Anderson", "")
        socket.broadcast.emit('set-joueurs', newJoueurs);
    });

    socket.on("click-sync", () => {
        socket.broadcast.emit('clicked-sync', null);
    });

    socket.on("unclick-sync", () => {
        socket.broadcast.emit('unclicked-sync', null);
    });

    socket.on('item-found', item => {
        if (items.indexOf(item) === -1) {
            console.log(`${instance}: found item ${item}.`);
            items.push(item);
        }
        if (item === "carte_grise") {
            socket.broadcast.emit('allow-monitoring', null);
        }
    });

    socket.on("disconnect", () => {
        sockets.splice(sockets.indexOf(socket), 1)
    });
});

workspaces.use((socket, next) => {
    // ensure the user has access to the workspace
    next();
});

httpServer.listen(3000);
