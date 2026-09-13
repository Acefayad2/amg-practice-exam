import { build } from 'esbuild';

for (const name of ['account', 'login']) {
  await build({ entryPoints: [`src/course/${name}.js`], outfile: `public/course/shared/${name}.js`, bundle: true, format: 'iife', target: ['es2020'], minify: true, legalComments: 'none' });
}
console.log('Built account and login runtime bundles.');
