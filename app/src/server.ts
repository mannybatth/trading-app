import * as sapper from '@sapper/server';
import { json } from 'body-parser';
import compression from 'compression';
import fs from 'fs';
import https from 'https';
import polka from 'polka';
import sirv from 'sirv';
import { alpaca } from './libs/alpaca';
import './queue-cron';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

alpaca.init();

const httpsServer = https.createServer({
  key: fs.readFileSync('localhost+3-key.pem'),
  cert: fs.readFileSync('localhost+3.pem'),
});

polka({ server: httpsServer })
  .use(json(), compression({ threshold: 0 }), sirv('static', { dev }), sapper.middleware())
  .listen(PORT, (err) => {
    if (err) console.log('error', err);
  });
