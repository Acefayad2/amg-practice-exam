import { build } from 'esbuild';

await build({entryPoints:['netlify/functions/_shared/mock-rotation.mjs'], outfile:'public/course/assessments/assessment-rotation.js', bundle:true, format:'iife', globalName:'AMG_ASSESSMENT_ROTATION', target:['es2020']});
for (const name of ['account', 'login']) {
  await build({ entryPoints: [`src/course/${name}.js`], outfile: `public/course/shared/${name}.js`, bundle: true, format: 'iife', target: ['es2020'], minify: true, legalComments: 'none' });
}
console.log('Built account and login runtime bundles.');
