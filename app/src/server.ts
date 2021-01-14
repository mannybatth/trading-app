import * as sapper from '@sapper/server';
import { json } from 'body-parser';
import compression from 'compression';
import fs from 'fs';
import https from 'https';
import polka from 'polka';
import sirv from 'sirv';
import { secondaryTradingStrategy } from './core/secondary-trading-strategy';
import { simpleTradingStrategy } from './core/simple-trading-strategy';
import './queue-cron';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

// init classes
simpleTradingStrategy;
secondaryTradingStrategy;

const httpsServer = https.createServer({
  key: fs.readFileSync('localhost+3-key.pem'),
  cert: fs.readFileSync('localhost+3.pem'),
});

polka({ server: httpsServer })
  .use(json(), compression({ threshold: 0 }), sirv('static', { dev }), sapper.middleware())
  .listen(PORT, (err) => {
    if (err) console.log('error', err);
  });
