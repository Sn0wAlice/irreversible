export class upload{
    public FILEDB = []

    public async main(){
        for await (const conn of Deno.listen({ port: 16332 })) {
            this.handle(conn);
        }
    }


    private async handle(conn: Deno.Conn) {
        const httpConn = Deno.serveHttp(conn);
        for await (const event of httpConn) {
            if (event.request.url.endsWith('/upload')) {
                console.log('~ [upload] - new file')
                if(event.request.method == "POST"){
                    if(event.request.headers.get("ir-server") == "HIBVUIK"){
                        const arrayBuffer = await event.request.arrayBuffer();
                        const buffer = new Uint8Array(arrayBuffer);
                        let fileName = event.request.headers.get("fileName")
                        this.FILEDB.push({
                            name: fileName,
                            buffer: buffer,
                            socket: false,
                            content: "ok"
                        })
                    }
                }
            }
            await event.respondWith(new Response());
        }
    }
}