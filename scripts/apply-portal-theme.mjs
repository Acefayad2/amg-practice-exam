import fs from 'node:fs';
import path from 'node:path';
const link='<link rel="stylesheet" href="/assets/amg-portal-theme.css" data-amg-portal-theme>';
function walk(directory){ for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())walk(file);else if(entry.name.endsWith('.html')){let html=fs.readFileSync(file,'utf8');if(!html.includes('data-amg-portal-theme'))html=html.replace('</head>',link+'\n</head>');html=html.replace(/<body([^>]*)>/,(_,attrs)=>attrs.includes('amg-reference-theme')?'<body'+attrs+'>':attrs.includes('class=')?'<body'+attrs.replace(/class="([^"]*)"/,'class="$1 amg-reference-theme amg-learning-theme"')+'>':'<body'+attrs+' class="amg-reference-theme amg-learning-theme">');fs.writeFileSync(file,html);}}}
for(const directory of ['public/course','public/login'])if(fs.existsSync(directory))walk(directory);
