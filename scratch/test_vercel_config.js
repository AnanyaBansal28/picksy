process.env.VERCEL = '1';

const app = require('../backend/server');
const inMemoryStore = require('../backend/config/inMemoryStore');

console.log('App exported correctly:', typeof app === 'function');
console.log('DB Storage Path under VERCEL=1:', inMemoryStore.DB_STORAGE_PATH);

const testSave = inMemoryStore.saveDbFallback({ test: 'vercel-tmp-check', timestamp: Date.now() });
console.log('Fallback write success:', testSave);

const loaded = inMemoryStore.loadDbFallback();
console.log('Fallback read back:', loaded?.test);

if (typeof app === 'function' && inMemoryStore.DB_STORAGE_PATH === '/tmp/db.json' && testSave && loaded?.test === 'vercel-tmp-check') {
  console.log('🎉 ALL VERCEL DEPLOYMENT CONFIG CHECKS PASSED!');
} else {
  console.error('❌ Check failed!');
  process.exit(1);
}
