export class getinfos {

    public async main(){
        return {
            username: (await this.execute('./scripts/getUsername.sh')).split('\n')[0],
            homeDir: (await this.execute('./scripts/getHomeDir.sh')).split('\n')[0],
        }
    }


    //private function
    private async execute(commande: any) {
        var content = "";
        var p = Deno.run({cmd: commande.split(' '),stdout: "piped", stderr: "piped"});
        var { code } = await p.status();
        if (code === 0) {
          var rawOutput = await p.output();
          content = new TextDecoder().decode(rawOutput);
        } else {
            var rawError = await p.stderrOutput();
            var errorString = new TextDecoder().decode(rawError);
            console.log('[Error] - '+errorString);
        }
        return content
    }
}