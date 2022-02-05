/**
 * 
 * Works with args: 
 * node main.js KEY IN OUT
 * 
 * 
 */

 let args = process.argv.splice(2);

 const crypto = require('crypto');
 const fs = require('fs')
 const algorithm = 'aes-256-ctr';
 let key = args[0];
 key = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);
 
 const decrypt = (encrypted) => {
    const iv = encrypted.slice(0, 16);
    encrypted = encrypted.slice(16);
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return result;
 };
 
 const plain = fs.readFileSync(args[1]);
 const decrypted = decrypt(plain);
 fs.writeFileSync(args[2], decrypted);
 
 