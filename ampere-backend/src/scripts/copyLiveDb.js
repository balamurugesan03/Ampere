/**
 * Copies the LIVE database into a LOCAL database so dummy purchases can be tested on real
 * users without touching live data. Only reads from the live DB.
 *
 *   npm run copy:live-db -- "<live MONGODB_URI>"
 *   npm run copy:live-db -- "<live MONGODB_URI>" "mongodb://127.0.0.1:27017/ampere_live_copy"
 *
 * Target defaults to <local MONGODB_URI db>_live_copy and is wiped first. Then:
 *   npm run test:user-purchases -- --db=mongodb://127.0.0.1:27017/ampere_live_copy --check
 */
require('dotenv').config();
const mongoose = require('mongoose');

function defaultTarget() {
  const m = /^(mongodb(?:\+srv)?:\/\/[^/]+)\/?([^?]*)(\?.*)?$/.exec(process.env.MONGODB_URI || '');
  if (!m) throw new Error('Give the target URI, or set MONGODB_URI in .env');
  return `${m[1]}/${m[2] || 'ampere'}_live_copy${m[3] || ''}`;
}

async function main() {
  const [liveUri, targetUri = defaultTarget()] = process.argv.slice(2);
  if (!liveUri) throw new Error('Usage: npm run copy:live-db -- "<live MONGODB_URI>" ["<target uri>"]');
  if (liveUri === targetUri) throw new Error('Live and target are the same database');

  const live = await mongoose.createConnection(liveUri).asPromise();
  const target = await mongoose.createConnection(targetUri).asPromise();
  if (live.host === target.host && live.name === target.name) throw new Error('Live and target are the same database');
  console.log(`Copying ${live.host}/${live.name}  ->  ${target.host}/${target.name} (wiping target)`);
  await target.dropDatabase();

  for (const c of await live.db.listCollections({ type: 'collection' }).toArray()) {
    const src = live.db.collection(c.name);
    const dst = target.db.collection(c.name);
    let n = 0;
    let batch = [];
    for await (const doc of src.find()) {
      batch.push(doc);
      if (batch.length === 1000) {
        await dst.insertMany(batch);
        n += batch.length;
        batch = [];
      }
    }
    if (batch.length) await dst.insertMany(batch);
    n += batch.length;
    const indexes = (await src.indexes()).filter((i) => i.name !== '_id_');
    for (const { key, name, v, ns, ...opts } of indexes) await dst.createIndex(key, { name, ...opts });
    console.log(`   ${c.name}: ${n}`);
  }
  await live.close();
  await target.close();
  console.log(`\nDone. Test on it with:\n   npm run test:user-purchases -- --db=${targetUri} --check`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
