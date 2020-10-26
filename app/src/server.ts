import * as sapper from '@sapper/server';
import { json } from 'body-parser';
import compression from 'compression';
import polka from 'polka';
import sirv from 'sirv';
import { alpaca } from './libs/alpaca';

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

alpaca.init();

polka() // You can also use Express
  .use(
    json(),
    compression({ threshold: 0 }),
    sirv('static', { dev }),
    sapper.middleware()
  )
  .listen(PORT, (err) => {
    if (err) console.log('error', err);
  });
