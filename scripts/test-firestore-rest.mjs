import 'dotenv/config';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const firestore = require('../lib/firestore-rest.js');

async function test() {
  console.log('Listing users in Firestore...');
  const users = await firestore.listDocuments('users', { pageSize: 5 });
  console.log('Users found:', users ? users.length : 'null (failed)');
  if (users) {
    for (const u of users) {
      console.log('User id:', u.id, 'fields:', JSON.stringify(u.fields));
    }
  }
}

test();
