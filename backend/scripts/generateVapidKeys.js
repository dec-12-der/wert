// backend/scripts/generateVapidKeys.js

import webPush from 'web-push';

const keys = webPush.generateVAPIDKeys();

console.log('------------------------------');
console.log('VAPID Public Key:', keys.publicKey);
console.log('VAPID Private Key:', keys.privateKey);
console.log('------------------------------');
