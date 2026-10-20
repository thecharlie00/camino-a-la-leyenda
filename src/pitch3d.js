/* Prototipo 3D experimental para el partido en directo.
 * Activación: añadir ?pitch3d=1 a la URL o establecer localStorage
 * "camino.pitch3d" = "1". Sin dependencias externas: WebGL 1.
 * Conserva la API pública de Pitch; el motor 2D sigue siendo el fallback.
 */
var Pitch3D = (function () {
  "use strict";
  var LEN = 105, WID = 68, ctx = null, raf = 0, gl = null, canvas = null;
  var program = null, buffer = null, locations = null, teams = [[], []], state = {own: 0, bx: 50, speed: 1};
  var opts = {}, host = null, frozen = false, last = 0, disposed = false, ball = {x: 52.5, z: 34, y: 0.28, vx: 0, vz: 0, vy: 0}, action = {until: 0, side: 0, who: -1, kind: "", phase: 0}, camera = {x: 52.5, z: 34};
  var colors = ["#f5b326", "#5db8ff"], meshes = [];
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function color(hex) {
    var s = String(hex || "#ffffff").replace("#", "");
    if (s.length === 3) s = s.split("").map(function (x) { return x + x; }).join("");
    var n = parseInt(s, 16); if (!isFinite(n)) n = 0xffffff;
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader error");
    return s;
  }
  function initGL() {
    gl = canvas.getContext("webgl", {alpha: false, antialias: true, powerPreference: "low-power"}) ||
      canvas.getContext("experimental-webgl");
    if (!gl) throw new Error("WebGL no disponible");
    var vs = shader(gl.VERTEX_SHADER,
      "attribute vec3 aPos; attribute vec3 aCol; uniform mat4 uMvp; varying vec3 vCol;" +
      "void main(){gl_Position=uMvp*vec4(aPos,1.0);vCol=aCol;}");
    var fs = shader(gl.FRAGMENT_SHADER,
      "precision mediump float; varying vec3 vCol; void main(){gl_FragColor=vec4(vCol,1.0);}");
    program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || "link error");
    gl.useProgram(program); buffer = gl.createBuffer();
    locations = {pos: gl.getAttribLocation(program, "aPos"), col: gl.getAttribLocation(program, "aCol"),
      mvp: gl.getUniformLocation(program, "uMvp")};
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.clearColor(0.035, 0.16, 0.09, 1);
    /* Mantener ambas caras: las marcas del césped son polígonos planos. */
  }
  function matMul(a, b) {
    var o = new Float32Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++)
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function perspective(fov, aspect, near, far) {
    var f = 1 / Math.tan(fov / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function lookAt(eye, center, up) {
    var z = norm([eye[0]-center[0], eye[1]-center[1], eye[2]-center[2]]);
    var x = norm(cross(up, z)), y = cross(z, x);
    return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
      -dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  }
  function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function norm(a){var n=Math.sqrt(dot(a,a))||1;return [a[0]/n,a[1]/n,a[2]/n];}
  function tri(out, a, b, c, col) {
    [a,b,c].forEach(function(p){out.push(p[0],p[1],p[2],col[0],col[1],col[2]);});
  }
  function quad(out, a,b,c,d,col){tri(out,a,b,c,col);tri(out,a,c,d,col);}
  function box(out,x,y,z,w,h,d,col) {
    var x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2;
    quad(out,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],col);
    quad(out,[x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1],col);
    quad(out,[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],col);
    quad(out,[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0],col);
    quad(out,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],col);
  }
  function line(out,x1,z1,x2,z2,col,width) {
    var dx=x2-x1,dz=z2-z1,n=Math.sqrt(dx*dx+dz*dz)||1,ox=-dz/n*(width||0.12),oz=dx/n*(width||0.12);
    quad(out,[x1+ox,0.035,z1+oz],[x2+ox,0.035,z2+oz],[x2-ox,0.035,z2-oz],[x1-ox,0.035,z1-oz],col);
  }
  function circle(out,cx,cz,r,col) {
    for(var i=0;i<48;i++){var a=i*Math.PI*2/48,b=(i+1)*Math.PI*2/48;
      tri(out,[cx,0.04,cz],[cx+Math.cos(a)*r,0.04,cz+Math.sin(a)*r],[cx+Math.cos(b)*r,0.04,cz+Math.sin(b)*r],col);}
  }
  function field(out) {
    var green=[0.08,0.37,0.17], stripe=[0.09,0.41,0.19], white=[0.88,0.94,0.88];
    quad(out,[0,0,0],[LEN,0,0],[LEN,0,WID],[0,0,WID],green);
    for(var i=0;i<10;i++) if(i%2===0) quad(out,[i*LEN/10,0.01,0],[(i+1)*LEN/10,0.01,0],[(i+1)*LEN/10,0.01,WID],[i*LEN/10,0.01,WID],stripe);
    line(out,0,0,LEN,0,white,0.13); line(out,LEN,0,LEN,WID,white,0.13);
    line(out,LEN,WID,0,WID,white,0.13); line(out,0,WID,0,0,white,0.13);
    line(out,LEN/2,0,LEN/2,WID,white,0.12); circle(out,LEN/2,WID/2,9.15,white);
    circle(out,LEN/2,WID/2,8.98,green);
    /* áreas y porterías estilizadas */
    [0,LEN].forEach(function(end){
      var dir=end===0?1:-1, x=end;
      line(out,x, WID/2-20.16,x+dir*16.5,WID/2-20.16,white,0.12);
      line(out,x+dir*16.5,WID/2-20.16,x+dir*16.5,WID/2+20.16,white,0.12);
      line(out,x+dir*16.5,WID/2+20.16,x,WID/2+20.16,white,0.12);
      line(out,x,WID/2-9.16,x+dir*5.5,WID/2-9.16,white,0.1);
      line(out,x+dir*5.5,WID/2-9.16,x+dir*5.5,WID/2+9.16,white,0.1);
      line(out,x+dir*5.5,WID/2+9.16,x,WID/2+9.16,white,0.1);
      line(out,x,WID/2-3.66,x+dir*2.0,WID/2-3.66,white,0.08);
      line(out,x+dir*2.0,WID/2-3.66,x+dir*2.0,WID/2+3.66,white,0.08);
      line(out,x+dir*2.0,WID/2+3.66,x,WID/2+3.66,white,0.08);
      /* Porterías tridimensionales sencillas: postes, larguero y fondo de red */
      var post=[0.94,0.96,0.91], face=end===0?0:LEN, gx=end===0?-1.9:LEN+1.9;
      box(out,face,0,WID/2-3.66,0.22,2.44,0.22,post);
      box(out,face,0,WID/2+3.66,0.22,2.44,0.22,post);
      box(out,face,2.38,WID/2,0.22,0.18,7.54,post);
      box(out,gx,0,WID/2-3.66,0.12,2.35,0.12,post);
      box(out,gx,0,WID/2+3.66,0.12,2.35,0.12,post);
      box(out,gx,2.3,WID/2,0.12,0.12,7.4,post);
      line(out,face,WID/2-3.66,gx,WID/2-3.66,[0.72,0.82,0.75],0.045);
      line(out,face,WID/2+3.66,gx,WID/2+3.66,[0.72,0.82,0.75],0.045);
      line(out,gx,WID/2-3.66,gx,WID/2+3.66,[0.72,0.82,0.75],0.045);
    });
    /* Vallas bajas para dar escala al campo sin añadir texturas pesadas */
    var board=[0.13,0.25,0.28];
    for(var bx=5;bx<LEN;bx+=10){
      box(out,bx,0.48,-1.35,8.5,0.9,0.22,board);
      box(out,bx,0.48,WID+1.35,8.5,0.9,0.22,board);
    }
  }
  var base = {POR:[5,.5],LD:[25,.83],LI:[25,.17],DFC:[22,.39],MCD:[38,.5],MC:[48,.32],MCO:[60,.5],MD:[48,.84],MI:[48,.16],ED:[73,.82],EI:[73,.18],DC:[78,.5]};
  function posFor(p,i,side) {
    var b=base[p&&p.pos]||[25+(i%4)*14,.25+((i*7)%7)*.08];
    var x=side===1?LEN-b[0]:b[0],z=b[1]*WID;
    if(p&&p._p3){x=p._p3.x;z=p._p3.z;}
    return [x,z];
  }
  function updatePlayers(dt) {
    var k=Math.min(1,dt*1.8), lateral=clamp((ball.z-WID/2)*0.13,-4,4), longitudinal=clamp((ball.x-LEN/2)*0.14,-7,7);
    teams.forEach(function(team,side){
      var nearest=-1,bd=1e9;
      team.forEach(function(p,i){if(!p||p.gone)return;var q=posFor(p,i,side),dx=q[0]-ball.x,dz=q[1]-ball.z,d=dx*dx+dz*dz;if(d<bd){bd=d;nearest=i;}});
      team.forEach(function(p,i){if(!p||p.gone)return;
        var b=base[p.pos]||[25+(i%4)*14,.25+((i*7)%7)*.08];
        var tx=(side===1?LEN-b[0]:b[0])+(side===0?longitudinal:-longitudinal),tz=clamp(b[1]*WID+lateral,3,WID-3);
        if(i===nearest){tx=ball.x+(side===0?-1.2:1.2);tz=ball.z+(i%2?1.2:-1.2);}
        if(!p._p3)p._p3={x:tx,z:tz,phase:i*1.7};
        var dx=tx-p._p3.x,dz=tz-p._p3.z;p._p3.x+=dx*k;p._p3.z+=dz*k;
        p._p3.phase=(p._p3.phase||0)+dt*(3+Math.min(8,Math.sqrt(dx*dx+dz*dz)*1.2));p._p3.run=Math.min(1,Math.sqrt(dx*dx+dz*dz)/3);
      });
    });
  }
  function build() {
    var out=[]; field(out);
    teams.forEach(function(team,side){
      team.forEach(function(p,i){
        if(!p||p.gone)return;
        var q=posFor(p,i,side), x=q[0],z=q[1], c=color(colors[side]);
        /* sombra falsa en el suelo: coste mínimo frente a sombras dinámicas */
        circle(out,x,z,0.62,[0.025,0.11,0.055]);
        /* cuerpo prismático, cabeza y dos piernas: geometría deliberadamente ligera para móvil */
        var ph=p._p3?p._p3.phase:0,run=p._p3?p._p3.run:0,gait=Math.sin(ph)*0.23*run,skin=[0.72,0.52,0.37],shorts=side===0?[0.08,0.12,0.2]:[0.88,0.88,0.82];
        var isActor=action.who===i&&action.side===side&&performance.now()<action.until, kick=isActor&&/shot|goal|save|miss|pen|cross|volley|shoot|tiro|gol|cabeza|head/i.test(action.kind), celebrate=isActor&&/goal|gol|celebr/i.test(action.kind);
        var arm=Math.sin(ph+Math.PI)*0.18*run, swing=kick?Math.sin((performance.now()-(action.until-620))/620*Math.PI)*0.65:0;
        box(out,x,0.45,z,0.78,1.0,0.52,c);
        box(out,x-0.48,0.77,z+gait*0.45,0.19,0.68,0.2,c);
        box(out,x+0.48,0.77,z-gait*0.45,0.19,0.68,0.2,c);
        circle3D(out,x,1.62+(celebrate?0.12*Math.abs(Math.sin(performance.now()/120)):0),z,0.22,skin);
        box(out,x-0.2+gait+swing*0.5,0.05,z,0.19,0.42,0.2,shorts);
        box(out,x+0.2-gait-swing*0.5,0.05,z,0.19,0.42,0.2,shorts);
        box(out,x-0.52,0.83,z+arm,0.17,0.55,0.19,skin);
        box(out,x+0.52,0.83,z-arm+(celebrate?0.24:0),0.17,0.55,0.19,skin);
      });
    });
    /* balón: octaedro pequeño con ligera elevación en la animación */
    var bz=ball.z, by=Math.max(0.18,ball.y||0.26), bx=ball.x, bc=[0.95,0.95,0.9], r=0.28;
    var top=[bx,by+r,bz], bot=[bx,by-r,bz], a=[bx+r,by,bz], b=[bx-r,by,bz], c=[bx,by,bz+r], d=[bx,by,bz-r];
    [[top,a,c],[top,c,b],[top,b,d],[top,d,a],[bot,c,a],[bot,b,c],[bot,d,b],[bot,a,d]].forEach(function(t){tri(out,t[0],t[1],t[2],bc);});
    return new Float32Array(out);
  }
  function circle3D(out,x,y,z,r,col) {
    for(var i=0;i<8;i++){var a=i*Math.PI/4,b=(i+1)*Math.PI/4;
      tri(out,[x,y+r,z],[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],col);}
  }
  function render(ts) {
    if(disposed||!gl)return;
    raf=requestAnimationFrame(render);
    if(document.hidden){last=ts||0;return;}
    var w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight),dpr=Math.min(1.5,window.devicePixelRatio||1);
    if(canvas.width!==Math.floor(w*dpr)||canvas.height!==Math.floor(h*dpr)){canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);}
    var dt=last?Math.min(0.05,Math.max(0,(ts-last)/1000)):0;
    if(!frozen&&last){var target=clamp(state.bx,0,100)*LEN/100;
      if(ts<action.until&&(Math.abs(ball.vx)+Math.abs(ball.vz)>0.01)){
        ball.x+=ball.vx*dt;ball.z+=ball.vz*dt;ball.vx*=Math.pow(0.985,dt*60);ball.vz*=Math.pow(0.985,dt*60);
      }else{
        ball.vx=0;ball.vz=0;
        ball.x+=(target-ball.x)*Math.min(1,dt*1.6*state.speed);ball.z+=(WID/2-ball.z)*Math.min(1,dt*0.8*state.speed);
      }
      ball.vy-=9.8*dt;ball.y+=ball.vy*dt;
      if(ball.y<0.22){ball.y=0.22;ball.vy=Math.abs(ball.vy)*0.28;if(Math.abs(ball.vy)<0.55)ball.vy=0;}
      ball.x=clamp(ball.x,0,LEN);ball.z=clamp(ball.z,0,WID);
      updatePlayers(dt*clamp(+state.speed||1,0.5,3));
      camera.x+=(ball.x-camera.x)*Math.min(1,dt*0.45);camera.z+=(ball.z-camera.z)*Math.min(1,dt*0.25);}
    last=ts||0;
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    var data=build();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
    gl.useProgram(program);gl.enableVertexAttribArray(locations.pos);gl.enableVertexAttribArray(locations.col);
    gl.vertexAttribPointer(locations.pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(locations.col,3,gl.FLOAT,false,24,12);
    var view=lookAt([camera.x,98,camera.z+78],[camera.x,0,camera.z],[0,1,0]), proj=perspective(Math.PI/3,canvas.width/canvas.height,0.1,300);
    gl.uniformMatrix4fv(locations.mvp,false,matMul(proj,view));gl.drawArrays(gl.TRIANGLES,0,data.length/6);
  }
  function mount(el,o){
    destroy();host=el;opts=o||{};colors=opts.cols||colors;disposed=false;frozen=false;
    canvas=document.createElement("canvas");canvas.className="lpitch lpitch3d";canvas.setAttribute("aria-label","Vista 3D experimental del partido");
    canvas.style.display="block";canvas.style.width="100%";canvas.style.height="100%";canvas.style.minHeight="220px";
    host.appendChild(canvas);
    try{initGL();}catch(e){console.warn("Pitch3D: se activa el campo 2D de reserva",e);destroy();return false;}
    teams=[[],[]];state={own:0,bx:50,speed:1};ball={x:52.5,z:34,y:0.28,vx:0,vz:0,vy:0};action={until:0,side:0,who:-1,kind:"",phase:0};camera={x:52.5,z:34};last=0;
    raf=requestAnimationFrame(render);return true;
  }
  function destroy(){disposed=true;if(raf)cancelAnimationFrame(raf);raf=0;if(gl){try{if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);}catch(e){}}gl=null;buffer=null;program=null;locations=null;
    if(canvas&&canvas.parentNode)canvas.parentNode.removeChild(canvas);canvas=null;host=null;teams=[[],[]];}
  function api(){return {mount:mount,teams:function(a,b){teams=[a||[],b||[]];},state:function(s){if(s)state=Object.assign(state,s);},
    event:function(e){if(!e)return;if(e.side!=null)state.own=e.side;var kind=(String(e.t||"")+" "+String(e.k||"")+" "+String(e.txt||"")).toLowerCase(),who=e.who!=null&&Number.isFinite(+e.who)?+e.who:-1,side=e.side===1?1:0,isGoal=/goal|gol/i.test(String(e.t||"")+" "+String(e.k||"")),isShot=/shot|shoot|tiro|penalty|penal|save|miss|post|head|volley|oneone|chut/i.test(kind),isPass=/pass|cross|through|pase|centro|corner/i.test(kind);action={until:performance.now()+(isGoal?2300:1100),side:side,who:who,kind:kind,phase:performance.now()};if(isShot||isGoal){var dir=side===0?1:-1;ball.vx=dir*(isGoal?26:22);ball.vz=clamp((WID/2-ball.z)*0.6,-7,7);ball.vy=isGoal?4.5:3.2;state.bx=side===0?98:2;}else if(isPass){ball.vx=(side===0?1:-1)*10;ball.vz=clamp((WID/2-ball.z)*0.22,-3,3);ball.vy=1.2;action.until=performance.now()+650;}if(typeof e.cue==="function")setTimeout(e.cue,120);},
    busy:function(){return 0;},reset:function(){ball={x:LEN/2,z:WID/2,y:0.28,vx:0,vz:0,vy:0};action={until:0,side:0,who:-1,kind:"",phase:0};camera={x:LEN/2,z:WID/2};},freeze:function(v){frozen=!!v;},destroy:destroy};}
  return api();
})();
(function(){
  var enabled=false;
  try{enabled=/(?:^|[?&])pitch3d=1(?:&|$)/.test(window.location.search)||window.localStorage.getItem("camino.pitch3d")==="1";}catch(e){}
  if(typeof Pitch==="undefined"||typeof Pitch3D==="undefined")return;
  var original=Pitch, originalApi={}, mounted=false, host=null, mountOpts=null, toggle=null, switching=false;
  ["mount","teams","state","event","busy","reset","freeze","destroy"].forEach(function(k){originalApi[k]=original[k];});
  function setMode(want3d){
    if(!host||switching)return;switching=true;
    try{
      if(mounted)Pitch3D.destroy();else originalApi.destroy();
      mounted=false;
      if(want3d){
        mounted=Pitch3D.mount(host,mountOpts||{});
        if(!mounted)originalApi.mount(host,mountOpts||{});
      }else originalApi.mount(host,mountOpts||{});
      try{window.localStorage.setItem("camino.pitch3d",mounted?"1":"0");}catch(e){}
      if(toggle){toggle.textContent=mounted?"3D · volver a 2D":"Probar vista 3D";toggle.setAttribute("aria-pressed",mounted?"true":"false");}
    }catch(e){console.warn("Pitch3D: cambio de vista fallido",e);try{Pitch3D.destroy();originalApi.mount(host,mountOpts||{});}catch(ignore){}mounted=false;}
    switching=false;
  }
  Pitch.mount=function(el,o){
    host=el;mountOpts=o||{};
    if(!toggle){
      toggle=document.createElement("button");toggle.type="button";toggle.className="p3dtoggle";
      toggle.style.cssText="position:absolute;z-index:20;top:6px;right:6px;padding:6px 9px;border:1px solid rgba(255,255,255,.4);border-radius:6px;background:rgba(8,20,18,.88);color:#fff;font:600 11px system-ui;cursor:pointer";
      toggle.addEventListener("click",function(ev){ev.preventDefault();ev.stopPropagation();setMode(!mounted);});
    }
    if(toggle.parentNode!==host)host.appendChild(toggle);
    setMode(enabled);
  };
  ["teams","state","event","busy","reset","freeze"].forEach(function(k){
    Pitch[k]=function(){var engine=mounted?Pitch3D:originalApi;return engine[k].apply(engine,arguments);};
  });
  Pitch.destroy=function(){
    if(mounted)Pitch3D.destroy();else originalApi.destroy();
    if(toggle&&toggle.parentNode)toggle.parentNode.removeChild(toggle);
    mounted=false;host=null;mountOpts=null;toggle=null;
  };
  /* Selector visible en el partido; 2D sigue siendo la opción predeterminada. */
})();
