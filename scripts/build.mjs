import {mkdir,cp,rm,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {APP_VERSION} from '../src/version.js';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.resolve(root,'dist');
if(out!==path.join(root,'dist')||!out.startsWith(root))throw Error('Build target must be this repository/dist');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
const copied=new Map();
async function copy(relative){
 relative=relative.split(path.sep).join('/');if(copied.has(relative))return;
 const file=path.resolve(root,relative);if(!file.startsWith(root))throw Error('Asset outside repository');
 const bytes=await readFile(file);copied.set(relative,{path:relative,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 const destination=path.join(out,relative);await mkdir(path.dirname(destination),{recursive:true});await cp(file,destination);
 if(relative.endsWith('.js'))for(const m of bytes.toString().matchAll(/(?:\bfrom\s*|\bimport\s*)['"](\.[^'"]+)['"]/g))await copy(path.join(path.dirname(relative),m[1]));
}
for(const file of ['index.html','arcade.html','src/full-career-app.js','src/style.css','src/story.css','src/full-career.css','src/art/stadium.svg'])await copy(file);
await writeFile(path.join(out,'.nojekyll'),'');
const files=[...copied.values()].sort((a,b)=>a.path.localeCompare(b.path));
const manifest={project:'Baseball Road',version:APP_VERSION,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceWorkingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim(),content:{semesters:8,storyNodes:56,gameplayPerNewCareer:17,selectablePlayerIdentities:16,sharedEvents:2},saveSchema:1,staticOnly:true,sourceTreeSHA256:createHash('sha256').update(JSON.stringify(files)).digest('hex'),files};
await writeFile(path.join(out,'release.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Static production build v${APP_VERSION}: ${files.length} files + .nojekyll/release.json; no tests, photos, legacy HTML or inactive UI.`);
