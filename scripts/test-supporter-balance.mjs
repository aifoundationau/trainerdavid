import 'dotenv/config';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const firestore = require('../lib/firestore-rest.js');
const tokenBalances = require('../lib/token-balances.js');

async function test() {
  const uid = 'KvKk7LUsTBRY9FbQQpImFPLeZ6f1';
  console.log('Testing getBalance for uid:', uid);
  const tokenStore = tokenBalances.createTokenStore({ appTag: 'pt', appName: 'Trainer David' });
  const balanceResult = await tokenStore.getBalance(uid);
  console.log('tokenStore.getBalance result:', balanceResult);

  const pendingResult = await tokenStore.getPendingCheckouts(uid);
  console.log('tokenStore.getPendingCheckouts result:', pendingResult);
}

test();
