import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Scheme, Office } from '../src/data/models.js';
import { config } from '../src/config/index.js';
import { logger } from '../src/utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  await mongoose.connect(config.mongo.uri);
  const schemes = JSON.parse(readFileSync(join(__dirname, 'schemes.json'), 'utf8'));
  const offices = JSON.parse(readFileSync(join(__dirname, 'offices.json'), 'utf8'));

  await Scheme.deleteMany({});
  await Scheme.insertMany(schemes);
  logger.info(`seeded ${schemes.length} schemes`);

  await Office.deleteMany({});
  await Office.insertMany(offices);
  logger.info(`seeded ${offices.length} offices`);

  await mongoose.disconnect();
  logger.info('seed complete');
}

run().catch(err => { logger.fatal({ err }, 'seed failed'); process.exit(1); });
