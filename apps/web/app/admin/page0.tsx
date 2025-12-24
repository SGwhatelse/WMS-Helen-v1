Last login: Wed Dec 24 21:10:40 on ttys007
➜  ~ >....

      email: 'daniel@dragojlovic.ch',

      password: hash,

      firstName: 'Daniel',

      lastName: 'Dragojlovic',

      role: 'super_admin',

      isActive: true,

    }

  });

  console.log('Created:', user);

}

main();

"
/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:3
`)},"createLog"),x=I(g.bgLightYellow(g.black(" CJS "))),ae=I(g.bgBlue(" ESM ")),oe=[".cts",".mts",".ts",".tsx",".jsx"],ie=[".js",".cjs",".mjs"],k=[".ts",".tsx",".jsx"],F=o((s,e,r,n)=>{const t=Object.getOwnPropertyDescriptor(s,e);t?.set?s[e]=r:(!t||t.configurable)&&Object.defineProperty(s,e,{value:r,enumerable:t?.enumerable||n?.enumerable,writable:n?.writable??(t?t.writable:!0),configurable:n?.configurable??(t?t.configurable:!0)})},"safeSet"),ce=o((s,e,r)=>{const n=e[".js"],t=o((a,i)=>{if(s.enabled===!1)return n(a,i);const[c,f]=i.split("?");if((new URLSearchParams(f).get("namespace")??void 0)!==r)return n(a,i);x(2,"load",{filePath:i}),a.id.startsWith("data:text/javascript,")&&(a.path=m.dirname(c)),R.parent?.send&&R.parent.send({type:"dependency",path:c});const p=oe.some(h=>c.endsWith(h)),P=ie.some(h=>c.endsWith(h));if(!p&&!P)return n(a,c);let d=O.readFileSync(c,"utf8");if(c.endsWith(".cjs")){const h=w.transformDynamicImport(i,d);h&&(d=A()?$(h):h.code)}else if(p||w.isESM(d)){const h=w.transformSync(d,i,{tsconfigRaw:exports.fileMatcher?.(c)});d=A()?$(h):h.code}x(1,"loaded",{filePath:c}),a._compile(d,c)},"transformer");F(e,".js",t);for(const a of k)F(e,a,t,{enumerable:!r,writable:!0,configurable:!0});return F(e,".mjs",t,{writable:!0,configurable:!0}),()=>{e[".js"]===t&&(e[".js"]=n);for(const a of[...k,".mjs"])e[a]===t&&delete e[a]}},"createExtensions"),le=o(s=>e=>{if((e==="."||e===".."||e.endsWith("/.."))&&(e+="/"),_.test(e)){let r=m.join(e,"index.js");e.startsWith("./")&&(r=`./${r}`);try{return s(r)}catch{}}try{return s(e)}catch(r){const n=r;if(n.code==="MODULE_NOT_FOUND")try{return s(`${e}${m.sep}index.js`)}catch{}throw n}},"createImplicitResolver"),B=[".js",".json"],G=[".ts",".tsx",".jsx"],fe=[...G,...B],he=[...B,...G],y=Object.create(null);y[".js"]=[".ts",".tsx",".js",".jsx"],y[".jsx"]=[".tsx",".ts",".jsx",".js"],y[".cjs"]=[".cts"],y[".mjs"]=[".mts"];const X=o(s=>{const e=s.split("?"),r=e[1]?`?${e[1]}`:"",[n]=e,t=m.extname(n),a=[],i=y[t];if(i){const f=n.slice(0,-t.length);a.push(...i.map(l=>f+l+r))}const c=!(s.startsWith(v)||j(n))||n.includes(J)||n.includes("/node_modules/")?he:fe;return a.push(...c.map(f=>n+f+r)),a},"mapTsExtensions"),S=o((s,e,r)=>{if(x(3,"resolveTsFilename",{request:e,isDirectory:_.test(e),isTsParent:r,allowJs:exports.allowJs}),_.test(e)||!r&&!exports.allowJs)return;const n=X(e);if(n)for(const t of n)try{return s(t)}catch(a){const{code:i}=a;if(i!=="MODULE_NOT_FOUND"&&i!=="ERR_PACKAGE_PATH_NOT_EXPORTED")throw a}},"resolveTsFilename"),me=o((s,e)=>r=>{if(x(3,"resolveTsFilename",{request:r,isTsParent:e,isFilePath:j(r)}),j(r)){const n=S(s,r,e);if(n)return n}try{return s(r)}catch(n){const t=n;if(t.code==="MODULE_NOT_FOUND"){if(t.path){const i=t.message.match(/^Cannot find module '([^']+)'$/);if(i){const f=i[1],l=S(s,f,e);if(l)return l}const c=t.message.match(/^Cannot find module '([^']+)'. Please verify that the package.json has a valid "main" entry$/);if(c){const f=c[1],l=S(s,f,e);if(l)return l}}const a=S(s,r,e);if(a)return a}throw t}},"createTsExtensionResolver"),z="at cjsPreparseModuleExports (node:internal",de=o(s=>{const e=s.stack.split(`


Error: Cannot find module 'bcryptjs'
Require stack:
- /Users/daniel/Documents/Dev/HelenWMS/wms-platform/packages/database/[eval]
    at node:internal/modules/cjs/loader:1421:15
    at nextResolveSimple (/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:4:1004)
    at /Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:3:2630
    at /Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:3:1542
    at resolveTsPaths (/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:4:760)
    at /Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:4:1102
    at m._resolveFilename (file:///Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-B7jrtLTO.mjs:1:789)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1059:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1064:22)
    at Module._load (node:internal/modules/cjs/loader:1227:37) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/daniel/Documents/Dev/HelenWMS/wms-platform/packages/database/[eval]'
  ]
}

Node.js v24.12.0
➜  database cd ~/Documents/Dev/HelenWMS/wms-platform/packages/database
npx tsx -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123!', 10);
  const user = await prisma.platformUser.create({
    data: {
      email: 'daniel@just3pl.comh',
      password: hash,
      firstName: 'Danielr',
      lastName: 'Dragojlovic',
      role: 'super_admin',
      isActive: true,
    }
  });
  console.log('Created:', user);
}
main();
"
/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:3
`)},"createLog"),x=I(g.bgLightYellow(g.black(" CJS "))),ae=I(g.bgBlue(" ESM ")),oe=[".cts",".mts",".ts",".tsx",".jsx"],ie=[".js",".cjs",".mjs"],k=[".ts",".tsx",".jsx"],F=o((s,e,r,n)=>{const t=Object.getOwnPropertyDescriptor(s,e);t?.set?s[e]=r:(!t||t.configurable)&&Object.defineProperty(s,e,{value:r,enumerable:t?.enumerable||n?.enumerable,writable:n?.writable??(t?t.writable:!0),configurable:n?.configurable??(t?t.configurable:!0)})},"safeSet"),ce=o((s,e,r)=>{const n=e[".js"],t=o((a,i)=>{if(s.enabled===!1)return n(a,i);const[c,f]=i.split("?");if((new URLSearchParams(f).get("namespace")??void 0)!==r)return n(a,i);x(2,"load",{filePath:i}),a.id.startsWith("data:text/javascript,")&&(a.path=m.dirname(c)),R.parent?.send&&R.parent.send({type:"dependency",path:c});const p=oe.some(h=>c.endsWith(h)),P=ie.some(h=>c.endsWith(h));if(!p&&!P)return n(a,c);let d=O.readFileSync(c,"utf8");if(c.endsWith(".cjs")){const h=w.transformDynamicImport(i,d);h&&(d=A()?$(h):h.code)}else if(p||w.isESM(d)){const h=w.transformSync(d,i,{tsconfigRaw:exports.fileMatcher?.(c)});d=A()?$(h):h.code}x(1,"loaded",{filePath:c}),a._compile(d,c)},"transformer");F(e,".js",t);for(const a of k)F(e,a,t,{enumerable:!r,writable:!0,configurable:!0});return F(e,".mjs",t,{writable:!0,configurable:!0}),()=>{e[".js"]===t&&(e[".js"]=n);for(const a of[...k,".mjs"])e[a]===t&&delete e[a]}},"createExtensions"),le=o(s=>e=>{if((e==="."||e===".."||e.endsWith("/.."))&&(e+="/"),_.test(e)){let r=m.join(e,"index.js");e.startsWith("./")&&(r=`./${r}`);try{return s(r)}catch{}}try{return s(e)}catch(r){const n=r;if(n.code==="MODULE_NOT_FOUND")try{return s(`${e}${m.sep}index.js`)}catch{}throw n}},"createImplicitResolver"),B=[".js",".json"],G=[".ts",".tsx",".jsx"],fe=[...G,...B],he=[...B,...G],y=Object.create(null);y[".js"]=[".ts",".tsx",".js",".jsx"],y[".jsx"]=[".tsx",".ts",".jsx",".js"],y[".cjs"]=[".cts"],y[".mjs"]=[".mts"];const X=o(s=>{const e=s.split("?"),r=e[1]?`?${e[1]}`:"",[n]=e,t=m.extname(n),a=[],i=y[t];if(i){const f=n.slice(0,-t.length);a.push(...i.map(l=>f+l+r))}const c=!(s.startsWith(v)||j(n))||n.includes(J)||n.includes("/node_modules/")?he:fe;return a.push(...c.map(f=>n+f+r)),a},"mapTsExtensions"),S=o((s,e,r)=>{if(x(3,"resolveTsFilename",{request:e,isDirectory:_.test(e),isTsParent:r,allowJs:exports.allowJs}),_.test(e)||!r&&!exports.allowJs)return;const n=X(e);if(n)for(const t of n)try{return s(t)}catch(a){const{code:i}=a;if(i!=="MODULE_NOT_FOUND"&&i!=="ERR_PACKAGE_PATH_NOT_EXPORTED")throw a}},"resolveTsFilename"),me=o((s,e)=>r=>{if(x(3,"resolveTsFilename",{request:r,isTsParent:e,isFilePath:j(r)}),j(r)){const n=S(s,r,e);if(n)return n}try{return s(r)}catch(n){const t=n;if(t.code==="MODULE_NOT_FOUND"){if(t.path){const i=t.message.match(/^Cannot find module '([^']+)'$/);if(i){const f=i[1],l=S(s,f,e);if(l)return l}const c=t.message.match(/^Cannot find module '([^']+)'. Please verify that the package.json has a valid "main" entry$/);if(c){const f=c[1],l=S(s,f,e);if(l)return l}}const a=S(s,r,e);if(a)return a}throw t}},"createTsExtensionResolver"),z="at cjsPreparseModuleExports (node:internal",de=o(s=>{const e=s.stack.split(`


Error: Cannot find module 'bcryptjs'
Require stack:
- /Users/daniel/Documents/Dev/HelenWMS/wms-platform/packages/database/[eval]
    at node:internal/modules/cjs/loader:1421:15
    at nextResolveSimple (/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:4:1004)
    at /Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:3:2630
    at /Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:3:1542
    at resolveTsPaths (/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:4:760)
    at /Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-D46fvsV_.cjs:4:1102
    at m._resolveFilename (file:///Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/register-B7jrtLTO.mjs:1:789)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1059:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1064:22)
    at Module._load (node:internal/modules/cjs/loader:1227:37) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/daniel/Documents/Dev/HelenWMS/wms-platform/packages/database/[eval]'
  ]
}

Node.js v24.12.0
➜  database cd ~/Documents/Dev/HelenWMS/wms-platform/packages/database
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash('Admin123!', 10);
  const user = await prisma.platformUser.create({
    data: {
      email: 'admin@just3pl.ch',
      password: hash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      isActive: true,
    }
  });
  console.log('Created:', user);
  process.exit(0);
})();
"
node:internal/modules/cjs/loader:1424
  throw err;
  ^

Error: Cannot find module 'bcryptjs'
Require stack:
- /Users/daniel/Documents/Dev/HelenWMS/wms-platform/packages/database/[eval]
    at Module._resolveFilename (node:internal/modules/cjs/loader:1421:15)
    at defaultResolveImpl (node:internal/modules/cjs/loader:1059:19)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1064:22)
    at Module._load (node:internal/modules/cjs/loader:1227:37)
    at TracingChannel.traceSync (node:diagnostics_channel:328:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:245:24)
    at Module.require (node:internal/modules/cjs/loader:1504:12)
    at require (node:internal/modules/helpers:152:16)
    at [eval]:2:16
    at runScriptInThisContext (node:internal/vm:219:10) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/Users/daniel/Documents/Dev/HelenWMS/wms-platform/packages/database/[eval]'
  ]
}

Node.js v24.12.0
➜  database cd ~/Documents/Dev/HelenWMS/wms-platform
pnpm add bcryptjs -w
 WARN  `node_modules` is present. Lockfile only installation will make it out-of-date
 WARN  6 deprecated subdependencies found: are-we-there-yet@2.0.0, gauge@3.0.2, glob@7.2.3, inflight@1.0.6, npmlog@5.0.1, rimraf@3.0.2
Progress: resolved 419, reused 0, downloaded 0, added 0, done

dependencies:
+ bcryptjs ^3.0.3

Packages: +1
+
Done in 1.6s
➜  wms-platform cd ~/Documents/Dev/HelenWMS/wms-platform/packages/database
npx tsx -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Admin123!', 10);
  const user = await prisma.platformUser.create({
    data: {
      email: 'daniel@just3pl.comh',
      password: hash,
  UW PICO 5.09                           New Buffer





















                               [ Read 280 lines ]
^G Get Help  ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos
^X Exit      ^J Justify   ^W Where is  ^V Next Pg   ^U UnCut Text^T To Spell
      firstName: 'Danielr',
      lastName: 'Dragojlovic',
      role: 'super_admin',
      isActive: true,
    }
  });
  console.log('Created:', user);
}
main();
"
Created: {
  id: '232ff975-a3fb-4ee6-a048-9f29e679b312',
  email: 'daniel@just3pl.comh',
  password: '$2b$10$F1ieWxz13X.PrRJrTVeYmu19lzc60v7tIQmHy428rOx.JXOKhqcH2',
  firstName: 'Danielr',
  lastName: 'Dragojlovic',
  role: 'super_admin',
  isActive: true,
  lastLoginAt: null,
  createdAt: 2025-12-24T20:15:01.466Z,
  updatedAt: 2025-12-24T20:15:01.466Z
}
➜  database nano ~/Documents/Dev/HelenWMS/wms-platform/apps/api/src/routes/auth.ts
➜  database curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@just3pl.ch","password":"Admin123!"}'
{"error":"Invalid credentials"}%
➜  database curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"daniel@just3pl.com","password":"Admin123!"}'
{"error":"Invalid credentials"}%
➜  database cd ~/Documents/Dev/HelenWMS/wms-platform/packages/database
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash('admin123!', 10);
  const user = await prisma.platformUser.update({
    where: { email: 'daniel@just3pl.com' },
    data: { password: hash }
  });
  console.log('Updated:', user.email);
  process.exit(0);
})();
"
/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/@prisma+client@6.19.1_prisma@6.19.1_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/library.js:121
`)}var So=({clientMethod:e,activeProvider:r})=>t=>{let n="",i;if(Vn(t))n=t.sql,i={values:Wr(t.values),__prismaRawParameters__:!0};else if(Array.isArray(t)){let[o,...s]=t;n=o,i={values:Wr(s||[]),__prismaRawParameters__:!0}}else switch(r){case"sqlite":case"mysql":{n=t.sql,i={values:Wr(t.values),__prismaRawParameters__:!0};break}case"cockroachdb":case"postgresql":case"postgres":{n=t.text,i={values:Wr(t.values),__prismaRawParameters__:!0};break}case"sqlserver":{n=Vl(t),i={values:Wr(t.values),__prismaRawParameters__:!0};break}default:throw new Error(`The ${r} provider does not support ${e}`)}return i?.values?Ql(`prisma.${e}(${n}, ${i.values})`):Ql(`prisma.${e}(${n})`),{query:n,parameters:i}},Wl={requestArgsToMiddlewareArgs(e){return[e.strings,...e.values]},middlewareArgsToRequestArgs(e){let[r,...t]=e;return new ie(r,t)}},Jl={requestArgsToMiddlewareArgs(e){return[e]},middlewareArgsToRequestArgs(e){return e[0]}};function Ro(e){return function(t,n){let i,o=(s=e)=>{try{return s===void 0||s?.kind==="itx"?i??=Kl(t(s)):Kl(t(s))}catch(a){return Promise.reject(a)}};return{get spec(){return n},then(s,a){return o().then(s,a)},catch(s){return o().catch(s)},finally(s){return o().finally(s)},requestTransaction(s){let a=o(s);return a.requestTransaction?a.requestTransaction(s):a},[Symbol.toStringTag]:"PrismaPromise"}}}function Kl(e){return typeof e.then=="function"?e:Promise.resolve(e)}var Tf=xi.split(".")[0],Sf={isEnabled(){return!1},getTraceParent(){return"00-10-10-00"},dispatchEngineSpans(){},getActiveContext(){},runInChildSpan(e,r){return r()}},Ao=class{isEnabled(){return this.getGlobalTracingHelper().isEnabled()}getTraceParent(r){return this.getGlobalTracingHelper().getTraceParent(r)}dispatchEngineSpans(r){return this.getGlobalTracingHelper().dispatchEngineSpans(r)}getActiveContext(){return this.getGlobalTracingHelper().getActiveContext()}runInChildSpan(r,t){return this.getGlobalTracingHelper().runInChildSpan(r,t)}getGlobalTracingHelper(){let r=globalThis[`V${Tf}_PRISMA_INSTRUMENTATION`],t=globalThis.PRISMA_INSTRUMENTATION;return r?.helper??t?.helper??Sf}};function Hl(){return new Ao}function Yl(e,r=()=>{}){let t,n=new Promise(i=>t=i);return{then(i){return--e===0&&t(r()),i?.(n)}}}function zl(e){return typeof e=="string"?e:e.reduce((r,t)=>{let n=typeof t=="string"?t:t.level;return n==="query"?r:r&&(t==="info"||r==="info")?"info":n},void 0)}function zn(e){return typeof e.batchRequestIdx=="number"}function Zl(e){if(e.action!=="findUnique"&&e.action!=="findUniqueOrThrow")return;let r=[];return e.modelName&&r.push(e.modelName),e.query.arguments&&r.push(Co(e.query.arguments)),r.push(Co(e.query.selection)),r.join("")}function Co(e){return`(${Object.keys(e).sort().map(t=>{let n=e[t];return typeof n=="object"&&n!==null?`(${t} ${Co(n)})`:t}).join(" ")})`}var Rf={aggregate:!1,aggregateRaw:!1,createMany:!0,createManyAndReturn:!0,createOne:!0,deleteMany:!0,deleteOne:!0,executeRaw:!0,findFirst:!1,findFirstOrThrow:!1,findMany:!1,findRaw:!1,findUnique:!1,findUniqueOrThrow:!1,groupBy:!1,queryRaw:!1,runCommandRaw:!0,updateMany:!0,updateManyAndReturn:!0,updateOne:!0,upsertOne:!0};function Io(e){return Rf[e]}var Zn=class{constructor(r){this.options=r;this.batches={}}batches;tickActive=!1;request(r){let t=this.options.batchBy(r);return t?(this.batches[t]||(this.batches[t]=[],this.tickActive||(this.tickActive=!0,process.nextTick(()=>{this.dispatchBatches(),this.tickActive=!1}))),new Promise((n,i)=>{this.batches[t].push({request:r,resolve:n,reject:i})})):this.options.singleLoader(r)}dispatchBatches(){for(let r in this.batches){let t=this.batches[r];delete this.batches[r],t.length===1?this.options.singleLoader(t[0].request).then(n=>{n instanceof Error?t[0].reject(n):t[0].resolve(n)}).catch(n=>{t[0].reject(n)}):(t.sort((n,i)=>this.options.batchOrder(n.request,i.request)),this.options.batchLoader(t.map(n=>n.request)).then(n=>{if(n instanceof Error)for(let i=0;i<t.length;i++)t[i].reject(n);else for(let i=0;i<t.length;i++){let o=n[i];o instanceof Error?t[i].reject(o):t[i].resolve(o)}}).catch(n=>{for(let i=0;i<t.length;i++)t[i].reject(n)}))}}get[Symbol.toStringTag](){return"DataLoader"}};function mr(e,r){if(r===null)return r;switch(e){case"bigint":return BigInt(r);case"bytes":{let{buffer:t,byteOffset:n,byteLength:i}=Buffer.from(r,"base64");return new Uint8Array(t,n,i)}case"decimal":return new Fe(r);case"datetime":case"date":return new Date(r);case"time":return new Date(`1970-01-01T${r}Z`);case"bigint-array":return r.map(t=>mr("bigint",t));case"bytes-array":return r.map(t=>mr("bytes",t));case"decimal-array":return r.map(t=>mr("decimal",t));case"datetime-array":return r.map(t=>mr("datetime",t));case"date-array":return r.map(t=>mr("date",t));case"time-array":return r.map(t=>mr("time",t));default:return r}}function Xn(e){let r=[],t=Af(e);for(let n=0;n<e.rows.length;n++){let i=e.rows[n],o={...t};for(let s=0;s<i.length;s++)o[e.columns[s]]=mr(e.types[s],i[s]);r.push(o)}return r}function Af(e){let r={};for(let t=0;t<e.columns.length;t++)r[e.columns[t]]=null;return r}var Cf=N("prisma:client:request_handler"),ei=class{client;dataloader;logEmitter;constructor(r,t){this.logEmitter=t,this.client=r,this.dataloader=new Zn({batchLoader:rl(async({requests:n,customDataProxyFetch:i})=>{let{transaction:o,otelParentCtx:s}=n[0],a=n.map(p=>p.protocolQuery),l=this.client._tracingHelper.getTraceParent(s),u=n.some(p=>Io(p.protocolQuery.action));return(await this.client._engine.requestBatch(a,{traceparent:l,transaction:If(o),containsWrite:u,customDataProxyFetch:i})).map((p,d)=>{if(p instanceof Error)return p;try{return this.mapQueryEngineResult(n[d],p)}catch(f){return f}})}),singleLoader:async n=>{let i=n.transaction?.kind==="itx"?Xl(n.transaction):void 0,o=await this.client._engine.request(n.protocolQuery,{traceparent:this.client._tracingHelper.getTraceParent(),interactiveTransaction:i,isWrite:Io(n.protocolQuery.action),customDataProxyFetch:n.customDataProxyFetch});return this.mapQueryEngineResult(n,o)},batchBy:n=>n.transaction?.id?`transaction-${n.transaction.id}`:Zl(n.protocolQuery),batchOrder(n,i){return n.transaction?.kind==="batch"&&i.transaction?.kind==="batch"?n.transaction.index-i.transaction.index:0}})}async request(r){try{return await this.dataloader.request(r)}catch(t){let{clientMethod:n,callsite:i,transaction:o,args:s,modelName:a}=r;this.handleAndLogRequestError({error:t,clientMethod:n,callsite:i,transaction:o,args:s,modelName:a,globalOmit:r.globalOmit})}}mapQueryEngineResult({dataPath:r,unpacker:t},n){let i=n?.data,o=this.unpack(i,r,t);return process.env.PRISMA_CLIENT_GET_TIME?{data:o}:o}handleAndLogRequestError(r){try{this.handleRequestError(r)}catch(t){throw this.logEmitter&&this.logEmitter.emit("error",{message:t.message,target:r.clientMethod,timestamp:new Date}),t}}handleRequestError({error:r,clientMethod:t,callsite:n,transaction:i,args:o,modelName:s,globalOmit:a}){if(Cf(r),Df(r,i))throw r;if(r instanceof z&&Of(r)){let u=eu(r.meta);Nn({args:o,errors:[u],callsite:n,errorFormat:this.client._errorFormat,originalMethod:t,clientVersion:this.client._clientVersion,globalOmit:a})}let l=r.message;if(n&&(l=Tn({callsite:n,originalMethod:t,isPanic:r.isPanic,showColors:this.client._errorFormat==="pretty",message:l})),l=this.sanitizeMessage(l),r.code){let u=s?{modelName:s,...r.meta}:r.meta;throw new z(l,{code:r.code,clientVersion:this.client._clientVersion,meta:u,batchRequestIdx:r.batchRequestIdx})}else{if(r.isPanic)throw new ae(l,this.client._clientVersion);if(r instanceof V)throw new V(l,{clientVersion:this.client._clientVersion,batchRequestIdx:r.batchRequestIdx});if(r instanceof P)throw new P(l,this.client._clientVersion);if(r instanceof ae)throw new ae(l,this.client._clientVersion)}throw r.clientVersion=this.client._clientVersion,r}sanitizeMessage(r){return this.client._errorFormat&&this.client._errorFormat!=="pretty"?wr(r):r}unpack(r,t,n){if(!r||(r.data&&(r=r.data),!r))return r;let i=Object.keys(r)[0],o=Object.values(r)[0],s=t.filter(u=>u!=="select"&&u!=="include"),a=ao(o,s),l=i==="queryRaw"?Xn(a):Vr(a);return n?n(l):l}get[Symbol.toStringTag](){return"RequestHandler"}};function If(e){if(e){if(e.kind==="batch")return{kind:"batch",options:{isolationLevel:e.isolationLevel}};if(e.kind==="itx")return{kind:"itx",options:Xl(e)};ar(e,"Unknown transaction kind")}}function Xl(e){return{id:e.id,payload:e.payload}}function Df(e,r){return zn(e)&&r?.kind==="batch"&&e.batchRequestIdx!==r.index}function Of(e){return e.code==="P2009"||e.code==="P2012"}function eu(e){if(e.kind==="Union")return{kind:"Union",errors:e.errors.map(eu)};if(Array.isArray(e.selectionPath)){let[,...r]=e.selectionPath;return{...e,selectionPath:r}}return e}var ru=xl;var su=O(Ki());var _=class extends Error{constructor(r){super(r+`


PrismaClientKnownRequestError:
Invalid `prisma.platformUser.update()` invocation:


An operation failed because it depends on one or more records that were required but not found. No record was found for an update.
    at ei.handleRequestError (/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/@prisma+client@6.19.1_prisma@6.19.1_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/library.js:121:7268)
    at ei.handleAndLogRequestError (/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/@prisma+client@6.19.1_prisma@6.19.1_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/library.js:121:6593)
    at ei.request (/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/@prisma+client@6.19.1_prisma@6.19.1_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/library.js:121:6300)
    at async a (/Users/daniel/Documents/Dev/HelenWMS/wms-platform/node_modules/.pnpm/@prisma+client@6.19.1_prisma@6.19.1_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client/runtime/library.js:130:9551)
    at async [eval]:8:16 {
  code: 'P2025',
  meta: {
    modelName: 'PlatformUser',
    cause: 'No record was found for an update.'
  },
  clientVersion: '6.19.1'
}

Node.js v24.12.0
➜  database cd ~/Documents/Dev/HelenWMS/wms-platform/packages/database
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const users = await prisma.platformUser.findMany();
  console.log('PlatformUsers:', users);
  process.exit(0);
})();
"
PlatformUsers: [
  {
    id: '0fedfd38-17a3-491f-ad79-fa198c2b2981',
    email: 'admin@wms.local',
    password: '$2b$12$0GiwYZ6.C9RUSruSxqkfoOJaOlG2yZ/hk2gxTaTI1dNNJ6HovE8B.',
    firstName: 'Platform',
    lastName: 'Admin',
    role: 'super_admin',
    isActive: true,
    lastLoginAt: null,
    createdAt: 2025-12-23T22:27:11.004Z,
    updatedAt: 2025-12-23T22:27:11.004Z
  },
  {
    id: '232ff975-a3fb-4ee6-a048-9f29e679b312',
    email: 'daniel@just3pl.comh',
    password: '$2b$10$F1ieWxz13X.PrRJrTVeYmu19lzc60v7tIQmHy428rOx.JXOKhqcH2',
    firstName: 'Daniel',
    lastName: 'Dragojlovic',
    role: 'super_admin',
    isActive: true,
    lastLoginAt: null,
    createdAt: 2025-12-24T20:15:01.466Z,
    updatedAt: 2025-12-24T20:15:19.275Z
  }
]
➜  database cd ~/Documents/Dev/HelenWMS/wms-platform/packages/database
node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash('admin123!', 10);
  const user = await prisma.platformUser.update({
    where: { email: 'daniel@just3pl.comh' },
    data: {
      email: 'daniel@just3pl.com',
      password: hash
  UW PICO 5.09                           New Buffer





















                                  [ New file ]
^G Get Help  ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos
^X Exit      ^J Justify   ^W Where is  ^V Next Pg   ^U UnCut Text^T To Spell
    }
  });
  UW PICO 5.09                           New Buffer





















                                  [ New file ]
^G Get Help  ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos
^X Exit      ^J Justify   ^W Where is  ^V Next Pg   ^U UnCut Text^T To Spell
  console.log('Updated:', user.email);
  process.exit(0);
  UW PICO 5.09                           New Buffer





















                                  [ New file ]
^G Get Help  ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos
^X Exit      ^J Justify   ^W Where is  ^V Next Pg   ^U UnCut Text^T To Spell
})();
"
  UW PICO 5.09                           New Buffer





















                               [ Read 149 lines ]
^G Get Help  ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos
^X Exit      ^J Justify   ^W Where is  ^V Next Pg   ^U UnCut Text^T To Spell
...niel/Documents/Dev/HelenWMS/wms-platform/apps/web/app/admin/page.tsx Modified


import { useEffect, useState } from 'react'
import { Building2, Package, ShoppingCart, RotateCcw, Truck, TrendingUp } from $

type Stats = {
  tenants: { total: number; active: number }
  products: number
  orders: number
  returns: number
  pendingWros: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard/stats', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {

^G Get Help  ^O WriteOut  ^R Read File ^Y Prev Pg   ^K Cut Text  ^C Cur Pos
^X Exit      ^J Justify   ^W Where is  ^V Next Pg   ^U UnCut Text^T To Spell
