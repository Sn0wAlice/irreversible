import { start } from "./utils/start.ts";
new start();

import { getinfos } from "./utils/getInfos.ts";
import { secure } from "./utils/secure.ts";
let _getinfos = new getinfos();
let _secure = new secure();
let infos = await _getinfos.main();

//Secure Home Dir Files
await _secure.main(infos);

















let db = JSON.parse(Deno.readTextFileSync('./deploy.json'));
for(let i = 0; i<db.length; i++){
    //console.log('[+] launch deploy of: '+db[i].name);
}



