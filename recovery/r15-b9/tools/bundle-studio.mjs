import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse,sha} from '../../../tools/ast.mjs';
import {CATALOG} from '../src/catalog.mjs';
import {catalog as art} from '../src/studio/forms.mjs';
const studio=new URL('../src/studio/',import.meta.url);
const order=['renderkit','wave2','wave3','wave4','wave5','wave6','wave7','wave8','wave9','forms'];
export function bundleStudio(){
  const pin=JSON.parse(readFileSync(new URL('author-lock.json',studio)));
  assert.equal(pin.sourceCommit,'7b8e48f6c8c9fbf022e192f9196231f5e641d473');
  assert.deepEqual(Object.keys(pin.files).sort(),order.map(n=>n+'.mjs').sort());
  assert.equal(art.length,56);assert.equal(new Set(art.map(row=>row.id)).size,56);
  assert.deepEqual(art.map(row=>row.id).sort(),CATALOG.map(row=>row.id).sort());
  const found=new Set(),pieces=[];
  for(const name of order){
    const file=name+'.mjs',code=readFileSync(new URL(file,studio),'utf8');
    assert.equal(sha(code),pin.files[file],file+' is not the exact author source');assert.ok(!/<\/script/i.test(code));
    let offset=0,text='';const provided=[];
    for(const statement of parse(code,'module').body){
      const x=statement;
      if(!['ImportDeclaration','ExportNamedDeclaration'].includes(x.type))continue;
      text+=code.slice(offset,x.start);offset=x.end;
      if(x.type==='ImportDeclaration'){
        const key=x.source.value.match(/^\.\/([a-z0-9]+)\.mjs$/)?.[1];
        assert.ok(found.has(key),'Unexpected author import edge '+x.source.value);
        let bindings=[];
        for(const y of x.specifiers){assert.equal(y.type,'ImportSpecifier');assert.equal(y.imported.type,'Identifier');bindings.push(y.imported.name+':'+y.local.name);}
        text+='const {'+bindings.join(',')+'}=vcStudio_'+key+';';continue;
      }
      if(x.source){
        assert.equal(name,'forms');assert.equal(x.source.value,'./renderkit.mjs');assert.equal(x.specifiers.length,1);assert.equal(x.specifiers[0].exported.name,'finishes');
        text+='const {finishes}=vcStudio_renderkit;';provided.push('finishes');continue;
      }
      assert.ok(x.declaration);assert.equal(x.specifiers.length,0);
      text+=code.slice(x.declaration.start,x.declaration.end);
      if(x.declaration.type==='FunctionDeclaration')provided.push(x.declaration.id.name);
      else{assert.equal(x.declaration.type,'VariableDeclaration');for(const v of x.declaration.declarations){assert.equal(v.id.type,'Identifier');provided.push(v.id.name);}}
    }
    found.add(name);text+=code.slice(offset);
    pieces.push('const vcStudio_'+name+'=(()=>{\n'+text+'\nreturn {'+provided.join(',')+'};})();');
  }
  const source='function(){\n'+pieces.join('\n')+'\nreturn vcStudio_forms.createArmoryProp;\n}';
  parse('('+source+')');
  return {source,pin};
}
