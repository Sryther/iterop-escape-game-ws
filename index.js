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

io.of(/^\/instance-.*$/).on("connection", (socket) => {
    const namespace = socket.nsp;
    const instance = namespace.replace(/^\/instance-/, "");
    if (connections[instance] === undefined) {
        connections[instance] = {
            "items": [],
            "sockets": []
        };
    }
    console.log(`Socket ${socket.id} connected (${instance}`);
    const items = connections[instance].items;
    const sockets = connections[instance].sockets;

    sockets.push(socket);

    preserveInstance(socket, instance);

    socket.on('item-found', item => {
        if (items.indexOf(item) === -1) {
            items.push(item);
            if (item === "carte_grise") {
                socket.emit('allow-monitoring');
            }
        }
    });

    socket.on("disconnect", () => {
        sockets.splice(sockets.indexOf(socket), 1)
    });
});

httpServer.listen(3000);
