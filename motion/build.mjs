import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('.', import.meta.url)));
execFileSync('python3',['generate-handoff.py'],{stdio:'inherit'});
await fs.rm('dist',{recursive:true,force:true});
await fs.mkdir('dist',{recursive:true});
for(const p of ['index.html','style.css','app.js','wire-interactions.js','connector-feedback.js','wire-motion.js','motion-spec.json','README.md','DEVELOPER-HANDOFF.md','docs','assets']) {
  await fs.cp(p,'dist/'+p,{recursive:true});
}
execFileSync('python3',['package-source.py'],{stdio:'inherit'});
