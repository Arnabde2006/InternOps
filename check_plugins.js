const fs = require('fs');
const path = require('path');

// These are the require() calls found in app.js (order matters little)
const modules = [
  './config',
  '@fastify/cors',
  '@fastify/helmet',
  '@fastify/rate-limit',
  '@fastify/cookie',
  '@fastify/multipart',
  '@fastify/static',
  '@fastify/swagger',
  '@fastify/swagger-ui',
  './middleware/csrf',
  './utils/cron',
  './modules/auth/routes',
  './modules/users/routes',
  './modules/departments/routes',
  './modules/hierarchy/routes',
  './modules/attendance/routes',
  './modules/ratings/routes',
  './modules/social-tasks/routes',
  './modules/proof-submissions/routes',
  './modules/notifications/routes',
  './modules/audit/routes',
  './modules/uploads/routes',
  './modules/analytics/routes',
  './modules/meetings/routes',
  './modules/sessions/routes',
  './modules/reports/routes',
  './modules/reports/export',
  './modules/uptoskills/routes',
];

function isPluginFunction(mod) {
  // A Fastify plugin is a function with arity <= 2 (fastify, opts) or async
  if (typeof mod !== 'function') return false;
  const arity = mod.length;
  return arity <= 2 || mod.toString().includes('async');
}

function isHookFunction(mod) {
  return typeof mod === 'function' && mod.length === 3; // (request, reply, done)
}

console.log('=== CHECKING MODULE TYPES ===');
modules.forEach(name => {
  let mod;
  try {
    mod = require(name);
    const type = typeof mod;
    let recommendation = '';
    if (type === 'function') {
      if (isHookFunction(mod)) {
        recommendation = ' → use app.addHook("onRequest", mod)';
      } else {
        recommendation = ' → safe for app.register(mod)';
      }
    } else if (type === 'object') {
      // check if it has a .plugin or .csrfProtection or .handler
      if (typeof mod.csrfProtection === 'function') {
        recommendation = ' → has csrfProtection hook, use app.addHook("onRequest", mod.csrfProtection)';
      } else if (typeof mod.plugin === 'function') {
        recommendation = ' → has .plugin function, use app.register(mod.plugin)';
      } else if (typeof mod.handler === 'function') {
        recommendation = ' → has .handler hook, use app.addHook("onRequest", mod.handler)';
      } else {
        recommendation = ' → OBJECT with no clear plugin/hook – MANUAL REVIEW';
      }
    } else {
      recommendation = ' → UNKNOWN, review required';
    }
    console.log(`${name}: ${type}${recommendation}`);
  } catch (e) {
    console.log(`${name}: ERROR - ${e.message}`);
  }
});
