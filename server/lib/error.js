const Http = require('http');
const Render = require('./render');


function error(opts) {
  opts = opts || {};

  const template = opts.template || 'error';

  const env = process.env.NODE_ENV || 'development';

  var cache = opts.cache;
  if (null == cache) cache = 'development' != env;

  return async function error(ctx, next) {
    try {
      await next();
      if (404 == ctx.response.status && !ctx.response.body) ctx.throw(404);
    } catch (err) {
      ctx.status = err.status || 500;

      ctx.app.emit('error', err, ctx);

      switch (ctx.accepts('html', 'text', 'json')) {
        case 'text':
          ctx.type = 'text/plain';
          if ('development' == env) ctx.body = err.message
          else if (err.expose) ctx.body = err.message
          else throw err;
          break;

        case 'json':
          ctx.type = 'application/json';
          if ('development' == env) ctx.body = {
            error: err.message
          }
          else if (err.expose) ctx.body = {
            error: err.message
          }
          else ctx.body = {
            error: Http.STATUS_CODES[ctx.status]
          }
          break;

        case 'html':
          ctx.type = 'text/html';
          ctx.body = Render(template, {
            title: 'Error - ' + ctx.status,
            cache: cache,
            env: env,
            ctx: ctx,
            request: ctx.request,
            response: ctx.response,
            error: err.message,
            stack: err.stack,
            status: ctx.status,
            code: err.code
          });
          break;
      }
    }
  }
}

module.exports = error;