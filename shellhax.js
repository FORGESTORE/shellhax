javascript:(function main(){/* Shellhax v3.0 - Shell Shockers aimbot + ESP bookmarklet (gameplay-only). Derived from "Shell Shockers Aimbot + ESP" v2.5 by caringjellyemu (greasyfork 578477, GPL-3.0-only), itself derived from onlypuppy7's LibertyMutualV1. GPL-3.0-only. v3.0: named wrapper so main.toString() resolves; regex-literal newline removed; no document.write/open/close and no about:blank popup - the live tab is replayed in place through the DOM; bundle patches are regex-tolerant; per-frame callback driven by a Babylon prototype hook; UI isolated in the bubble phase and styled with inline style objects. */
var VERSION='3.0';
var PCT=String.fromCharCode(37),HASH=String.fromCharCode(35),BT=String.fromCharCode(96);
var CB='__ssh_cb',CAP='__ssh_cap',FIRE='__ssh_fire',ITEMHOOK='ssh_onItemSpawn',COLLHOOK='ssh_onItemCollect';
var SETTINGS_KEY='ssh_settings_v1';
var BABYLON_URL='https://cdn.jsdelivr.net/npm/babylonjs@7.15.0/babylon.min.js';
var BUNDLE_RE=/^\s*(\(\s*\(\s*\)\s*=>|\(\s*function|!\s*function)/;
var SRC=main.toString();
var H={};
function log(){try{var a=Array.prototype.slice.call(arguments);a.unshift(PCT+'cShellhax');a.splice(1,0,'color:rgb(0,0,0);background:rgb(255,255,0);padding:2px 6px;border-radius:4px');console.log.apply(console,a);}catch(e){}}
function nowMs(){return (typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();}
function reEsc(s){return String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

var DEFAULTS={x:'Fh',y:'Qh',z:'Th',dz:'dz',yaw:'Eh',pitch:'$h',coords:'aa',uniqueId:'IZ',playing:'Gh',actor:'eh',mesh:'mesh',weapon:'Ah',renderingGroupId:'renderingGroupId',SCENE:'eI',PLAYERS:'rI',CULL:'Xw',items:'kr',stateBuffer:'stateBuffer',rayCollidesWithMap:'projectileCollidesWithCell',RAYS:'RAYS'};

function extractKeys(js){
  var out={},k;
  for(k in DEFAULTS)out[k]=DEFAULTS[k];
  for(k in H)if(out[k]===undefined)out[k]=H[k];
  try{
    var m;
    m=/\(([a-zA-Z_$0-9]+)\.([a-zA-Z_$0-9]+)=e\.yaw,\1\.([a-zA-Z_$0-9]+)=e\.pitch,\1\.([a-zA-Z_$0-9]+)=e\.coords\)/.exec(js);
    if(m){out.yaw=m[2];out.pitch=m[3];out.coords=m[4];}
    m=/([a-zA-Z_$0-9]+)\.render\(\),[a-zA-Z_$0-9]+\.render\(\)\}\)/.exec(js);
    if(m)out.SCENE=m[1];
    m=/for\s*\(\s*(?:var|let|const)\s+\w+=0;\w+<([a-zA-Z_$0-9]+);\w+\+\+\)\s*\{\s*(?:var|let|const)\s+\w+=([a-zA-Z_$0-9]+)\[\w+\];\s*\w+&&\w+\.([a-zA-Z_$0-9]+)&&/.exec(js);
    if(m){out.PLAYERS=m[1];out.playing=m[2];}
    m=/posX:[a-zA-Z_$0-9]+\.([a-zA-Z_$0-9]+),posY:[a-zA-Z_$0-9]+\.([a-zA-Z_$0-9]+),posZ:[a-zA-Z_$0-9]+\.([a-zA-Z_$0-9]+)/.exec(js);
    if(m){out.x=m[1];out.y=m[2];out.z=m[3];}
    m=/actorX:[a-zA-Z_$0-9]+\.([a-zA-Z_$0-9]+)\.([a-zA-Z_$0-9]+)/.exec(js);
    if(m){out.actor=m[1];out.mesh=m[2];}
    m=/([a-zA-Z_$0-9]+)\.spawnItem\([a-zA-Z$0-9]+,[a-zA-Z0-9]+,[a-zA-Z0-9]+,[a-zA-Z0-9]+,[a-zA-Z0-9]+;break;/.exec(js);
    if(m)out.items=m[1];
    m=/([a-zA-Z_$0-9]+)\.([a-zA-Z_$0-9]+)\([^;]{0,140}\?\.projectileCollidesWithCell\)/.exec(js);
    if(m){out.RAYS=m[1];out.rayCollidesWithMap=m[2];}
  }catch(e){log('key extraction error',e);}
  return out;
}

function patchBundle(js){
  if(js.indexOf(CB)!==-1){H=extractKeys(js);return js;}
  var K=extractKeys(js),fields=[],k;
  for(k in K)fields.push(k+':(function(){try{return '+K[k]+'}catch(_){return null}})()');
  var cands=[],seen={};
  function add(n){if(n&&!seen[n]){seen[n]=1;cands.push(n);}}
  add(K.SCENE);add(DEFAULTS.SCENE);
  var re=/([a-zA-Z_$0-9]+)\.render\(/g,m2;
  while((m2=re.exec(js)))add(m2[1]);
  var hit=null,i;
  for(i=0;i<cands.length;i++){if(js.indexOf(cands[i]+'.render(')!==-1){hit=cands[i];break;}}
  if(!hit){log('WARN: no .render() call found - not the bundle?');return null;}
  K.SCENE=hit;
  var fieldStr=fields.join(',');
  js=js.replace(new RegExp(reEsc(hit)+'\\.render\\('),function(){
    return 'window.'+CAP+'&&window.'+CAP+'({'+fieldStr+'}),'+hit+'.render(';
  });
  H=K;log('render var-capture hook placed on',hit);
  var before=js;
  js=js.replace(new RegExp('\\{if\\s*\\(\\s*'+reEsc(K.CULL)+'\\s*\\)'),function(){return '{if(true)';});
  log((js===before?'WARN: cull patch MISSED':'cull patch ok'),K.CULL);
  before=js;
  js=js.replace(/((?:\.prototype\.spawnItem\s*=\s*function|\bspawnItem)\s*\(([a-zA-Z_$0-9]+)\s*,\s*([a-zA-Z_$0-9]+)\s*,\s*([a-zA-Z_$0-9]+)\s*(?:,\s*[a-zA-Z_$0-9]+\s*)*\)\s*\{\s*var\s+([a-zA-Z_$0-9]+)\s*=\s*this\.pools\[\3\]\.retrieve\(\2\);)/,
    function(all,g1,g2,g3,g4,g5){return g1+'window.'+ITEMHOOK+'&&window.'+ITEMHOOK+'('+g5+','+g2+');';});
  log(js===before?'WARN: spawnItem patch MISSED':'spawnItem patch ok');
  before=js;
  js=js.replace(/((?:\.prototype\.collectItem\s*=\s*function|\bcollectItem)\s*\(([a-zA-Z_$0-9]+)\s*,\s*([a-zA-Z_$0-9]+)\s*(?:,\s*[a-zA-Z_$0-9]+\s*)*\)\s*\{\s*var\s+([a-zA-Z_$0-9]+)\s*=\s*this\.pools\[\2\];)/,
    function(all,g1,g2,g3,g4){return g1+'window.'+COLLHOOK+'&&window.'+COLLHOOK+'('+g2+','+g4+');';});
  log(js===before?'WARN: collectItem patch MISSED':'collectItem patch ok');
  before=js;
  js=js.replace(/(inventory\s*\.id\s*===\s*[a-zA-Z$_][a-zA-Z_$0-9]*\.id\)\s*return!0;return!1)/,function(m){return m+'||window.ssh_skinUnlock';});
  log(js===before?'WARN: skin-unlock patch MISSED':'skin-unlock patch ok');
  return js;
}

function patchHtml(html){
  var out={patched:false,html:html};
  out.html=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,function(full,attrs,body){
    if(out.patched||!body||!BUNDLE_RE.test(body))return full;
    var cand=patchBundle(body);
    if(!cand)return full;
    out.patched=true;
    return '<script'+attrs+'>'+cand+'<\/script>';
  });
  return out;
}

function patchExternal(html){
  var tags=[],re=/<script\b([^>]*?)\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))([^>]*)>/gi,m;
  while((m=re.exec(html))){
    var src=m[3]||m[4]||m[5];
    if(!src)continue;
    var abs;try{abs=new URL(src,location.href).href;}catch(e){continue;}
    try{if(abs.indexOf(location.origin+'/')!==0)continue;}catch(e){}
    tags.push({full:m[0],attrs:(m[1]||'')+' '+(m[6]||''),abs:abs});
  }
  if(!tags.length)return Promise.resolve({patched:false,html:html});
  var uniq=[],seen={},i;
  for(i=0;i<tags.length;i++){if(!seen[tags[i].abs]){seen[tags[i].abs]=1;uniq.push(tags[i].abs);}}
  var jobs=[];
  for(i=0;i<uniq.length&&i<12;i++){
    jobs.push(fetch(uniq[i],{cache:'no-store'}).then(function(r){return r.text();}).catch(function(){return '';}));
  }
  return Promise.all(jobs).then(function(texts){
    for(var j=0;j<texts.length;j++){
      var t=texts[j];
      if(!t||t.indexOf('projectileCollidesWithCell')===-1||t.indexOf('spawnItem')===-1)continue;
      var cand=patchBundle(t);if(!cand)continue;
      var abs=uniq[j],out=html;
      for(var k=0;k<tags.length;k++){
        if(tags[k].abs!==abs)continue;
        var attrs=tags[k].attrs||'',code=cand;
        if(/type\s*=\s*["']?module/i.test(attrs)){
          code=code.replace(/(\bfrom\s*|\bimport\s*\(\s*)(["'])(\.{1,2}\/[^"']*)\2/g,function(all,pre,q,spec){return pre+q+new URL(spec,abs).href+q;});
        }
        if(/[^a-z]defer([^a-z]|$)/i.test(attrs))code='document.addEventListener("DOMContentLoaded",function(){'+code+'});';
        var full=tags[k].full;
        out=out.replace(full,function(){return '<script'+attrs+'>'+code+'<\/script>';});
      }
      return {patched:true,html:out};
    }
    return {patched:false,html:html};
  });
}

/* ---------- DOM replay (replaces document.write) ---------- */
function collectScripts(root){
  var out=[];
  if(!root)return out;
  var kids=root.childNodes;
  for(var i=0;i<kids.length;i++){var n=kids[i];if(n.nodeType===1&&n.tagName==='SCRIPT')out.push(n);}
  return out;
}
function copyStatic(from,to){
  if(!from||!to)return;
  var kids=from.childNodes;
  for(var i=0;i<kids.length;i++){
    var n=kids[i];
    if(n.nodeType===1&&n.tagName==='SCRIPT')continue;
    try{to.appendChild(document.importNode(n,true));}catch(e){}
  }
}
function runScripts(list,done){
  var i=0;
  function step(){
    if(i>=list.length){done();return;}
    var srcNode=list[i++];
    var s=document.createElement('script'),attrs=srcNode.attributes,j;
    for(j=0;j<attrs.length;j++){try{s.setAttribute(attrs[j].name,attrs[j].value);}catch(e){}}
    var abs=srcNode.getAttribute('src');
    if(abs){
      try{abs=new URL(abs,location.href).href;}catch(e){}
      if(/babylon/i.test(abs)&&typeof BABYLON!=='undefined'){step();return;}
      if(String(s.type||'').indexOf('module')!==-1){abs+=(abs.indexOf('?')===-1?'?':'&')+'ssh=1';}
      s.src=abs;
      s.onload=function(){step();};
      s.onerror=function(){log('script load failed',abs);step();};
      document.head.appendChild(s);
    }else{
      s.text=srcNode.text;
      document.head.appendChild(s);
      step();
    }
  }
  step();
}
function replacePage(html){
  var doc;
  try{doc=new DOMParser().parseFromString(html,'text/html');}catch(e){log('page parse failed',e);return false;}
  if(!doc||!doc.body)return false;
  var headScripts=collectScripts(doc.head||doc.documentElement);
  var bodyScripts=collectScripts(doc.body);
  try{
    var ha=doc.documentElement.attributes;
    for(var ai=0;ai<ha.length;ai++){document.documentElement.setAttribute(ha[ai].name,ha[ai].value);}
  }catch(e){}
  document.head.innerHTML='';
  document.body.innerHTML='';
  copyStatic(doc.head||doc.documentElement,document.head);
  runScripts(headScripts,function(){
    copyStatic(doc.body,document.body);
    runScripts(bodyScripts,function(){
      try{document.dispatchEvent(new Event('DOMContentLoaded',{bubbles:true}));}catch(e){}
      try{window.dispatchEvent(new Event('load'));}catch(e){}
      resetRuntime();
      buildMenu();
      log('live tab replayed in place (no document.write)');
    });
  });
  return true;
}
function reinject(){
  try{
    var s=document.createElement('script');
    s.setAttribute('data-ssh','1');
    s.text='('+SRC+')()';
    document.head.appendChild(s);
  }catch(e){}
}
function ensureBabylon(cb){
  if(typeof BABYLON!=='undefined'){cb();return;}
  var s=document.createElement('script');
  s.setAttribute('data-ssh','1');
  s.src=BABYLON_URL;
  s.onload=function(){log('babylon loaded');cb();};
  s.onerror=function(){log('babylon load failed');cb();};
  document.head.appendChild(s);
}
function hookSceneRender(){
  try{
    if(typeof BABYLON==='undefined'||!BABYLON.Scene||!BABYLON.Scene.prototype)return;
    if(BABYLON.Scene.prototype[CB+'_hooked'])return;
    BABYLON.Scene.prototype[CB+'_hooked']=true;
    var orig=BABYLON.Scene.prototype.render;
    BABYLON.Scene.prototype.render=function(){
      try{var v=ss._vars||{};v.SCENE=this;if(window[CB])window[CB](v);}catch(e){}
      return orig.apply(this,arguments);
    };
    log('scene render prototype hook installed');
  }catch(e){}
}

/* ---------- state ---------- */
var settings={};
var DEFAULT_SETTINGS={
  menuVisible:true,menuLeft:12,menuTop:12,
  aimEnabled:true,aimRequireRMB:true,aimSmooth:true,aimTeams:true,aimFov:15,aimMinDist:2,aimMaxDist:300,aimMode:'dist',aimLowHp:40,
  predictionEnabled:true,silentEnabled:true,silentRequireRMB:true,silentRestore:true,chatEnabled:true,
  espEnabled:true,espMode:'all',boxColor:'ff3b3b',boxMode:'fixed',teamColor:'3b82f6',deadColor:'9ca3af',
  labelEnabled:true,labelColor:'ffffff',labelShowKd:false,nameMode:'name',
  boundsEnabled:false,boundsMode:'head',boundsColor:'00ffff',
  tracerEnabled:false,tracerColor:'ffffff',espOcclusion:false,espLocal:false,
  itemEnabled:true,itemColor:'4ade80',itemLabels:true,itemTtl:5000,
  autoChatEnabled:false,autoChatText:'gg',autoChatDelay:4000,
  unlockSkins:false,bloomDebug:false,mouseSensitivity:1
};
function loadSettings(){settings=Object.assign({},DEFAULT_SETTINGS);try{var raw=localStorage.getItem(SETTINGS_KEY);if(raw)Object.assign(settings,JSON.parse(raw));}catch(e){}}
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch(e){}try{window.ssh_skinUnlock=!!settings.unlockSkins;}catch(e){}}

var ss={};
var _aim={lastInput:null,me:null,silentTarget:null,hasLock:false,smoothTarget:null,errLogged:false,rmbDown:false};
var _silentTarget=null,_frame=0,_lastItemScan=0,_lastChatCheck=0,_mouseParamsId=null,_meMethod='ws';
var _warnPlayers=false,_warnMe=false,_liveLogged=false,_keyWarned=false;
var _cam=null,_color3Cache=new Map(),_espRed=null,_espAmmo=null,_espGren=null;
var _espPlayers=new Map(),_prevPos=new Map(),itemMarkers=new Map();
var MAX_ESP_PLAYERS=32;
var namedPointerListener=null,realPointerListener=null;

function _mod(a,b){return ((a%b)+b)%b;}
function radianDiff(a,b){return _mod(a-b+Math.PI,Math.PI*2)-Math.PI;}
function _setPrecision(o){
  try{
    if(!o)return;
    if(typeof o[H.yaw]==='number')o[H.yaw]=_mod(o[H.yaw]+Math.PI,Math.PI*2)-Math.PI;
    if(typeof o[H.pitch]==='number')o[H.pitch]=Math.max(-Math.PI/2,Math.min(Math.PI/2,o[H.pitch]));
  }catch(e){}
}
function _calcYaw(w){
  if(!w)return 0;
  if(typeof w[H.yaw]==='number')return w[H.yaw];
  if(w.rotation&&typeof w.rotation.y==='number')return w.rotation.y;
  return 0;
}
function _calcPitch(w){
  if(!w)return 0;
  if(typeof w[H.pitch]==='number')return w[H.pitch];
  if(w.rotation&&typeof w.rotation.x==='number')return -w.rotation.x;
  return 0;
}
function _weaponConfig(w){return w&&(w.subClass||w.constructor);}
function _wfield(w,f){var c=_weaponConfig(w);return c?c[f]:undefined;}
function resolveWeapon(me){
  try{
    if(!me)return null;
    if(H.weapon&&me[H.weapon]&&typeof me[H.weapon]==='object')return me[H.weapon];
    for(var k in me){
      var v;try{v=me[k];}catch(e){continue;}
      if(!v||typeof v!=='object')continue;
      var c=_weaponConfig(v);
      if(c&&c.range!==undefined&&typeof v.fire==='function')return v;
    }
  }catch(e){}
  return null;
}
function findKeyWithProperty(obj,want,exclude){
  if(!obj)return null;
  if(want&&obj[want]&&typeof obj[want]==='object')return want;
  for(var k in obj){
    var v;try{v=obj[k];}catch(e){continue;}
    if(!v||typeof v!=='object')continue;
    if(exclude&&exclude.indexOf(k)!==-1)continue;
    if(v.isMesh||v.getVerticesData||v.getBoundingInfo)return k;
  }
  return null;
}
function findMe(){
  if(!ss.PLAYERS)return null;
  var i,P;
  for(i=0;i<ss.PLAYERS.length;i++){P=ss.PLAYERS[i];if(P&&P.hasOwnProperty&&P.hasOwnProperty('ws'))return P;}
  for(i=0;i<ss.PLAYERS.length;i++){P=ss.PLAYERS[i];if(P&&P[H.playing]&&P[H.actor])return P;}
  return null;
}
function getCam(){
  try{
    if(_cam&&_cam.getViewMatrix)return _cam;
    if(ss.SCENE&&ss.SCENE.activeCamera){_cam=ss.SCENE.activeCamera;return _cam;}
    var w=resolveWeapon(_aim.me);
    if(w&&w.getScene&&w.getScene()&&w.getScene().activeCamera){_cam=w.getScene().activeCamera;return _cam;}
  }catch(e){}
  return _cam;
}
function normalizeMouseSensitivity(){var s=Number(settings.mouseSensitivity);return (s>0)?s:1;}
function movePointer(dx,dy){
  if(settings.chatEnabled&&document.activeElement&&document.activeElement.tagName==='INPUT'){_aim.lastInput=document.activeElement;return true;}
  if(!namedPointerListener&&!realPointerListener)return false;
  var ev;
  try{ev=new MouseEvent('mousemove',{bubbles:true,cancelable:true,movementX:dx,movementY:dy,clientX:window.innerWidth/2,clientY:window.innerHeight/2});}catch(e){ev=document.createEvent('MouseEvents');ev.initMouseEvent('mousemove',true,true,window,0,0,0,window.innerWidth/2,window.innerHeight/2,false,false,false,false,0,null);}
  try{Object.defineProperty(ev,'movementX',{value:dx});Object.defineProperty(ev,'movementY',{value:dy});}catch(e){}
  if(_mouseParamsId!=null){try{ev.pointerId=_mouseParamsId;}catch(e){}}
  try{if(namedPointerListener)namedPointerListener.call(window,ev);}catch(e){}
  try{if(realPointerListener)realPointerListener(ev);}catch(e){}
  return true;
}
function actorMeshOf(P){
  try{var a=P&&P[H.actor];var m=a&&a[H.mesh];return (m&&typeof m==='object')?m:null;}catch(e){return null;}
}
function _worldPosOf(P){
  try{
    var m=actorMeshOf(P);
    if(!m)return null;
    if(m.getAbsolutePosition)return m.getAbsolutePosition();
    return m.position||null;
  }catch(e){return null;}
}
function _eyePos(){
  var m=actorMeshOf(_aim.me);
  if(!m)return null;
  try{return m.getAbsolutePosition?m.getAbsolutePosition():m.position;}catch(e){return null;}
}
function _calcYawTo(wpos){
  var e=_eyePos();if(!e||!wpos)return 0;
  return Math.atan2(wpos.x-e.x,wpos.z-e.z);
}
function _calcPitchTo(wpos){
  var e=_eyePos();if(!e||!wpos)return 0;
  var dx=wpos.x-e.x,dy=wpos.y-e.y,dz=wpos.z-e.z;
  return Math.atan2(dy,Math.sqrt(dx*dx+dz*dz));
}
function setToYawPitch(yaw,pitch,smooth){
  var me=_aim.me;if(!me)return;
  var w=resolveWeapon(me);if(!w)return;
  var dYaw=radianDiff(yaw,_calcYaw(w)),dPitch=pitch-_calcPitch(w);
  if(smooth){dYaw*=0.35;dPitch*=0.35;}
  var s=0.002*normalizeMouseSensitivity();
  movePointer(dYaw/s,-dPitch/s);
}
function _velocityOf(P){
  try{
    var m=actorMeshOf(P);if(!m)return {x:0,y:0,z:0};
    var pos=m.getAbsolutePosition?m.getAbsolutePosition():m.position;
    if(!pos)return {x:0,y:0,z:0};
    var t=nowMs(),prev=_prevPos.get(P);
    _prevPos.set(P,{x:pos.x,y:pos.y,z:pos.z,t:t});
    if(!prev||!prev.t)return {x:0,y:0,z:0};
    var dt=(t-prev.t)/1000;
    if(dt<=0||dt>1)return {x:0,y:0,z:0};
    return {x:(pos.x-prev.x)/dt,y:(pos.y-prev.y)/dt,z:(pos.z-prev.z)/dt};
  }catch(e){return {x:0,y:0,z:0};}
}
function _predicted(wpos,target){
  try{
    if(!wpos||!target||typeof BABYLON==='undefined')return wpos;
    var from=_eyePos();if(!from)return wpos;
    var w=resolveWeapon(target)||resolveWeapon(_aim.me);
    var speed=w?(_wfield(w,'bulletSpeed')||_wfield(w,'speed')||300):300;
    var dist=BABYLON.Vector3.Distance(from,wpos);
    var t=dist/Math.max(1,speed);
    var v=_velocityOf(target);
    return new BABYLON.Vector3(wpos.x+v.x*t,wpos.y+v.y*t,wpos.z+v.z*t);
  }catch(e){return wpos;}
}
function _targetSize(P){
  try{
    if(settings.boxMode==='hitbox'){
      var m=actorMeshOf(P);
      if(m&&m.getBoundingInfo){var e=m.getBoundingInfo().boundingBox.extendSize;return Math.max(0.6,e.y*2);}
    }
  }catch(e){}
  return 1.7;
}
function _aimTick(me,list){
  if(!settings.aimEnabled)return null;
  if(settings.chatEnabled&&document.activeElement&&document.activeElement.tagName==='INPUT'){_aim.lastInput=document.activeElement;return null;}
  if(settings.aimRequireRMB&&!_aim.rmbDown){_aim.smoothTarget=null;_aim.hasLock=false;_aim.silentTarget=null;return null;}
  var best=null,bestScore=Infinity;
  for(var i=0;i<list.length;i++){
    var P=list[i];
    if(!P[H.playing])continue;
    if(settings.aimTeams&&typeof me.team==='number'&&me.team!==0&&P.team===me.team)continue;
    var wpos=_worldPosOf(P);if(!wpos)continue;
    var d=BABYLON.Vector3.Distance(_eyePos()||wpos,wpos);
    if(d<Number(settings.aimMinDist)||d>Number(settings.aimMaxDist))continue;
    var score=d;
    if(settings.aimMode==='fov'){
      var w=resolveWeapon(me);
      var ang=Math.sqrt(Math.pow(radianDiff(_calcYawTo(wpos),_calcYaw(w)),2)+Math.pow(_calcPitchTo(wpos)-_calcPitch(w),2));
      if(Number(settings.aimFov)<180&&ang>Number(settings.aimFov)*Math.PI/180)continue;
      score=ang;
    }else if(settings.aimMode==='lowhp'){
      if(P.hp!=null&&P.hp>=Number(settings.aimLowHp))continue;
    }
    if(score<bestScore){bestScore=score;best=P;}
  }
  if(!best)return null;
  if(best!==_aim.smoothTarget){_aim.smoothTarget=best;_aim.hasLock=false;}
  else _aim.hasLock=true;
  _aim.silentTarget=best;
  return best;
}
function beforeFire(player){
  try{
    if(!settings.silentEnabled)return;
    if(settings.silentRequireRMB&&!_aim.rmbDown)return;
    var me=(player&&player.hasOwnProperty&&player.hasOwnProperty('ws'))?player:_aim.me;
    if(!me)return;
    var t=_aim.silentTarget;
    if(!(_aim.hasLock&&t&&t[H.playing]))return;
    var w=resolveWeapon(me);if(!w)return;
    var tw=_worldPosOf(t);if(!tw)return;
    if(settings.predictionEnabled)tw=_predicted(tw,t);
    var yaw=_calcYawTo(tw),pitch=_calcPitchTo(tw);
    if(settings.silentRestore){w._ssh_sy=_calcYaw(w);w._ssh_sp=_calcPitch(w);}
    w[H.yaw]=yaw;w[H.pitch]=pitch;
    _setPrecision(w);
    if(settings.silentRestore){
      setTimeout(function(){try{w[H.yaw]=w._ssh_sy;w[H.pitch]=w._ssh_sp;}catch(e){}},0);
    }
  }catch(e){if(!_aim.errLogged){_aim.errLogged=true;log('fire hook err',e);}}
}
function _nativeCollider(){
  if(!window.SSH_USE_NATIVE)return null;
  var R=ss.RAYS;if(!R)return null;
  var fn=R[H.rayCollidesWithMap];
  return (typeof fn==='function')?fn:null;
}
function getLineOfSight(from,to){
  var fn=_nativeCollider();
  if(!fn)return null;
  try{return !!fn.call(ss.RAYS,from,to,0);}catch(e){return null;}
}

/* ---------- ESP helpers ---------- */
function hexToColor3(hex){
  try{
    if(!BABYLON||!BABYLON.Color3)return null;
    var key=String(hex),c=_color3Cache.get(key);
    if(c)return c;
    c=BABYLON.Color3.FromHexString(HASH+key);
    _color3Cache.set(key,c);
    return c;
  }catch(e){return null;}
}
function espRed(){if(!_espRed)_espRed=hexToColor3(settings.boxColor||'ff3b3b');return _espRed;}
function espAmmo(){if(!_espAmmo)_espAmmo=hexToColor3('4ade80');return _espAmmo;}
function espGren(){if(!_espGren)_espGren=hexToColor3('fbbf24');return _espGren;}
function drawLabel(plane,text,hex){
  try{
    var mat=plane&&plane.material,dt=mat&&mat.diffuseTexture;if(!dt)return;
    var ctx=dt.getContext(),size=dt.getSize();
    ctx.clearRect(0,0,size.width,size.height);
    ctx.font='bold 72px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=HASH+(hex||'ffffff');
    ctx.fillText(text||'',size.width/2,size.height/2);
    dt.update();
  }catch(e){}
}
function makeTextLabel(pos,text,hex){
  try{
    if(!BABYLON||!BABYLON.MeshBuilder||!ss.SCENE)return null;
    var p=BABYLON.MeshBuilder.CreatePlane('ssh_label',{width:1.6,height:0.4},ss.SCENE);
    if(pos&&pos.x!=null&&p.position.copyFrom)p.position.copyFrom(pos);else if(pos&&p.position.set)p.position.set(pos.x||0,pos.y||0,pos.z||0);
    p.billboardMode=BABYLON.Mesh.BILLBOARDMODE_ALL;
    p.isPickable=false;p.renderingGroupId=1;
    var mat=new BABYLON.StandardMaterial('ssh_label_mat',ss.SCENE);
    mat.diffuseTexture=new BABYLON.DynamicTexture('ssh_label_tex',{width:512,height:128},ss.SCENE,false);
    mat.diffuseTexture.hasAlpha=true;
    mat.useAlphaFromDiffuseTexture=true;
    mat.emissiveColor=hexToColor3(hex||'ffffff')||espRed();
    mat.disableLighting=true;mat.backFaceCulling=false;
    p.material=mat;p._ssh_text=text;
    drawLabel(p,text,hex);
    return p;
  }catch(e){return null;}
}
function setLabelText(e,text,hex){
  try{
    if(!e||!e.labelText)return;
    if(e.labelText._ssh_text===text&&e.labelText._ssh_hex===hex)return;
    e.labelText._ssh_text=text;e.labelText._ssh_hex=hex;
    if(e.labelText.material&&e.labelText.material.emissiveColor&&hex)setColor3(e.labelText.material.emissiveColor,hex);
    drawLabel(e.labelText,text,hex);
  }catch(err){}
}
function setColor3(target,hex){
  try{var c=hexToColor3(hex);if(c&&target)target.copyFrom?target.copyFrom(c):(target.r=c.r,target.g=c.g,target.b=c.b);}catch(e){}
}
function applyColor(mesh,hex){
  try{if(mesh&&mesh.material&&mesh.material.emissiveColor)setColor3(mesh.material.emissiveColor,hex);}catch(e){}
}
function ensureEspFor(P){
  var e=_espPlayers.get(P);
  if(!e){e={p:P,mesh:null,labelText:null,color:null,name:null,bounds:null,aimLine:null};_espPlayers.set(P,e);}
  return e;
}
function createEspFor(P,e){
  try{
    if(!BABYLON||!ss.SCENE)return;
    var am=actorMeshOf(P);if(!am)return;
    var h=_targetSize(P);
    var box=BABYLON.MeshBuilder.CreateBox('ssh_esp',{width:0.9,height:h,depth:0.9},ss.SCENE);
    box.isPickable=false;box.renderingGroupId=1;box.parent=am;box.position.set(0,h/2,0);
    var mat=new BABYLON.StandardMaterial('ssh_esp_mat',ss.SCENE);
    mat.emissiveColor=hexToColor3(e.color||settings.boxColor||'ff3b3b')||espRed();
    mat.disableLighting=true;mat.alpha=0.4;mat.backFaceCulling=false;
    box.material=mat;
    e.mesh=box;
    if(settings.labelEnabled){
      e.labelText=makeTextLabel(null,'',settings.labelColor||'ffffff');
      if(e.labelText){e.labelText.parent=am;e.labelText.position.set(0,h+0.6,0);}
    }
  }catch(err){}
}
function disposeEspFor(e){
  try{
    if(e.mesh){if(e.mesh.material&&e.mesh.material.dispose)e.mesh.material.dispose();if(e.mesh.dispose)e.mesh.dispose();}
    if(e.labelText){
      if(e.labelText.material){if(e.labelText.material.diffuseTexture)e.labelText.material.diffuseTexture.dispose();e.labelText.material.dispose();}
      if(e.labelText.dispose)e.labelText.dispose();
    }
    if(e.aimLine&&e.aimLine.dispose)e.aimLine.dispose();
    if(e.bounds)e.bounds.forEach(function(m){if(m&&m.dispose)m.dispose();});
    e.mesh=null;e.labelText=null;e.aimLine=null;e.bounds=null;
  }catch(err){}
}
function boundsDimsFor(mode){
  var out=[];
  if(mode==='head'||mode==='both')out.push({tag:'head',hx:0.22,hy:0.22,hz:0.22,ox:0,oy:1.5,oz:0});
  if(mode==='body'||mode==='both')out.push({tag:'body',hx:0.36,hy:0.55,hz:0.36,ox:0,oy:0.85,oz:0});
  return out;
}
function makeBoundsMesh(parent,box){
  try{
    var b=BABYLON.MeshBuilder.CreateBox('ssh_bounds',{width:box.hx*2,height:box.hy*2,depth:box.hz*2},ss.SCENE);
    b.isPickable=false;b.renderingGroupId=1;b.parent=parent;
    var mat=new BABYLON.StandardMaterial('ssh_bounds_mat',ss.SCENE);
    var c=hexToColor3(settings.boundsColor||'00ffff');if(c)mat.emissiveColor=c;
    mat.disableLighting=true;mat.wireframe=true;
    b.material=mat;b.position.set(box.ox,box.oy,box.oz);
    return b;
  }catch(e){return null;}
}
function ensureTracer(e){
  try{
    if(!BABYLON||!ss.SCENE)return;
    if(e.aimLine)return;
    var l=BABYLON.MeshBuilder.CreateLines('ssh_tracer',{points:[BABYLON.Vector3.Zero(),new BABYLON.Vector3(0,1,0)]},ss.SCENE);
    l.isPickable=false;l.renderingGroupId=1;
    e.aimLine=l;
  }catch(err){}
}
function updateTracer(e,from,to,hex){
  try{
    if(!e.aimLine||!from||!to)return;
    BABYLON.MeshBuilder.CreateLines('ssh_tracer',{points:[from,to],instance:e.aimLine});
    var c=hexToColor3(hex||'ffffff');if(c&&e.aimLine.color)c.copyFrom?e.aimLine.color.copyFrom(c):(e.aimLine.color=c);
    e.aimLine.renderingGroupId=1;
  }catch(err){}
}
function resolveName(P){
  try{
    if(settings.nameMode==='id')return HASH+(P[H.uniqueId]!=null?P[H.uniqueId]:'?');
    var n=P.name||P.username||P.displayName;
    if(!n&&P[H.actor]){var a=P[H.actor];n=a.name||a.username;}
    return n?String(n).slice(0,18):'';
  }catch(e){return '';}
}
function kdFor(P){try{return (P.kills||0)+'/'+(P.deaths||0);}catch(e){return '';}}
function labelFor(P,name){return settings.labelShowKd&&kdFor(P)?(name?name+' ':'')+kdFor(P):name;}
function resolveColor(P,teamsOn,me){
  try{
    if(P[H.playing]&&teamsOn&&typeof P.team==='number'&&me&&typeof me.team==='number'&&me.team!==0&&P.team===me.team)return settings.teamColor||'3b82f6';
    if(P[H.playing])return settings.boxColor||'ff3b3b';
    return settings.deadColor||'9ca3af';
  }catch(e){return settings.boxColor||'ff3b3b';}
}
function bloomDebugTick(me){
  try{
    if(!settings.bloomDebug)return;
    if(_frame%60!==0)return;
    var w=resolveWeapon(me);if(!w)return;
    log('yaw',_calcYaw(w).toFixed(3),'pitch',_calcPitch(w).toFixed(3),'players',ss.PLAYERS?ss.PLAYERS.length:0,'items',ss.items?'ok':'n/a');
  }catch(e){}
}
function resetRuntime(){
  ss={};_espPlayers.clear();_prevPos.clear();itemMarkers.clear();
  _color3Cache=new Map();_espRed=null;_espAmmo=null;_espGren=null;
  _aim.me=null;_aim.silentTarget=null;_aim.hasLock=false;_aim.smoothTarget=null;_aim.lastInput=null;_cam=null;
  _silentTarget=null;_frame=0;_mouseParamsId=null;_warnPlayers=false;_warnMe=false;_liveLogged=false;
}

/* ---------- per-frame callback ---------- */
function installCallback(){
  window[CB]=function(vars){
    try{
      _frame++;
      Object.assign(ss,vars);
      if(!ss.PLAYERS){
        if(!_warnPlayers){_warnPlayers=true;log('WARN: ss.PLAYERS unresolved (H.PLAYERS='+H.PLAYERS+')');}
        return false;
      }
      var me=findMe();
      if(!me){
        if(!_warnMe){_warnMe=true;log('WARN: no local player (no ss.PLAYERS entry with .ws)');}
        return false;
      }
      _aim.me=me;
      if(!_liveLogged){_liveLogged=true;log('per-frame callback LIVE players:'+ss.PLAYERS.length+' scene:'+(!!ss.SCENE)+' items:'+(!!ss.items)+' ptr:'+(!!namedPointerListener));}
      var meth=(me.hasOwnProperty&&me.hasOwnProperty('ws'))?'ws':'camera';
      if(meth!==_meMethod){_meMethod=meth;log('local player resolved via',meth);}
      if(me[H.uniqueId]!=null)_mouseParamsId=me[H.uniqueId];
      var actorKey=findKeyWithProperty(me,H.mesh,[H.weapon]);
      if(actorKey&&actorKey!==H.actor)H.actor=actorKey;
      if(ss.SCENE&&!ss.SCENE._ssh_depthCleared){
        try{ss.SCENE.setRenderingAutoClearDepthStencil(1,true,true,true);ss.SCENE._ssh_depthCleared=true;}catch(e){}
      }
      var teamsOn=(typeof me.team==='number'&&me.team!==0);
      if(_espPlayers.size>512)_espPlayers.clear();
      var list=[],seen=new Set(),i,P;
      for(i=0;i<ss.PLAYERS.length;i++){
        P=ss.PLAYERS[i];
        if(!P)continue;
        if(P===me&&!settings.espLocal)continue;
        if(P[H.uniqueId]==null)continue;
        if(ss[H.coords]&&P[H.coords]!==ss[H.coords])continue;
        if(!P[H.playing])continue;
        if(!actorMeshOf(P))continue;
        list.push(P);
      }
      list.sort(function(a,b){return a[H.uniqueId]-b[H.uniqueId];});
      for(i=0;i<list.length;i++){
        P=list[i];
        if(_espPlayers.size>=MAX_ESP_PLAYERS&&!_espPlayers.has(P))continue;
        seen.add(P);
        var e=ensureEspFor(P);
        var name=resolveName(P);
        if(name!==e.name)e.name=name;
        var col=resolveColor(P,teamsOn,me);
        if(col!==e.color){e.color=col;applyColor(e.mesh,col);}
        var live=settings.espEnabled&&(settings.espMode==='all'||(settings.espMode==='enemy'&&!P[H.playing])||settings.espMode==='visible');
        if(live&&!e.mesh){createEspFor(P,e);applyColor(e.mesh,e.color);}
        else if(!live&&e.mesh){disposeEspFor(e);}
        if(e.mesh)e.mesh.renderingGroupId=1;
        if(settings.labelEnabled&&e.labelText){setLabelText(e,labelFor(P,e.name),settings.labelColor);e.labelText.renderingGroupId=1;e.labelText.isVisible=live;}
        else if(e.labelText)e.labelText.isVisible=false;
        var am=actorMeshOf(P);
        if(settings.boundsEnabled&&am){
          if(!e.bounds)e.bounds=new Map();
          var dims=boundsDimsFor(settings.boundsMode),want={},bi;
          for(bi=0;bi<dims.length;bi++){want[dims[bi].tag]=1;if(!e.bounds.has(dims[bi].tag))e.bounds.set(dims[bi].tag,makeBoundsMesh(am,dims[bi]));}
          e.bounds.forEach(function(m,tag){if(!want[tag]){if(m&&m.dispose)m.dispose();e.bounds.delete(tag);}});
        }else if(e.bounds){e.bounds.forEach(function(m){if(m&&m.dispose)m.dispose();});e.bounds=null;}
        if(settings.tracerEnabled&&am){
          ensureTracer(e);
          updateTracer(e,_eyePos(),am.getAbsolutePosition?am.getAbsolutePosition():am.position,settings.tracerColor);
        }else if(e.aimLine){if(e.aimLine.dispose)e.aimLine.dispose();e.aimLine=null;}
        if(settings.espOcclusion&&e.mesh&&_eyePos()){
          var los=getLineOfSight(_eyePos(),e.mesh.getAbsolutePosition?e.mesh.getAbsolutePosition():e.mesh.position);
          var v=(los===false)?0.3:1;
          e.mesh.visibility=v;
          if(e.labelText)e.labelText.visibility=v;
        }
      }
      _espPlayers.forEach(function(e2,P2){if(!seen.has(P2)){disposeEspFor(e2);_espPlayers.delete(P2);}});
      var nowT=nowMs();
      itemMarkers.forEach(function(rec,key){
        if(!rec)return;
        if(rec.spawnedAt&&nowT-rec.spawnedAt>(Number(settings.itemTtl)||5000)){if(rec.label&&rec.label.dispose)rec.label.dispose();itemMarkers.delete(key);return;}
        if(rec.mesh&&rec.mesh.isDisposed&&rec.mesh.isDisposed()){itemMarkers.delete(key);}
      });
      if(settings.itemEnabled&&ss.SCENE&&ss.SCENE.meshes&&nowT-_lastItemScan>250){
        _lastItemScan=nowT;
        try{
          for(i=0;i<ss.SCENE.meshes.length;i++){
            var mm=ss.SCENE.meshes[i];
            if(!mm||!mm.name||mm.name.indexOf('ammo')===-1)continue;
            if(!mm.material||!mm.material.diffuseTexture)continue;
            if(!mm.position||!isFinite(mm.position.x))continue;
            var k='m'+Math.round(mm.position.x*10)+','+Math.round(mm.position.y*10)+','+Math.round(mm.position.z*10);
            var ex=itemMarkers.get(k);
            if(!ex){ex={key:k,mesh:mm,lastSeen:nowT,label:null};itemMarkers.set(k,ex);}
            ex.lastSeen=nowT;
          }
        }catch(e){}
        itemMarkers.forEach(function(rec){
          if(!rec||!rec.mesh)return;
          if(!settings.itemEnabled||!settings.itemLabels){if(rec.label){if(rec.label.dispose)rec.label.dispose();rec.label=null;}return;}
          var fresh=(nowT-(rec.lastSeen||rec.spawnedAt||0))<900;
          if(!fresh){if(rec.label){if(rec.label.dispose)rec.label.dispose();rec.label=null;}return;}
          if(!rec.label)rec.label=makeTextLabel(null,'item',settings.itemColor);
          if(rec.label&&rec.mesh.position){rec.label.position.set(rec.mesh.position.x,rec.mesh.position.y+1.2,rec.mesh.position.z);rec.label.renderingGroupId=1;}
        });
      }
      bloomDebugTick(me);
      var res=_aimTick(me,list);
      if(res){
        var wpos=_worldPosOf(res);
        if(wpos){
          if(settings.predictionEnabled)wpos=_predicted(wpos,res);
          setToYawPitch(_calcYawTo(wpos),_calcPitchTo(wpos),settings.aimSmooth);
        }
      }
      if(settings.autoChatEnabled&&settings.autoChatText){
        if(nowT-_lastChatCheck>Math.max(500,Number(settings.autoChatDelay)||4000)){
          _lastChatCheck=nowT;
          try{
            var inputs=document.querySelectorAll('input[type=text],input:not([type])');
            for(var qi=0;qi<inputs.length;qi++){
              var inp=inputs[qi];
              if(inp.offsetParent===null)continue;
              if(inp===document.getElementById('ssh-menu')||inp.closest&&inp.closest('#ssh-menu'))continue;
              var setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
              setter.call(inp,settings.autoChatText);
              inp.dispatchEvent(new Event('input',{bubbles:true}));
              inp.dispatchEvent(new Event('change',{bubbles:true}));
              inp.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));
              inp.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));
              log('auto-chat:',settings.autoChatText);
              break;
            }
          }catch(e){}
        }
      }
      return false;
    }catch(e){
      if(!_aim.errLogged){_aim.errLogged=true;log('callback error',e);}
      return false;
    }
  };
}

/* ---------- UI ---------- */
var ST={
  wrap:{position:'fixed',zIndex:'2147483647',background:'rgba(0,0,0,0.85)',color:'rgb(255,255,255)',font:'12px/1.45 system-ui,-apple-system,sans-serif',padding:'10px 12px',borderRadius:'6px',minWidth:'250px',border:'1px solid rgb(51,51,51)',userSelect:'none',maxHeight:'calc(100vh - 24px)',overflowY:'auto',overflowX:'hidden'},
  titlebar:{cursor:'move',fontWeight:'bold',display:'flex',justifyContent:'space-between',gap:'10px',marginBottom:'4px'},
  title:{color:'rgb(255,59,59)'},
  catHdr:{cursor:'pointer',padding:'5px 0 3px 0',fontWeight:'bold',borderTop:'1px solid rgb(51,51,51)',marginTop:'4px'},
  catBody:{display:'none',paddingLeft:'6px'},
  catBodyOpen:{display:'block',paddingLeft:'6px'},
  row:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'8px',margin:'3px 0'},
  hint:{opacity:'0.5'},
  check:{accentColor:'rgb(255,59,59)',cursor:'pointer'},
  color:{width:'28px',height:'16px',padding:'0',border:'0',background:'none',cursor:'pointer'},
  text:{width:'64px',background:'rgb(17,17,17)',color:'rgb(255,255,255)',border:'1px solid rgb(51,51,51)',borderRadius:'3px',padding:'1px 4px',font:'inherit'},
  wide:{width:'110px',background:'rgb(17,17,17)',color:'rgb(255,255,255)',border:'1px solid rgb(51,51,51)',borderRadius:'3px',padding:'1px 4px',font:'inherit'},
  sel:{background:'rgb(17,17,17)',color:'rgb(255,255,255)',border:'1px solid rgb(51,51,51)',borderRadius:'3px',padding:'1px 2px',font:'inherit'}
};
function _el(tag,style,text){
  var n=document.createElement(tag);
  if(style)Object.assign(n.style,style);
  if(text!=null)n.textContent=text;
  return n;
}
function _row(){return _el('div',ST.row);}
function _lbl(label,hint){
  var l=_el('span');
  l.appendChild(document.createTextNode(label));
  if(hint){var h=_el('span',ST.hint,' '+hint);l.appendChild(h);}
  return l;
}
function _rowCheck(k,label,hint){
  var r=_row(),inp=_el('input',ST.check);
  inp.type='checkbox';inp.setAttribute('data-k',k);
  r.appendChild(_lbl(label,hint));r.appendChild(inp);
  return r;
}
function _rowText(k,label,hint,wide){
  var r=_row(),inp=_el('input',wide?ST.wide:ST.text);
  inp.type='text';inp.setAttribute('data-k',k);
  r.appendChild(_lbl(label,hint));r.appendChild(inp);
  return r;
}
function _rowColor(k,label){
  var r=_row(),inp=_el('input',ST.color);
  inp.type='color';inp.setAttribute('data-k',k);
  r.appendChild(_lbl(label));r.appendChild(inp);
  return r;
}
function _rowSelect(k,label,opts){
  var r=_row(),sel=_el('select',ST.sel);
  sel.setAttribute('data-k',k);
  opts.forEach(function(o){var op=_el('option',null,o[1]);op.value=o[0];sel.appendChild(op);});
  r.appendChild(_lbl(label));r.appendChild(sel);
  return r;
}
var refreshMenu=function(){};
function buildMenu(){
  if(document.getElementById('ssh-menu'))return;
  if(!document.body){setTimeout(buildMenu,50);return;}
  var wrap=_el('div',ST.wrap);
  wrap.id='ssh-menu';
  wrap.style.left=(settings.menuLeft!=null?settings.menuLeft:12)+'px';
  wrap.style.top=(settings.menuTop!=null?settings.menuTop:12)+'px';
  wrap.style.display=settings.menuVisible?'':'none';
  var tb=_el('div',ST.titlebar);
  tb.appendChild(_el('span',ST.title,'Shellhax '+VERSION));
  tb.appendChild(_el('span',{opacity:'0.5',fontWeight:'normal',fontSize:'11px'},BT+' to hide'));
  wrap.appendChild(tb);
  function cat(title,rows,open){
    var c=_el('div'),h=_el('div',ST.catHdr,title),b=_el('div',open?ST.catBodyOpen:ST.catBody);
    h.addEventListener('click',function(){b.style.display=(b.style.display==='block')?'none':'block';});
    c.appendChild(h);c.appendChild(b);
    rows.forEach(function(r){b.appendChild(r);});
    return c;
  }
  wrap.appendChild(cat('Combat',[
    _rowCheck('aimEnabled','Aimbot','(hold RMB)'),
    _rowCheck('aimRequireRMB','Require RMB'),
    _rowCheck('aimSmooth','Smoothing'),
    _rowCheck('aimTeams','Ignore teammates'),
    _rowText('aimFov','FOV limit','deg'),
    _rowText('aimMinDist','Min dist'),
    _rowText('aimMaxDist','Max dist'),
    _rowSelect('aimMode','Priority',[['dist','Nearest'],['fov','Closest angle'],['lowhp','Low HP']]),
    _rowText('aimLowHp','Low HP below'),
    _rowCheck('predictionEnabled','Predict movement'),
    _rowCheck('silentEnabled','Silent aim'),
    _rowCheck('silentRequireRMB','Silent needs RMB'),
    _rowCheck('silentRestore','Restore view'),
    _rowCheck('chatEnabled','Chat guard')
  ],true));
  wrap.appendChild(cat('ESP',[
    _rowCheck('espEnabled','ESP'),
    _rowSelect('espMode','Show',[['all','All players'],['enemy','Enemies'],['visible','Alive only']]),
    _rowColor('boxColor','Box colour'),
    _rowSelect('boxMode','Box size',[['fixed','Fixed'],['hitbox','Match hitbox']]),
    _rowColor('teamColor','Team colour'),
    _rowColor('deadColor','Dead colour'),
    _rowCheck('labelEnabled','Name tags'),
    _rowColor('labelColor','Tag colour'),
    _rowSelect('nameMode','Tag text',[['name','Name'],['id','Player ID']]),
    _rowCheck('labelShowKd','Show K/D on tag'),
    _rowCheck('boundsEnabled','Hitbox outline'),
    _rowSelect('boundsMode','Outline',[['head','Head'],['body','Body'],['both','Both']]),
    _rowColor('boundsColor','Outline colour'),
    _rowCheck('tracerEnabled','Tracers'),
    _rowColor('tracerColor','Tracer colour'),
    _rowCheck('espOcclusion','Fade through walls'),
    _rowCheck('espLocal','Show self')
  ]));
  wrap.appendChild(cat('Items',[
    _rowCheck('itemEnabled','Item ESP'),
    _rowCheck('itemLabels','Item labels'),
    _rowColor('itemColor','Item colour'),
    _rowText('itemTtl','Spawn tag ms'),
    _rowCheck('autoChatEnabled','Auto chat'),
    _rowText('autoChatText','Chat text','',true),
    _rowText('autoChatDelay','Chat every ms'),
    _rowCheck('unlockSkins','Unlock skins'),
    _rowText('mouseSensitivity','Mouse sens'),
    _rowCheck('bloomDebug','Debug log'),
    _rowCheck('menuVisible','Menu visible')
  ]));
  document.body.appendChild(wrap);
  wrap.querySelectorAll('input[type=checkbox]').forEach(function(el){
    el.addEventListener('change',function(){settings[el.getAttribute('data-k')]=el.checked;saveSettings();refreshMenu();});
  });
  wrap.querySelectorAll('input[type=color]').forEach(function(el){
    el.addEventListener('input',function(){settings[el.getAttribute('data-k')]=el.value.split(HASH).join('');saveSettings();});
  });
  wrap.querySelectorAll('input[type=text]').forEach(function(el){
    el.addEventListener('change',function(){settings[el.getAttribute('data-k')]=el.value;saveSettings();refreshMenu();});
  });
  wrap.querySelectorAll('select').forEach(function(el){
    el.addEventListener('change',function(){settings[el.getAttribute('data-k')]=el.value;saveSettings();refreshMenu();});
  });
  var drag=null;
  tb.addEventListener('mousedown',function(e){
    drag={x:e.clientX,y:e.clientY,l:parseInt(wrap.style.left,10)||0,t:parseInt(wrap.style.top,10)||0};
    e.preventDefault();
  });
  document.addEventListener('mousemove',function(e){
    if(!drag)return;
    wrap.style.left=Math.max(0,drag.l+(e.clientX-drag.x))+'px';
    wrap.style.top=Math.max(0,drag.t+(e.clientY-drag.y))+'px';
  });
  document.addEventListener('mouseup',function(){
    if(!drag)return;
    drag=null;
    settings.menuLeft=parseInt(wrap.style.left,10)||12;
    settings.menuTop=parseInt(wrap.style.top,10)||12;
    saveSettings();
  });
  ['keydown','keyup','mousedown','mouseup','wheel','contextmenu'].forEach(function(ev){
    wrap.addEventListener(ev,function(e){e.stopPropagation();},false);
  });
  refreshMenu();
}
refreshMenu=function(){
  var w=document.getElementById('ssh-menu');
  if(!w)return;
  w.style.display=settings.menuVisible?'':'none';
  w.querySelectorAll('input[type=checkbox]').forEach(function(el){el.checked=!!settings[el.getAttribute('data-k')];});
  w.querySelectorAll('input[type=color]').forEach(function(el){el.value=HASH+(settings[el.getAttribute('data-k')]||'ffffff');});
  w.querySelectorAll('input[type=text]').forEach(function(el){if(document.activeElement!==el)el.value=settings[el.getAttribute('data-k')];});
  w.querySelectorAll('select').forEach(function(el){el.value=settings[el.getAttribute('data-k')];});
};

/* ---------- install ---------- */
function install(){
  if(window.__ssh_hooked)return;
  window.__ssh_hooked=true;
  window.unsafeWindow=window;
  loadSettings();
  window[CAP]=function(v){ss._vars=v;};
  window[FIRE]=beforeFire;
  window[ITEMHOOK]=function(item,type,x,y,z){
    try{
      if(!settings.itemEnabled||typeof BABYLON==='undefined')return;
      var px=x,py=y,pz=z;
      if(px==null&&item&&item.mesh&&item.mesh.position){px=item.mesh.position.x;py=item.mesh.position.y;pz=item.mesh.position.z;}
      if(px==null)return;
      var pos=new BABYLON.Vector3(px,py,pz);
      var lbl=makeTextLabel(pos,'spawn',type===0?'4ade80':'fbbf24');
      if(lbl){lbl.renderingGroupId=1;itemMarkers.set('s'+Math.round(px*10)+','+Math.round(py*10)+','+Math.round(pz*10),{key:'s',mesh:null,label:lbl,spawnedAt:nowMs()});}
    }catch(e){}
  };
  window[COLLHOOK]=function(_t,item){
    try{
      if(!item||!item.mesh||!item.mesh.position)return;
      var k='s'+Math.round(item.mesh.position.x*10)+','+Math.round(item.mesh.position.y*10)+','+Math.round(item.mesh.position.z*10);
      var rec=itemMarkers.get(k);
      if(rec&&rec.label&&rec.label.dispose){rec.label.dispose();itemMarkers.delete(k);}
    }catch(e){}
  };
  installCallback();
  var proto=window.HTMLElement&&window.HTMLElement.prototype;
  if(proto&&!proto.__ssh_appendHooked){
    proto.__ssh_appendHooked=true;
    var origAppend=proto.appendChild;
    proto.appendChild=function(node){
      try{
        if(node&&node.tagName==='SCRIPT'&&!node.src&&!node.getAttribute('data-ssh')&&node.innerHTML&&node.innerHTML.length>20000&&BUNDLE_RE.test(node.innerHTML)){
          var t=patchBundle(node.innerHTML);
          if(t&&t!==node.innerHTML){node.innerHTML=t;log('bundle patched on appendChild');}
        }
      }catch(e){}
      return origAppend.call(this,node);
    };
  }
  var et=window.EventTarget&&window.EventTarget.prototype;
  if(et&&!et.__ssh_aelHooked){
    et.__ssh_aelHooked=true;
    var origAEL=et.addEventListener;
    et.addEventListener=function(type,fn,opt){
      try{
        if(type==='pointermove'&&typeof fn==='function'&&!namedPointerListener){namedPointerListener=fn;log('captured game pointermove listener');}
      }catch(e){}
      return origAEL.call(this,type,fn,opt);
    };
  }
  document.addEventListener('mousemove',function(e){
    if(realPointerListener)return;
    if(!e.movementX&&!e.movementY)return;
    realPointerListener=function(ev){movePointer(ev.movementX,ev.movementY);};
  });
  document.addEventListener('mousedown',function(e){if(e.button===2)_aim.rmbDown=true;},true);
  document.addEventListener('mouseup',function(e){if(e.button===2)_aim.rmbDown=false;},true);
  document.addEventListener('keydown',function(e){
    if(e.code==='Backquote'||e.key===BT){settings.menuVisible=!settings.menuVisible;saveSettings();refreshMenu();}
    if(e.code==='KeyV'){settings.espEnabled=!settings.espEnabled;saveSettings();refreshMenu();}
  },true);
  saveSettings();
  buildMenu();
  hookSceneRender();
  log('Shellhax '+VERSION+' installed. V = ESP, '+BT+' = menu');
}

function boot(){
  if(window.__ssh_booted)return;
  window.__ssh_booted=1;
  ensureBabylon(function(){
    hookSceneRender();
    fetch(location.href,{cache:'no-store',credentials:'same-origin'}).then(function(r){
      if(!r.ok)throw new Error('HTTP '+r.status);
      return r.text();
    }).then(function(html){
      var res=patchHtml(html);
      if(res.patched){log('inline bundle patched');return res;}
      log('no inline bundle - probing external scripts');
      return patchExternal(html).then(function(r2){return (r2&&r2.patched)?r2:{patched:false,html:html};});
    }).then(function(res){
      if(!res.patched)log('no static bundle found - appendChild hook will catch it when the game injects it');
      window.__ssh_patched=1;
      replacePage(res.html);
      reinject();
    }).catch(function(e){
      log('BOOT FAILED:',e&&e.message?e.message:e);
      window.__ssh_patched=0;window.__ssh_booted=0;
    });
  });
}

if(!window.__ssh_hooked)install();
if(!window.__ssh_patched)boot();
})()




