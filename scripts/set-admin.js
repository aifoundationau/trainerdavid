// Usage: node scripts/set-admin.js <email> [--revoke]
import { auth } from './admin.js';

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error('Usage: node scripts/set-admin.js <email> [--revoke]');
  process.exit(1);
}

const user = await auth.getUserByEmail(email);
const admin = flag !== '--revoke';
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, admin });
console.log(`${admin ? 'Granted' : 'Revoked'} admin for ${email} (uid ${user.uid})`);
