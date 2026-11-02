(function(root) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const sub = (a, b) => a.map((x, i) => x - b[i]);
  const scale = (a, s) => a.map(x => x * s);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const unit = a => scale(a, 1 / (Math.hypot(...a) || 1));
  function multiply(a, b) {
    const out = new Float32Array(16);
    for (let col=0; col<4; col++) for (let row=0; row<4; row++)
      for (let k=0; k<4; k++) out[col*4+row] += a[k*4+row] * b[col*4+k];
    return out;
  }
  function perspective(aspect, fov = 42*Math.PI/180) {
    const f=1/Math.tan(fov/2), near=.1, far=100;
    return new Float32Array([f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)/(near-far),-1, 0,0,2*far*near/(near-far),0]);
  }
  function lookAt(eye, target=[0,0,0]) {
    const z=unit(sub(eye,target)), x=unit(cross([0,1,0],z)), y=cross(z,x);
    return new Float32Array([x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0, -dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  }
  function transform(pos, size=[1,1,1], basis=[[1,0,0],[0,1,0],[0,0,1]]) {
    const out=new Float32Array(16);
    for(let col=0;col<3;col++)for(let row=0;row<3;row++)out[col*4+row]=basis[col][row]*size[col];
    out[12]=pos[0];out[13]=pos[1];out[14]=pos[2];out[15]=1;return out;
  }
  function normalMatrix(m) {
    const out=new Float32Array(9);
    for(let col=0;col<3;col++) {
      const norm=m[col*4]**2+m[col*4+1]**2+m[col*4+2]**2;
      for(let row=0;row<3;row++)out[col*3+row]=m[col*4+row]/(norm||1);
    }
    return out;
  }
  function project(p, vp) {
    const q=[0,0,0,0];for(let row=0;row<4;row++)q[row]=vp[row]*p[0]+vp[4+row]*p[1]+vp[8+row]*p[2]+vp[12+row];
    return {x:(q[0]/q[3]+1)/2,y:(1-q[1]/q[3])/2,visible:q[3]>0&&Math.abs(q[2]/q[3])<1};
  }
  function color(hex, alpha=1) {
    return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).concat(alpha);
  }
  function geometry(kind) {
    const positions=[],normals=[],indices=[];
    const vertex=(p,n)=>{positions.push(...p);normals.push(...n);};
    if(kind==='sphere') {
      const lat=12,lon=18;
      for(let i=0;i<=lat;i++)for(let j=0;j<=lon;j++) {
        const p=[Math.sin(i*Math.PI/lat)*Math.cos(j*TAU/lon),Math.cos(i*Math.PI/lat),Math.sin(i*Math.PI/lat)*Math.sin(j*TAU/lon)];vertex(p,p);
      }
      for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const k=i*(lon+1)+j;indices.push(k,k+1,k+lon+1,k+1,k+lon+2,k+lon+1);}
    } else if(kind==='box') {
      const faces=[[[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]], [[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]], [[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]], [[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]], [[0,0,1],[[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]]], [[0,0,-1],[[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]]]];
      faces.forEach(([n,ps])=>{const k=positions.length/3;ps.forEach(p=>vertex(p,n));indices.push(k,k+1,k+2,k,k+2,k+3);});
    } else {
      const cone=kind==='cone',segments=18;
      for(let i=0;i<=segments;i++) {
        const t=i*TAU/segments,x=Math.cos(t),z=Math.sin(t),n=unit([x,cone?1:0,z]);
        vertex([x,-.5,z],n);vertex(cone?[0,.5,0]:[x,.5,z],n);
      }
      for(let i=0;i<segments;i++){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
      for(const top of [false,true]) {
        if(cone&&top)continue;
        const k=positions.length/3,n=[0,top?1:-1,0];vertex([0,top?.5:-.5,0],n);
        for(let i=0;i<=segments;i++){const t=i*TAU/segments;vertex([Math.cos(t),top?.5:-.5,Math.sin(t)],n);}
        for(let i=0;i<segments;i++)top?indices.push(k,k+i+2,k+i+1):indices.push(k,k+i+1,k+i+2);
      }
    }
    return {positions:new Float32Array(positions),normals:new Float32Array(normals),indices:new Uint16Array(indices)};
  }
  const shapes={};
  for(const kind of ['sphere','box','cylinder','cone'])shapes[kind]=geometry(kind);
  const VERTEX=`attribute vec3 aPosition; attribute vec3 aNormal;
    uniform mat4 uModel; uniform mat4 uVP; uniform mat3 uNormal; uniform float uPointSize;
    varying vec3 vNormal; varying vec3 vPosition;
    void main(){vec4 p=uModel*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=uNormal*aNormal;gl_Position=uVP*p;gl_PointSize=uPointSize;}`;
  const FRAGMENT=`precision mediump float;
    uniform vec4 uColor; uniform vec3 uEye; uniform float uUnlit; uniform float uPointMode;
    varying vec3 vNormal; varying vec3 vPosition;
    void main(){if(uPointMode>0.5&&distance(gl_PointCoord,vec2(0.5))>0.5)discard;vec3 n=normalize(vNormal);vec3 light=normalize(vec3(-0.6,1.2,1.0));
      float diffuse=max(dot(n,light),0.0);vec3 h=normalize(light+normalize(uEye-vPosition));
      float spec=pow(max(dot(n,h),0.0),28.0)*0.25;
      vec3 lit=uColor.rgb*(0.38+0.62*diffuse)+vec3(spec);
      gl_FragColor=vec4(mix(lit,uColor.rgb,uUnlit),uColor.a);}`;
  class Renderer {
    constructor(canvas, callbacks={}) {
      this.canvas=canvas;this.callbacks=callbacks;this.camera={yaw:.55,pitch:.32,zoom:1};this.disposed=false;this.lost=false;
      this.gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:false,powerPreference:'low-power'});
      if(!this.gl)throw new Error('WebGL unavailable');
      try{this.init();}catch(e){this.dispose();throw e;}
      this.onLost=e=>{e.preventDefault();if(this.disposed)return;this.lost=true;callbacks.onLost?.();};
      this.onRestored=()=>{if(this.disposed)return;try{this.init();this.lost=false;callbacks.onRestored?.();}catch(e){callbacks.onLost?.();}};
      canvas.addEventListener('webglcontextlost',this.onLost);canvas.addEventListener('webglcontextrestored',this.onRestored);
    }
    init() {
      const gl=this.gl;
      function shader(kind,source){const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(error);}return s;}
      const vs=shader(gl.VERTEX_SHADER,VERTEX),fs=shader(gl.FRAGMENT_SHADER,FRAGMENT),program=gl.createProgram();
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);throw new Error('3D program unavailable');}
      this.program=program;this.attributes={};this.uniforms={};
      ['aPosition','aNormal'].forEach(k=>this.attributes[k]=gl.getAttribLocation(program,k));
      ['uModel','uVP','uNormal','uColor','uEye','uUnlit','uPointSize','uPointMode'].forEach(k=>this.uniforms[k]=gl.getUniformLocation(program,k));
      const buffer=(target,data)=>{const b=gl.createBuffer();gl.bindBuffer(target,b);gl.bufferData(target,data,gl.STATIC_DRAW);return b;};
      this.meshes={};for(const [kind,data]of Object.entries(shapes))this.meshes[kind]={p:buffer(gl.ARRAY_BUFFER,data.positions),n:buffer(gl.ARRAY_BUFFER,data.normals),i:buffer(gl.ELEMENT_ARRAY_BUFFER,data.indices),count:data.indices.length};
      this.lineBuffer=gl.createBuffer();gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(.033,.061,.10,1);
    }
    draw(scene) {
      if(this.disposed||this.lost)return false;
      const gl=this.gl,c=this.canvas,ratio=Math.min(root.devicePixelRatio||1,1.5),width=Math.min(1400,Math.max(320,Math.round((c.clientWidth||760)*ratio))),height=Math.round(width*(c.clientHeight||430)/(c.clientWidth||760));
      if(c.width!==width||c.height!==height){c.width=width;c.height=height;}
      const {yaw,pitch,zoom}=this.camera,r=(scene.distance||8.2)/zoom,eye=[r*Math.sin(yaw)*Math.cos(pitch),r*Math.sin(pitch),r*Math.cos(yaw)*Math.cos(pitch)];
      const vp=multiply(perspective(width/height),lookAt(eye));this.vp=vp;
      gl.viewport(0,0,width,height);gl.depthMask(true);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);
      const u=this.uniforms,a=this.attributes;
      gl.uniformMatrix4fv(u.uVP,false,vp);gl.uniform3fv(u.uEye,eye);gl.uniform1f(u.uUnlit,0);gl.uniform1f(u.uPointMode,0);gl.uniform1f(u.uPointSize,1);
      gl.enableVertexAttribArray(a.aPosition);gl.enableVertexAttribArray(a.aNormal);
      const objects=scene.objects||[],opaque=objects.filter(o=>(o.color[3]??1)>=1),transparent=objects.filter(o=>(o.color[3]??1)<1).sort((a,b)=>Math.hypot(...sub(b.pos,eye))-Math.hypot(...sub(a.pos,eye)));
      for(const o of [...opaque,...transparent]) {
        const mesh=this.meshes[o.kind||'sphere'],model=transform(o.pos,o.size,o.basis);
        gl.depthMask((o.color[3]??1)>=1);gl.uniformMatrix4fv(u.uModel,false,model);gl.uniformMatrix3fv(u.uNormal,false,normalMatrix(model));gl.uniform4fv(u.uColor,o.color);
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.p);gl.vertexAttribPointer(a.aPosition,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,mesh.n);gl.vertexAttribPointer(a.aNormal,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.i);gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
      }
      gl.depthMask(false);gl.uniformMatrix4fv(u.uModel,false,transform([0,0,0]));gl.uniform1f(u.uUnlit,1);gl.disableVertexAttribArray(a.aNormal);gl.vertexAttrib3f(a.aNormal,0,1,0);
      for(const l of scene.lines||[]) {
        const positions=[];for(let i=1;i<l.points.length;i++)positions.push(...l.points[i-1],...l.points[i]);if(!positions.length)continue;
        gl.bindBuffer(gl.ARRAY_BUFFER,this.lineBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(positions),gl.DYNAMIC_DRAW);gl.vertexAttribPointer(a.aPosition,3,gl.FLOAT,false,0,0);gl.uniform4fv(u.uColor,l.color);gl.drawArrays(gl.LINES,0,positions.length/3);
      }
      gl.uniform1f(u.uPointMode,1);
      for(const group of scene.points||[]){
        if(!group.positions.length)continue;
        const data=new Float32Array(group.positions.flat());gl.bindBuffer(gl.ARRAY_BUFFER,this.lineBuffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);gl.vertexAttribPointer(a.aPosition,3,gl.FLOAT,false,0,0);gl.uniform4fv(u.uColor,group.color);gl.uniform1f(u.uPointSize,(group.size||3)*ratio);gl.drawArrays(gl.POINTS,0,data.length/3);
      }
      gl.depthMask(true);c.dataset.renderer='webgl';c.dataset.primitives=String(objects.length);c.dataset.yaw=yaw.toFixed(3);c.dataset.pitch=pitch.toFixed(3);c.dataset.zoom=zoom.toFixed(3);return true;
    }
    dispose() {
      if(this.disposed)return;this.disposed=true;const gl=this.gl;if(!gl)return;
      if(this.onLost)this.canvas.removeEventListener('webglcontextlost',this.onLost);if(this.onRestored)this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
      if(!this.lost){for(const m of Object.values(this.meshes||{}))for(const k of ['p','n','i'])gl.deleteBuffer(m[k]);if(this.lineBuffer)gl.deleteBuffer(this.lineBuffer);if(this.program)gl.deleteProgram(this.program);}
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }
  const api={Renderer,shapes,math:{add,sub,scale,dot,cross,unit,multiply,perspective,lookAt,transform,normalMatrix,project},color};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Space3D=api;
})(typeof window==='undefined'?globalThis:window);
