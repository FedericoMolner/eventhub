const crypto = require('crypto');

console.log('\nJWT Secrets generati in modo sicuro:\n');
console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('JWT_REFRESH_SECRET=' + crypto.randomBytes(32).toString('hex'));