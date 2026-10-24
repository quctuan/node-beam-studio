import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));process.chdir(root);
await fs.rm('dist',{recursive:true,force:true});await fs.mkdir('dist',{recursive:true});
await fs.cp('beam-original','dist',{recursive:true});
await fs.rename('dist/index.html','dist/beam.html');
const beamEntry=await fs.readFile('dist/beam.html','utf8');
await fs.writeFile('dist/beam.html',beamEntry.replace('</head>','<script type="module" src="/beam-playback-placement.js"></script></head>'));
for(const name of ['index.html','hub.css','hub.js','brand-mark.svg','beam-playback-placement.js'])await fs.copyFile(name,'dist/'+name);
// Assemble a same-origin motion app, including rebased Markdown and runnable source downloads.
execFileSync('node',['build.mjs'],{cwd:path.join(root,'../motion'),stdio:'inherit'});
const source=JSON.parse(await fs.readFile('../motion/SOURCE-MANIFEST.json','utf8'));
await fs.rm('motion-source',{recursive:true,force:true});await fs.mkdir('motion-source',{recursive:true});
for(const name of Object.keys(source.files)){const dest=path.join('motion-source',name);await fs.mkdir(path.dirname(dest),{recursive:true});let data=await fs.readFile(path.join('../motion',name));if(/\.(?:md|js|mjs|json|html|py|css)$/.test(name))data=Buffer.from(data.toString().replaceAll('https://fiora-node-motion.vercel.app','https://nodeanimation.vercel.app/motion'));await fs.writeFile(dest,data);}
execFileSync('python3',['refresh-motion-ui.py',path.join(root,'motion-source')],{stdio:'inherit'});
execFileSync('node',['build.mjs'],{cwd:path.join(root,'motion-source'),stdio:'inherit'});
await fs.cp('motion-source/dist','dist/motion',{recursive:true});
await fs.writeFile('dist/hub-release.json',JSON.stringify({version:JSON.parse(await fs.readFile('package.json','utf8')).version,beamSource:'production dpl_8JdTFGJarguRcX9XYHzFmoeSX6GB',motionVersion:'1.4.1',tabs:['Node beam','Node motion']},null,2));
console.log('Built unified hub with same-origin beam, motion, Markdown and source ZIP.');

// Standard Vercel Build Output API: preserve the menu, both apps and the preset function.
const projectRoot=path.join(root,'..'),output=path.join(projectRoot,'.vercel/output');
await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});
await fs.cp(path.join(root,'dist'),path.join(output,'static'),{recursive:true});
await fs.cp(path.join(root,'beam-api-original'),path.join(output,'functions/api/shared-default.func'),{recursive:true});
const config={version:3,routes:[{src:'^/$',has:[{type:'query',key:'embedded',value:'beam'}],dest:'/beam.html'},{src:'^/motion/?$',dest:'/motion/index.html'},{handle:'filesystem'},{src:'/(.*)',dest:'/index.html'}]};
await fs.writeFile(path.join(output,'config.json'),JSON.stringify(config));
await fs.rm(path.join(projectRoot,'dist'),{recursive:true,force:true});await fs.cp(path.join(root,'dist'),path.join(projectRoot,'dist'),{recursive:true});
