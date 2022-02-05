/**
 * 
 * Works with args: 
 * node main.js KEY IN OUT
 * 
 * 
 */

let args = process.argv.slice(2);

const crypto = require('crypto');
const fs = require('fs')
const algorithm = 'aes-256-ctr';
let key = args[0];
key = crypto.createHash('sha256').update(String(key)).digest('base64').substr(0, 32);

const encrypt = (buffer) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const result = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
    return result;
};

const plain = fs.readFileSync(args[1]);
fs.writeFileSync(args[2], encrypt(plain));