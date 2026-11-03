(()=>{'use strict';
const c=document.getElementById('game'),ctx=c.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id),hud={score:$('score'),crystals:$('crystals'),life:$('life'),energy:$('energyValue'),bar:$('energyBar'),erow:$('energyRow'),boost:$('boost'),overlay:$('overlay'),desc:$('overlayDesc'),start:$('start'),note:$('note'),flash:$('flash')};
let W=1,H=1,dpr=1,frame=0,last=0,uiClock=0,worldScroll=0,obstacles=[],gems=[],decor=[],nextSpawn=0,clouds=[],puddles=[],nextPuddle=0;
const lanes=[-2.35,0,2.35];
const game={phase:'menu',lane:1,x:0,y:0,vy:0,roll:0,speed:17,dist:0,score:0,crystals:0,energy:0,lives:3,invul:0,boost:0,clock:0,best:0,shake:0,combo:0};
Object.assign(game,{poseRun:0,poseSlide:0,poseAir:0,poseDash:0,landPulse:0,takeoffPulse:0,hitPulse:0,animCycle:0,training:false,trainingRest:false,weatherTime:0,dayLight:0,rain:0,wet:0,slipTime:0,slipVelocity:0,weatherStage:'NOITE',lastWeatherStage:'',splash:0});
try{game.best=Number(localStorage.getItem('neonRushBest')||0)||0;}catch(e){}
function resize(){W=Math.max(240,innerWidth);H=Math.max(240,innerHeight);dpr=Math.min(window.devicePixelRatio||1,1.55);c.width=Math.floor(W*dpr);c.height=Math.floor(H*dpr);c.style.width=W+'px';c.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);}addEventListener('resize',resize);resize();
const rand=(a,b)=>a+Math.random()*(b-a),choose=a=>a[(Math.random()*a.length)|0],clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),smooth=(a,b,t)=>a+(b-a)*t;
function reset(){Object.assign(game,{phase:'playing',lane:1,x:0,y:0,vy:0,roll:0,speed:17,dist:0,score:0,crystals:0,energy:0,lives:3,invul:0,boost:0,clock:0,shake:0,combo:0,poseRun:0,poseSlide:0,poseAir:0,poseDash:0,landPulse:0,takeoffPulse:0,hitPulse:0,animCycle:0,training:false,trainingRest:false,weatherTime:0,dayLight:0,rain:0,wet:0,slipTime:0,slipVelocity:0,splash:0,weatherStage:'NOITE',lastWeatherStage:'NOITE'});worldScroll=0;obstacles.length=0;gems.length=0;puddles.length=0;decor.length=0;nextPuddle=30;nextSpawn=24;for(let i=0;i<14;i++)spawnRow();hud.overlay.classList.add('hidden');$('practiceBar').classList.add('hide');hud.boost.disabled=true;updateUI();}
function spawnRow(){const z=nextSpawn;nextSpawn+=rand(12,16);const challenge=Math.random();const num=challenge<.64?1:2;const occupied=[];while(occupied.length<num){const k=(Math.random()*3)|0;if(!occupied.includes(k))occupied.push(k);}for(const ln of occupied){const type=choose(game.dist<135?['hurdle','block','hurdle','gate']:['hurdle','block','gate','block','gate']);obstacles.push({x:lanes[ln],z,type,hit:false});}
const safe=[0,1,2].filter(k=>!occupied.includes(k));const gemLane=choose(safe);for(let j=0;j<4;j++)gems.push({x:lanes[gemLane],z:z+3+j*2.65,t:Math.random()*8,got:false});if(Math.random()<.19){for(let j=0;j<3;j++)gems.push({x:lanes[choose(safe)],z:z-6+j*1.7,t:Math.random()*8,got:false});}}
function action(type){if(game.phase==='menu'||game.phase==='over'){if(type==='start')reset();return;}if(type==='pause'){pause();return;}if(game.phase!=='playing')return;
if(type==='rest'&&game.training){game.trainingRest=!game.trainingRest;$('restBtn').textContent=game.trainingRest?'▶ VOLTAR A CORRER':'◉ RESPIRAR / REPOUSO';return;}
if(type==='left')game.lane=Math.max(0,game.lane-1);if(type==='right')game.lane=Math.min(2,game.lane+1);
if(type==='jump'&&game.trainingRest){game.trainingRest=false;$('restBtn').textContent='◉ RESPIRAR / REPOUSO';}
if(type==='jump'&&game.y===0&&game.roll<=0){game.vy=10.3-1.8*game.wet;game.y=.02;game.takeoffPulse=1;}
if(type==='slide'&&game.trainingRest){game.trainingRest=false;$('restBtn').textContent='◉ RESPIRAR / REPOUSO';}
if(type==='slide'&&game.y<=.12){game.roll=.91+.26*game.wet;}
if(type==='boost'&&game.trainingRest){game.trainingRest=false;$('restBtn').textContent='◉ RESPIRAR / REPOUSO';}
if(type==='boost'&&game.energy>=60&&game.boost<=0){game.energy-=60;game.boost=1.7;toast('⚡ FOCO NINJA!');}
}
function pause(){if(game.phase==='playing'){game.phase='paused';openOverlay('PAUSADO','Sua corrida está aguardando.', '▶ CONTINUAR');}else if(game.phase==='paused'){game.phase='playing';hud.overlay.classList.add('hidden');}}
function openOverlay(status,message,label){hud.overlay.classList.remove('hidden');hud.overlay.querySelector('.eyebrow').textContent=status;hud.desc.innerHTML=message;hud.start.textContent=label;}
function end(){game.phase='over';const score=Math.floor(game.score);if(score>game.best){game.best=score;try{localStorage.setItem('neonRushBest',String(score));}catch(e){}}openOverlay('FIM DE CORRIDA',`Você fez <b style="color:#67ffe6">${score.toLocaleString('pt-BR')} pontos</b> e coletou <b>${game.crystals} cristais</b>.<br>Seu recorde é <b>${game.best.toLocaleString('pt-BR')} pontos</b>.`,'↻ JOGAR NOVAMENTE');}
function toast(text){hud.note.textContent=text;hud.note.classList.remove('show');void hud.note.offsetWidth;hud.note.classList.add('show');}
function collide(o){if(o.hit||Math.abs(o.z)>.92||Math.abs(game.x-o.x)>.81)return;o.hit=true;if(game.invul>0||game.boost>0)return;const safe=o.type==='hurdle'?game.y>.83:o.type==='gate'?game.roll>.08:false;if(safe){game.score+=35;game.combo++;return;}game.lives--;game.invul=1.6;game.shake=.35;game.hitPulse=1;hud.flash.style.opacity='.35';setTimeout(()=>hud.flash.style.opacity='0',100);toast(game.lives?'⚠ CUIDADO!':'💥 FIM DE JOGO');if(game.lives<=0)end();}
// Full loop lasts 180s: noite > amanhecer > dia > pôr do sol > noite > chuva > limpar.
function weatherAt(t){
 const phase=((t%180)+180)%180;
 const ease=(a,b,v)=>{const p=clamp((v-a)/(b-a),0,1);return p*p*(3-2*p);};
 let day=0,rain=0,stage='NOITE';
 if(phase<12){stage='NOITE';}
 else if(phase<29){day=ease(12,29,phase);stage='AMANHECER';}
 else if(phase<65){day=1;stage='DIA';}
 else if(phase<86){day=1-ease(65,86,phase);stage='ENTARDECER';}
 else if(phase<105){stage='NOITE';}
 else if(phase<120){rain=ease(105,120,phase);stage='CHUVA CHEGANDO';}
 else if(phase<158){rain=1;stage='CHUVA FORTE';}
 else{rain=1-ease(158,180,phase);stage=phase<169?'CHUVA DIMINUINDO':'CÉU LIMPANDO';}
 return {day,rain,stage};
}
function climateTick(dt){
 game.weatherTime+=dt;
 const w=weatherAt(game.weatherTime);
 game.dayLight=w.day;game.rain=w.rain;
 game.wet=clamp(game.wet+dt*(game.rain>.15?.105*game.rain:-.052),0,1);
 game.weatherStage=w.stage;
 if(game.lastWeatherStage!==w.stage){
  if(game.lastWeatherStage&&game.weatherTime>4){
   const announce={AMANHECER:'☀️ O SOL ESTÁ NASCENDO',DIA:'☀️ DIA CLARO',ENTARDECER:'🌇 O SOL ESTÁ SE PONDO','CHUVA CHEGANDO':'🌦️ VEM CHUVA!','CHUVA FORTE':'🌧️ CHUVA FORTE • NINJA MAIS LENTO','CÉU LIMPANDO':'🌤️ A CHUVA PAROU'};
   if(announce[w.stage])toast(announce[w.stage]);
  }
  game.lastWeatherStage=w.stage;
 }
}
function spawnPuddle(){
 if(game.rain>.35&&Math.random()<.78){
  const lane=(Math.random()*3)|0;
  puddles.push({x:lanes[lane],z:nextPuddle,rx:rand(.7,1.12),rz:rand(1,2),hit:false,seed:rand(0,99)});
 }
 nextPuddle+=rand(16,27);
}
function touchPuddle(p){
 if(p.hit||Math.abs(p.z)>.86||Math.abs(game.x-p.x)>.9)return;
 p.hit=true;
 if(game.y>.34||game.boost>0||game.wet<.20)return;
 game.slipTime=1.0+game.wet*.58;
 game.slipVelocity=(Math.random()<.5?-1:1)*(2.9+game.wet*2.8);
 game.hitPulse=.32;game.splash=1;
 toast('💧 POÇA! CUIDADO, ESCORREGADIO!');
}
function tick(dt){frame++;game.clock+=dt;if(game.phase!=='playing'){animateNinja(dt);return;}const sim=dt;climateTick(dt);
 const baseSpeed=Math.min(33.5,17+game.dist/185);
 game.speed=baseSpeed*(1-.23*game.wet);
 const speed=game.speed*(game.boost>0?1.58:1);
 game.dist+=speed*sim;if(!game.training)game.score+=speed*sim*2.2;
 worldScroll+=speed*sim;
 const slipActive=game.slipTime>0;
 const steering=slipActive?2.4:13-6.7*game.wet;
 game.x=smooth(game.x,lanes[game.lane],1-Math.exp(-dt*steering));
 if(slipActive){game.x+=game.slipVelocity*dt;game.slipVelocity*=Math.exp(-dt*2.7);game.slipTime=Math.max(0,game.slipTime-dt);}
 game.x=clamp(game.x,-3.43,3.43);
 game.splash=Math.max(0,game.splash-dt*1.9);
 game.invul=Math.max(0,game.invul-dt);game.boost=Math.max(0,game.boost-dt);game.roll=Math.max(0,game.roll-dt);game.shake=Math.max(0,game.shake-dt);
if(game.y>0||game.vy>0){game.vy-=26*dt;game.y+=game.vy*dt;if(game.y<0){game.y=0;game.vy=0;game.landPulse=1;}}
for(const o of obstacles){o.z-=speed*sim;collide(o);}for(const g of gems){g.z-=speed*sim;g.t+=dt*2.2;if(!g.got&&Math.abs(g.z)<.95&&Math.abs(game.x-g.x)<.85&&(game.y<1.6)){g.got=true;game.crystals++;game.energy=clamp(game.energy+12,0,100);game.score+=70;if(game.crystals%5===0)toast('◆ +5 CRISTAIS');}}
for(const p of puddles){p.z-=speed*sim;touchPuddle(p);}
 puddles=puddles.filter(p=>p.z>-12);
 nextPuddle-=speed*sim;while(nextPuddle<120)spawnPuddle();
 obstacles=obstacles.filter(o=>o.z>-12);gems=gems.filter(g=>g.z>-9&&!g.got);nextSpawn-=speed*sim;if(!game.training){while(nextSpawn<120)spawnRow();}animateNinja(dt);if(frame%6===0)updateUI();}
function updateUI(){hud.score.textContent=Math.floor(game.score).toString().padStart(5,'0');hud.crystals.textContent='◆ '+game.crystals;hud.life.textContent='♥'.repeat(game.lives)+'♡'.repeat(3-game.lives);hud.energy.textContent=Math.floor(game.energy)+'%';hud.bar.style.width=game.energy+'%';hud.erow.classList.toggle('ready',game.energy>=60);hud.boost.disabled=game.energy<60||game.phase!=='playing';
 const badge=$('weatherBadge');const wet=game.rain>.25;
 badge.textContent=(wet?'🌧️ ':game.dayLight>.7?'☀️ ':game.weatherStage==='AMANHECER'?'🌅 ':game.weatherStage==='ENTARDECER'?'🌇 ':'🌙 ')+game.weatherStage+(game.wet>.4?' · MOLHADO':'');
 badge.classList.toggle('wet',wet);
 $('slipBadge').classList.toggle('active',game.slipTime>.04);}
const cam={x:0,y:5.35,z:-10.2,fx:0,fy:1.8,fz:16},draws=[],twinkles=[];let renderLayer=0;for(let i=0;i<72;i++)twinkles.push([Math.random(),Math.random()*.62,rand(.5,2.5),Math.random()*7]);
function project(x,y,z){const cx=cam.x,dy=y-cam.y,dz=z-cam.z;const len=Math.hypot(cam.fz-cam.z,cam.fy-cam.y);const fy=(cam.fy-cam.y)/len,fz=(cam.fz-cam.z)/len;const depth=dy*fy+dz*fz;if(depth<=.25)return null;const viewY=dy*fz-dz*fy;const focal=H*(W>H?1.03:1.09);return [W*.5+(x-cx)*focal/depth,H*.49-viewY*focal/depth,depth,focal/depth];}
function face(v,color,alpha=1,stroke=''){const arr=v.map(p=>project(...p));if(arr.some(a=>!a))return;draws.push({dep:arr.reduce((n,a)=>n+a[2],0)/arr.length,pts:arr,color,alpha,stroke,layer:renderLayer});}
function quad(a,b,c,d,color,alpha=1){face([a,b,c,d],color,alpha);}
const themes={road:['#131b36','#172240','#10172e','#121b36','#070f21','#0c1730'],dark:['#14283f','#1b3c53','#173347','#2e526b','#10253b','#1a3247'],block:['#f564af','#d73d8e','#9b2c76','#fa8abf','#8c285f','#be327e'],hurdle:['#ffcd6c','#e7a546','#cd7528','#ffe3a6','#b77a28','#efb54b'],gate:['#54ffe2','#00bbbc','#0f7a9e','#c5fff5','#087886','#07cbb9'],pylon:['#37577b','#314764','#233954','#447298','#122d43','#28486d'],hero:['#ffb158','#e87b43','#ae4d32','#ffd98a','#954122','#d06a3b'],helmet:['#5cfde8','#29c5c8','#128694','#a4fff3','#147b8b','#35ced4'],leg:['#ddf0ff','#9fb9dd','#6785a8','#faffff','#5e6d96','#90add2'],black:['#14203c','#203654','#0c162e','#324866','#071027','#1b2c4b'],crystal:['#4ffff1','#1bdbce','#2a9fde','#bafff9','#159abf','#08c4d7']};
function box3(x,y,z,sx,sy,sz,pal,rotX=0,rotY=0){const cs=Math.cos(rotX),ss=Math.sin(rotX),cy=Math.cos(rotY),syy=Math.sin(rotY),p=[];for(const xx of [-1,1])for(const yy of [-1,1])for(const zz of [-1,1]){let ax=xx*sx/2,ay=yy*sy/2,az=zz*sz/2;let by=ay*cs-az*ss,bz=ay*ss+az*cs;let rx=ax*cy+bz*syy,rz=-ax*syy+bz*cy;p.push([x+rx,y+by,z+rz]);}const faces=[[0,2,6,4],[1,5,7,3],[0,1,3,2],[4,6,7,5],[2,3,7,6],[0,4,5,1]];for(let i=0;i<faces.length;i++)face(faces[i].map(k=>p[k]),pal[i]);}
function diamond(x,y,z,t){const a=Math.sin(t)*.2;const spin=t*1.5;const s=.42;const side=[];for(let i=0;i<4;i++){const q=i*Math.PI/2+spin;side.push([x+Math.cos(q)*s,y+a,z+Math.sin(q)*s]);}const top=[x,y+.77+a,z],bot=[x,y-.51+a,z];for(let i=0;i<4;i++){face([top,side[i],side[(i+1)%4]],themes.crystal[i%4],.95);face([bot,side[(i+1)%4],side[i]],themes.crystal[(i+2)%4],.88);}}
function addTrack(){const offset=worldScroll%10;for(let i=0;i<12;i++){const z=-4+i*10-offset;if(z>102||z+10<-10)continue;quad([-4.05,-.17,z], [4.05,-.17,z],[4.05,-.17,z+10],[-4.05,-.17,z+10],i%2?'#131d3b':'#172443');for(const x of [-1.35,1.35]){for(const z0 of [z+.4,z+5.4]){quad([x-.035,-.15,z0],[x+.035,-.15,z0],[x+.035,-.15,z0+2.8],[x-.035,-.15,z0+2.8], '#64c4e85c');}}
for(const x of [-4.13,4.13]){box3(x,-.03,z+5,.11,.12,9.94,themes.helmet);box3(x*1.1,.6,z+5,.16,1.25,9.5,themes.dark);}
for(const x of [-6.7,6.7]){box3(x, -.21,z+5,4.9,.2,10, themes.road);}
if(i%2===0){const zz=z+4;for(const x of [-5.05,5.05]){box3(x,1.05,zz,.22,2,.24,themes.pylon);box3(x,2.2,zz,.55,.3,.48,themes.helmet);}}
if(i%3===0){for(const side of [-1,1]){const x=side*(9.8+(i%2)*.8),height=(i*7%4+3)*2.3;box3(x,height/2,z+6,5.4,height,7,themes.dark);box3(x-side*2, Math.min(height-1,5),z+2,.26,1.7,.4,themes.helmet);}}}}
function drawPuddles(){
 if(game.rain<.12)return;
 for(const p of puddles){if(p.z>100||p.z<-5)continue;
  const x=p.x,z=p.z,rx=p.rx,rz=p.rz;
  const alpha=.32+.34*game.rain;
  face([[x-rx,-.145,z-rz],[x+rx,-.145,z-rz],[x+rx*.8,-.145,z+rz],[x-rx*.8,-.145,z+rz]],'#2287ae',alpha);
  face([[x-rx*.75,-.14,z-rz*.45],[x+rx*.54,-.14,z-rz*.54],[x+rx*.61,-.14,z-rz*.32],[x-rx*.56,-.14,z-rz*.2]],'#b8faff',alpha*.6);
  const ripple=.38+.13*Math.sin(game.clock*4+p.seed);
  face([[x-rx*ripple,-.135,z-.04],[x+rx*ripple,-.135,z-.04],[x+rx*ripple,-.135,z+.10],[x-rx*ripple,-.135,z+.10]],'#a9e9ff',.42*game.rain);
 }
}
function addObstacle(o){if(o.z<-5||o.z>100)return;const {x,z,type}=o;if(type==='block'){box3(x,1.35,z,1.88,2.65,1.4,themes.block);box3(x,1.46,z-.73,1.1,.68,.12,themes.black);for(let j=0;j<3;j++)box3(x-.61+j*.62,2.52,z-.76,.28,.12,.11,themes.helmet);}else if(type==='hurdle'){box3(x,.51,z,2.1,1.02,.58,themes.hurdle);box3(x,.74,z-.34,1.56,.14,.12,themes.black);box3(x,.3,z-.34,1.56,.14,.12,themes.black);}else{box3(x-1.04,1.16,z,.28,2.3,.56,themes.gate);box3(x+1.04,1.16,z,.28,2.3,.56,themes.gate);box3(x,2.09,z,2.26,.56,.58,themes.gate);box3(x,1.94,z-.37,1.65,.12,.12,themes.helmet);}}
// The exact same 3D geometry is reposed frame to frame; no cutouts or sprite swaps.
const ninjaMat={
 cloth:['#171c2b','#252a3d','#343849','#22273a','#101525','#394052'],
 armor:['#242d3e','#3f475b','#535d72','#303a4d','#121a28','#5a6576'],
 deep:['#0d111d','#161b29','#202839','#171e2b','#090c16','#293042'],
 red:['#8b1226','#be2638','#df3947','#aa1d32','#620b20','#f05a59'],
 gold:['#b47429','#e4a64b','#f5c86d','#db923b','#784519','#ffe09d'],
 skin:['#b7835e','#e8aa7c','#f8c69e','#d1956d','#956040','#f7d3b1'],
 eyes:['#cbbaa0','#f8efcf','#ffffff','#e6d4a6','#aa8d70','#ffffff']
};
function sat(v){return Math.max(0,Math.min(1,v));}
function mixn(a,b,t){return a+(b-a)*t;}
function rotX(p,a){const ca=Math.cos(a),sa=Math.sin(a);return [p[0],p[1]*ca-p[2]*sa,p[1]*sa+p[2]*ca];}
function plus(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
function vec(x,y,z){return [x,y,z];}
function orb3(center,radii,colors,levels=4,sides=8){
 const v=[];for(let j=0;j<=levels;j++){
 const lat=-Math.PI/2+j*Math.PI/levels,rg=Math.cos(lat),ny=Math.sin(lat),ring=[];
 for(let i=0;i<sides;i++){const th=i*2*Math.PI/sides;ring.push([center[0]+Math.sin(th)*rg*radii[0],center[1]+ny*radii[1],center[2]+Math.cos(th)*rg*radii[2]]);}
 v.push(ring);
 }
 for(let j=0;j<levels;j++)for(let i=0;i<sides;i++){
 const color=colors[(i+Math.floor(j/2))%colors.length];
 face([v[j][i],v[j][(i+1)%sides],v[j+1][(i+1)%sides],v[j+1][i]],color);
 }
}
function rod3(a,b,r,pal,width=.95){
 const dy=b[1]-a[1],dz=b[2]-a[2],dx=b[0]-a[0],n=Math.hypot(dx,dy,dz)||1;
 // create a cylindrical cross-section with a stable reference axis
 let ux=1,uy=0,uz=0;
 if(Math.abs(dx/n)>.93){ux=0;uy=0;uz=1;}
 const vx=dy*uz-dz*uy,vy=dz*ux-dx*uz,vz=dx*uy-dy*ux,vn=Math.hypot(vx,vy,vz)||1;
 const cx=vy*dz-vz*dy,cy=vz*dx-vx*dz,cz=vx*dy-vy*dx,cn=Math.hypot(cx,cy,cz)||1;
 const pa=[],pb=[],steps=7;
 for(let i=0;i<steps;i++){
 const t=i*2*Math.PI/steps,co=Math.cos(t),si=Math.sin(t);
 const u=[vx/vn*co+cx/cn*si,vy/vn*co+cy/cn*si,vz/vn*co+cz/cn*si];
 pa.push([a[0]+u[0]*r,a[1]+u[1]*r,a[2]+u[2]*r]);
 pb.push([b[0]+u[0]*r*width,b[1]+u[1]*r*width,b[2]+u[2]*r*width]);
 }
 for(let i=0;i<steps;i++)face([pa[i],pa[(i+1)%steps],pb[(i+1)%steps],pb[i]],pal[i%pal.length]);
}
function animateNinja(dt){
 const f=(target,source,rate)=>mixn(source,target,1-Math.exp(-Math.min(.06,dt)*rate));
 const active=game.phase==='playing';
 game.poseRun=f(active&&!game.trainingRest?1:0,game.poseRun,8.2);
 game.poseSlide=f(active&&game.roll>0?1:0,game.poseSlide,14);
 game.poseAir=f(active&&game.y>.08?1:0,game.poseAir,12);
 game.poseDash=f(active&&game.boost>0?1:0,game.poseDash,9);
 game.landPulse=Math.max(0,game.landPulse-dt*4.8);
 game.takeoffPulse=Math.max(0,game.takeoffPulse-dt*8.5);
 game.hitPulse=Math.max(0,game.hitPulse-dt*3.0);
 game.animCycle+=dt*(active?(8.5+game.speed*.32)*(1-.17*game.wet):1.7);
}
function hero(){
 if(game.invul>0&&Math.sin(game.clock*26)>.8)return;
 const pi=Math.PI,ph=game.animCycle,s=Math.sin(ph),run=game.poseRun*(1-game.poseSlide)*(1-game.poseAir),air=game.poseAir,slide=game.poseSlide,boost=game.poseDash;
 const targetX=lanes[game.lane],bank=Math.max(-.22,Math.min(.22,(targetX-game.x)*-.105))+game.slipVelocity*.035;
 const bob=run*(.038+.047*Math.abs(s))+(1-game.poseRun)*.023*Math.sin(game.clock*2.5);
 const hipY=game.y+1.11-.55*slide-.17*game.landPulse-.06*game.takeoffPulse+bob;
 const hip=vec(game.x,hipY,0);
 const torsoPitch=.09*run+slide*1.19-air*.13+boost*.25+game.landPulse*.25+game.wet*.09;
 const rotateBody=p=>plus(hip,rotX(p,torsoPitch));
 const chest=rotateBody(vec(0,.42,0)),neck=rotateBody(vec(0,.82,0)),head=rotateBody(vec(0,1.17,0));
 // feet and knees articulated through real joint positions (not up/down box tricks)
 const legPoints=[];
 for(let i=0;i<2;i++){
 const side=i===0?-1:1,cycle=i===0?s:-s;
 const lift=Math.max(0,Math.sin(ph+1+(i?pi:0)));
 let hx=run*(-cycle*.67-.10),kx=run*(.12+lift*.86);
 hx=mixn(hx,i===0?-.47:.51,air);kx=mixn(kx,i===0?.85:.68,air);
 hx=mixn(hx,i===0?-1.27:.96,slide);kx=mixn(kx,i===0?.31:1.55,slide);
 hx+=game.landPulse*(i===0?-.19:.18);kx+=game.landPulse*.53;
 const upper=plus(hip,vec(side*.245,-.23,0));
 const knee=plus(upper,rotX(vec(0,-.44,0),hx));
 const ankle=plus(knee,rotX(vec(0,-.39,0),hx+kx));
 legPoints.push({side,upper,knee,ankle,hx,kx});
 rod3(upper,knee,.205,ninjaMat.cloth,.94);
 orb3(knee,vec(.195,.16,.19),ninjaMat.armor,3,7);
 rod3(knee,ankle,.15,ninjaMat.cloth,.83);
 rod3(plus(knee,vec(0,-.17,.01)),plus(knee,vec(0,-.26,.01)),.162,ninjaMat.armor);
 orb3(plus(ankle,vec(0,-.09,.15)),vec(.215,.16,.34),ninjaMat.deep,3,8);
 orb3(plus(ankle,vec(0,-.17,.17)),vec(.225,.055,.33),ninjaMat.gold,2,8);
 }
 // pelvis and tabard, scarf-belt visible from the back
 orb3(hip,vec(.44,.28,.30),ninjaMat.cloth,4,8);
 orb3(plus(hip,vec(0,.12,0)),vec(.45,.14,.325),ninjaMat.red,3,8);
 box3(hip[0]-.31,hip[1]-.29,hip[2]-.015,.24,.48,.31,ninjaMat.cloth);
 box3(hip[0]+.31,hip[1]-.29,hip[2]-.015,.24,.48,.31,ninjaMat.cloth);
 // torso is a rounded form with layered armor and raised back plate
 orb3(plus(chest,vec(0,.08,0)),vec(.50,.44,.33),ninjaMat.cloth,4,9);
 orb3(plus(chest,vec(0,.1,-.31)),vec(.37,.28,.095),ninjaMat.armor,3,8);
 const strapA=plus(chest,vec(-.29,.33,-.40)),strapB=plus(chest,vec(.27,-.25,-.39));rod3(strapA,strapB,.058,ninjaMat.deep);
 const swordBot=plus(chest,vec(-.27,-.45,-.48)),swordTop=plus(chest,vec(.39,.55,-.47));
 rod3(swordBot,swordTop,.062,ninjaMat.deep);rod3(swordTop,plus(swordTop,vec(.18,.28,0)),.056,ninjaMat.gold);
 orb3(plus(neck,vec(0,-.02,0)),vec(.41,.15,.39),ninjaMat.red,3,8);
 // two independent elbow joints and detailed gauntlets
 for(let i=0;i<2;i++){
 const side=i===0?-1:1,cycle=i===0?s:-s;
 const shoulder=plus(rotateBody(vec(side*.57,.29,0)),vec(0,0,0));
 let ax=run*(cycle*.55-.26),ex=run*(.67+.21*Math.max(0,-cycle));
 ax=mixn(ax,-1.06,air);ex=mixn(ex,.42,air);
 ax=mixn(ax,i===0?-.82:1.14,slide);ex=mixn(ex,i===0?.46:1.95,slide);
 ax=mixn(ax,-.62,boost);ex=mixn(ex,.98,boost);
 ax+=game.hitPulse*side*.35;
 const elbow=plus(shoulder,rotX(vec(side*.045,-.42,0),ax));
 const wrist=plus(elbow,rotX(vec(0,-.38,0),ax+ex));
 orb3(shoulder,vec(.18,.16,.19),ninjaMat.armor,3,7);
 rod3(shoulder,elbow,.145,ninjaMat.cloth);
 orb3(elbow,vec(.145,.14,.145),ninjaMat.red,3,7);
 rod3(elbow,wrist,.15,ninjaMat.armor);
 orb3(wrist,vec(.15,.17,.16),ninjaMat.deep,3,7);
 }
 // Hood, mask, headband, back insignia and low-cost facet highlights.
 orb3(plus(head,vec(0,.10,-.05)),vec(.43,.43,.39),ninjaMat.cloth,4,10);
 orb3(plus(head,vec(0,-.075,.27)),vec(.31,.18,.14),ninjaMat.deep,3,8);
 // A red seam on the rear of the hood. The face/eyes are on +Z (ahead of the runner).
 rod3(plus(head,vec(-.32,.26,-.28)),plus(head,vec(.32,.26,-.28)),.048,ninjaMat.red);
 orb3(plus(head,vec(0,.21,-.395)),vec(.10,.10,.04),ninjaMat.gold,3,7);
 for(let i=0;i<2;i++){
 const sx=i===0?-1:1;
 orb3(plus(head,vec(sx*.15,.09,.343)),vec(.11,.06,.04),ninjaMat.eyes,2,7);
 }
 // Fabric tails follow the upper body, with independently delayed flutter.
 for(let i=0;i<2;i++){
 const side=i===0?-1:1,fl=Math.sin(game.clock*(6.3+game.speed*.09)+i*1.8),fl2=Math.sin(game.clock*(6.3+game.speed*.09)-.9+i*1.8);
 const begin=plus(neck,vec(side*.20,.06,-.32));
 const mid=plus(begin,vec(side*(.20+.08*fl),.10+.13*fl,-.76));
 const end=plus(mid,vec(side*(.24+.09*fl2),.11+.19*fl2+.1*boost,-.72));
 rod3(begin,mid,.105,ninjaMat.red,.95);
 rod3(mid,end,.085,ninjaMat.red,.42);
 orb3(end,vec(.09,.055,.07),ninjaMat.gold,2,6);
 }
 if(boost){for(let j=0;j<3;j++)box3(game.x+Math.sin(game.clock*8+j)*.20,game.y+.42,1+j*.84,.15,.06,.8,themes.crystal);}
}
function hexRgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function mixHex(a,b,t){const x=hexRgb(a),y=hexRgb(b);return '#'+x.map((n,i)=>Math.round(n+(y[i]-n)*t).toString(16).padStart(2,'0')).join('');}
function background(){
 const day=game.dayLight,rain=game.rain;
 const sky=ctx.createLinearGradient(0,0,0,H);
 sky.addColorStop(0,mixHex('#070b21','#83c4f3',day*(1-rain*.58)));
 sky.addColorStop(.48,mixHex('#17214c','#b5d9e8',day*(1-rain*.70)));
 sky.addColorStop(.77,mixHex('#442951','#f4d1a1',day*(1-rain*.75)));
 sky.addColorStop(1,mixHex('#07152e','#598d9c',day*(1-rain*.68)));
 ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
 if(rain>.01){ctx.fillStyle=`rgba(9,18,34,${rain*.39})`;ctx.fillRect(0,0,W,H);}
 const night=1-day;
 if(night>.02){for(const p of twinkles){const a=(.3+.6*Math.sin(game.clock*.6+p[3]))*night*(1-rain*.8);ctx.fillStyle=`rgba(179,230,255,${a*.67})`;ctx.fillRect(p[0]*W,p[1]*H,p[2],p[2]);}}
 const horizon=H*.51;ctx.fillStyle=mixHex('#09152b','#466875',day*.8);
 for(let i=0;i<28;i++){const ww=W/22,xx=i*ww-W*.1,h=H*(.05+(i*13%8)*.018);ctx.fillRect(xx,horizon-h,ww*.86,h);}
 const sunX=W*.54,sunY=H*(.30+(1-day)*.09),sunR=Math.min(W,H)*.072;
 const sg=ctx.createRadialGradient(sunX,sunY,2,sunX,sunY,sunR*2.7);
 sg.addColorStop(0,`rgba(255,223,147,${.23*day})`);sg.addColorStop(1,'transparent');ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);
 ctx.fillStyle=`rgba(255,241,197,${day*(1-rain*.8)})`;ctx.beginPath();ctx.arc(sunX,sunY,sunR,0,Math.PI*2);ctx.fill();
 if(day<.4){const moonX=W*.65,moonY=H*.24,moonR=Math.min(W,H)*.040;
 ctx.fillStyle=`rgba(213,234,255,${(.4-day)*1.7*(1-rain*.65)})`;ctx.beginPath();ctx.arc(moonX,moonY,moonR,0,7);ctx.fill();}
 if(rain>.04){
 const cloud=ctx.createLinearGradient(0,0,0,H*.51);
 cloud.addColorStop(0,`rgba(17,29,43,${rain*.72})`);
 cloud.addColorStop(1,'rgba(22,32,47,0)');ctx.fillStyle=cloud;ctx.fillRect(0,0,W,H*.53);
 }
}
function drawRain(){
 const rain=game.rain;if(rain<.02)return;
 ctx.save();ctx.lineWidth=1.05;
 const count=Math.floor((W>700?115:75)*rain);
 for(let i=0;i<count;i++){
  const seed=i*741.7,xd=(Math.sin(seed*2.123)*91341)%1,yd=(Math.sin(seed*.63)*11243)%1;
  const x=((Math.abs(xd)*W+game.clock*(105+((i%5)*12)))%(W+50))-25;
  const y=((Math.abs(yd)*H+game.clock*(580+(i%7)*19))%(H+90))-45;
  ctx.strokeStyle=i%4?'rgba(189,224,255,.37)':'rgba(239,251,255,.63)';
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6*rain,y+14+13*rain);ctx.stroke();
 }
 // Water surface flicker close to the player.
 if(game.splash>0){const p=project(game.x,.1,.65);if(p){ctx.strokeStyle=`rgba(196,250,255,${game.splash*.8})`;ctx.lineWidth=2;for(let j=0;j<6;j++){const a=(j/6)*Math.PI;ctx.beginPath();ctx.moveTo(p[0]-Math.cos(a)*25,p[1]-Math.sin(a)*9);ctx.lineTo(p[0]-Math.cos(a)*47,p[1]-Math.sin(a)*24);ctx.stroke();}}}
 ctx.restore();
}
function render(){background();draws.length=0;renderLayer=0;ctx.save();if(game.shake>0){ctx.translate(rand(-1,1)*game.shake*18,rand(-1,1)*game.shake*10);}addTrack();drawPuddles();renderLayer=1;for(const o of obstacles)addObstacle(o);for(const g of gems){if(g.z<95&&g.z>-3)diamond(g.x,1.65,g.z,g.t);}hero();draws.sort((a,b)=>a.layer-b.layer||b.dep-a.dep);for(const d of draws){ctx.globalAlpha=d.alpha;ctx.fillStyle=d.color;ctx.beginPath();ctx.moveTo(d.pts[0][0],d.pts[0][1]);for(let i=1;i<d.pts.length;i++)ctx.lineTo(d.pts[i][0],d.pts[i][1]);ctx.closePath();ctx.fill();}ctx.globalAlpha=1;ctx.restore();const g=ctx.createLinearGradient(0,H*.61,0,H);g.addColorStop(0,'transparent');g.addColorStop(1,'#060d2790');ctx.fillStyle=g;ctx.fillRect(0,H*.61,W,H*.39);drawRain();
if(game.boost>0){ctx.fillStyle='#28f8e509';ctx.fillRect(0,0,W,H);ctx.strokeStyle='#64fff173';ctx.lineWidth=2;for(let i=0;i<18;i++){const z=(i*9+worldScroll*1.4)%83+4;const x=((i*31)%13-6)*.65;const p=project(x,.7,z),q=project(x,.7,z+3);if(p&&q){ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.stroke();}}}}
function raf(now){const dt=Math.min((now-last)/1000||0,.045);last=now;tick(dt);render();requestAnimationFrame(raf);}requestAnimationFrame(raf);
hud.start.addEventListener('click',()=>game.phase==='paused'?pause():reset());
$('training').addEventListener('click',()=>{reset();game.training=true;game.energy=100;obstacles.length=0;gems.length=0;$('practiceBar').classList.remove('hide');toast('MODO TREINO · TESTE OS MOVIMENTOS');updateUI();});
$('restBtn').addEventListener('click',()=>action('rest'));$('pause').addEventListener('click',pause);document.querySelectorAll('[data-action]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();action(b.dataset.action);});});
addEventListener('keydown',e=>{let a='';switch(e.code){case'ArrowLeft':case'KeyA':a='left';break;case'ArrowRight':case'KeyD':a='right';break;case'ArrowUp':case'KeyW':case'Space':a='jump';break;case'ArrowDown':case'KeyS':a='slide';break;case'KeyE':case'ShiftLeft':case'ShiftRight':a='boost';break;case'KeyP':case'Escape':a='pause';break;case'KeyR':a='rest';break;case'KeyT':if(game.training&&game.phase==='playing'){const step=[14,35,70,90,106,122,161,180];const phase=game.weatherTime%180;game.weatherTime+=((step.find(x=>x>phase+1)||194)-phase);toast('⏩ CLIMA AVANÇADO NO TREINO');}break;case'Enter':if(game.phase==='menu'||game.phase==='over')a='start';else if(game.phase==='paused')a='pause';break;}if(a){e.preventDefault();if(!e.repeat)action(a);}});
let touch=null;c.addEventListener('pointerdown',e=>{touch={x:e.clientX,y:e.clientY,time:performance.now()};c.setPointerCapture?.(e.pointerId);});c.addEventListener('pointerup',e=>{if(!touch)return;const dx=e.clientX-touch.x,dy=e.clientY-touch.y;if(Math.max(Math.abs(dx),Math.abs(dy))>24){action(Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'jump':'slide'));}else if(game.phase==='playing'){action(e.clientX<W*.5?'left':'right');}touch=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='playing')pause();});
// Preview the world on the menu without starting the game.
for(let i=0;i<10;i++){obstacles.push({x:lanes[i%3],z:20+i*11,type:i%3===0?'block':i%3===1?'hurdle':'gate',hit:false});gems.push({x:lanes[(i+1)%3],z:16+i*7,t:i,got:false});}
})();