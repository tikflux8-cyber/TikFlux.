(()=>{(function(){"use strict";let U=(function(){let o="https://s3-us-west-2.amazonaws.com/s.cdpn.io/329180/",t={lift:["lift1.mp3","lift2.mp3","lift3.mp3"],burst:["burst1.mp3","burst2.mp3"]},i=null,e={lift:[],burst:[]},a=!1,s=null;function n(){return i||(i=new(window.AudioContext||window.webkitAudioContext)),i}function c(){if(s)return s;let h=n(),_=[];for(let m of Object.keys(t))for(let u of t[m])_.push(fetch(o+u).then(f=>{if(!f.ok)throw new Error(u);return f.arrayBuffer()}).then(f=>new Promise((p,y)=>{h.decodeAudioData(f.slice(0),p,y)})).then(f=>{e[m].push(f)}));return s=Promise.all(_).then(()=>{a=!0}).catch(m=>{console.warn("[giftFireworkSfx] preload failed",m)}),s}function d(h){return h[Math.floor(Math.random()*h.length)]}function r(h,_,m,u,f){if(!h||!h._enableSound||!a)return;let p=n();p.state==="suspended"&&p.resume().catch(()=>{});let y=e[_];if(!y||!y.length)return;let M=d(y),S=p.createBufferSource();S.buffer=M,S.playbackRate.value=u+Math.random()*(f-u);let P=p.createGain();P.gain.value=m*(h._volume/100),S.connect(P),P.connect(p.destination),S.start(0)}function l(){let h=n();h.state==="suspended"&&h.resume().catch(()=>{})}return document.addEventListener("click",l,{once:!0}),document.addEventListener("touchstart",l,{once:!0}),c(),{preload:c,get ready(){return a},playLift(h){r(h,"lift",1,.85,.95)},playBurst(h){r(h,"burst",1,.8,.9)}}})(),x={uniforms:{uColor:{value:null},uAlpha:{value:1},uGlow:{value:1}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform vec3 uColor;
    uniform float uAlpha;
    uniform float uGlow;
    varying vec2 vUv;
    
    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center) * 2.0;
      float glow = pow(1.0 - dist, uGlow);
      float alpha = glow * uAlpha;
      if (alpha < 0.01) discard;
      gl_FragColor = vec4(uColor * (1.0 + glow * 0.5), alpha);
    }
  `},D={uniforms:{uColor:{value:null},uAlpha:{value:1},uThickness:{value:.15}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform vec3 uColor;
    uniform float uAlpha;
    uniform float uThickness;
    varying vec2 vUv;
    
    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center) * 2.0;
      float ring = smoothstep(1.0, 1.0 - uThickness, dist) * smoothstep(1.0 - uThickness * 2.0, 1.0 - uThickness, dist);
      float alpha = ring * uAlpha;
      if (alpha < 0.01) discard;
      gl_FragColor = vec4(uColor, alpha);
    }
  `},z={uniforms:{uTime:{value:0},uAlpha:{value:1}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform float uTime;
    uniform float uAlpha;
    varying vec2 vUv;
    
    void main() {
      vec2 uv = vUv;
      float vu = uv.y;
      float u = uv.x;
      float g = 1.0 - vu;
      float x = abs(u - 0.5) * 2.0;
      float n0 = sin(uTime * 42.0 + g * 28.0) * 0.5 + 0.5;
      float n1 = sin(uTime * 58.0 - u * 36.0 + g * 44.0) * 0.5 + 0.5;
      float turb = n0 * 0.52 + n1 * 0.48;
      float wob = 0.94 + 0.06 * turb;
      
      float vy = vu + 0.04;
      float jig = (sin(vy * 21.0 + uTime * 10.0) * 0.55 + sin(vy * 14.0 - uTime * 7.0) * 0.45) * 0.042 * vy;
      float triL = 0.5 * vy - jig;
      float triR = 1.0 - 0.5 * vy + jig;
      float tri = smoothstep(triL - 0.12, triL + 0.04, u) * smoothstep(triR + 0.12, triR - 0.04, u);
      float triInner = smoothstep(triL - 0.04, triL + 0.1, u) * smoothstep(triR + 0.04, triR - 0.1, u);
      float facet = 0.86 + 0.14 * abs(sin(vy * 26.283 + uTime * 5.5));
      tri *= mix(0.92, facet, vy * 0.55);
      tri = max(tri * 0.72, triInner * 0.95);
      
      vec3 cTip = mix(vec3(0.75, 0.9, 1.0), vec3(0.98, 0.96, 0.88), smoothstep(0.0, 0.14, g));
      vec3 cHot = vec3(0.98, 0.9, 0.58);
      vec3 cY = vec3(0.96, 0.68, 0.08);
      vec3 cO = vec3(0.95, 0.3, 0.03);
      vec3 cR = vec3(0.88, 0.12, 0.015);
      vec3 cEm = vec3(0.28, 0.04, 0.006);
      
      vec3 col;
      float t0 = 0.16 + turb * 0.05;
      if (g < t0) {
        col = mix(cTip, cHot, g / t0);
      } else if (g < 0.4) {
        col = mix(cHot, cY, (g - t0) / (0.4 - t0));
      } else if (g < 0.63) {
        col = mix(cY, cO, (g - 0.4) / 0.23);
      } else if (g < 0.88) {
        col = mix(cO, cR, (g - 0.63) / 0.25);
      } else {
        col = mix(cR, cEm, (g - 0.88) / 0.12);
      }
      
      float fk = 0.9 + 0.1 * sin(uTime * 38.0 + g * 24.0);
      float fk2 = 0.95 + 0.05 * sin(uTime * 74.0 + u * 42.0);
      col *= fk * fk2 * wob * 0.74;
      
      float core = smoothstep(0.55, 0.0, x) * smoothstep(0.05, 0.48, g) * triInner;
      col = mix(col, vec3(0.98, 0.94, 0.75), core * 0.38);
      col += vec3(0.07, 0.03, 0.008) * core * turb;
      
      float vertW = smoothstep(-0.04, 0.12, vu) * smoothstep(1.02, 0.86, vu);
           float alpha = tri * vertW * uAlpha * pow(max(g, 0.02), 0.84) * (0.48 + 0.2 * turb) * 0.52;
      if (alpha < 0.012) discard;
      gl_FragColor = vec4(col, alpha);
    }
  `},k={vertexShader:`
    attribute vec2 instanceUvOffset;
    attribute float instanceOpacity;
    
    varying vec2 vUv;
    varying float vOpacity;
    
    uniform float uGridSize;
    
    void main() {
      // Calculate UV for this piece of the grid
      vec2 uvSize = vec2(1.0 / uGridSize);
      vUv = instanceUvOffset + uv * uvSize;
      vOpacity = instanceOpacity;
      
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,fragmentShader:`
    uniform sampler2D uTexture;
    
    varying vec2 vUv;
    varying float vOpacity;
    
    void main() {
      vec4 texColor = texture2D(uTexture, vUv);
      if (texColor.a < 0.01 || vOpacity < 0.01) discard;
      gl_FragColor = vec4(texColor.rgb, texColor.a * vOpacity);
    }
  `},L={vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform float uAlpha;
    uniform bool uUseRainbow;
    uniform vec3 uTextColor;
    varying vec2 vUv;
    
    // HSV to RGB conversion
    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }
    
    void main() {
      vec4 texColor = texture2D(uTexture, vUv);
      
      if (texColor.a < 0.01) discard;
      
      vec3 finalColor;
      if (uUseRainbow) {
        // Animated rainbow based on horizontal position + time
        float hue = fract(vUv.x * 1.5 + uTime * 0.15);
        finalColor = hsv2rgb(vec3(hue, 0.7, 1.0));
        // Add subtle glow effect
        finalColor = finalColor * (0.9 + texColor.r * 0.3);
      } else {
        finalColor = uTextColor * texColor.rgb;
      }
      
      gl_FragColor = vec4(finalColor, texColor.a * uAlpha);
    }
  `},F={vertexShader:`
    attribute vec3 instanceColor;
    attribute float instanceAlpha;
    attribute float instanceSize;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying vec2 vUv;
    
    void main() {
      vColor = instanceColor;
      vAlpha = instanceAlpha;
      vUv = uv;
      
      vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position * instanceSize, 1.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,fragmentShader:`
    varying vec3 vColor;
    varying float vAlpha;
    varying vec2 vUv;
    
    void main() {
      vec2 center = vUv - 0.5;
      float dist = length(center) * 2.0;
      float glow = smoothstep(1.0, 0.0, dist);
      float alpha = glow * vAlpha;
      if (alpha < 0.01) discard;
      gl_FragColor = vec4(vColor * (1.0 + glow * 0.3), alpha);
    }
  `},C=null;function v(){if(C)return C;if(!window.THREE)throw new Error("Three.js is not loaded yet");return C=window.THREE,C}let B=50,N=class{constructor(){this._loader=null,this._giftCache=new Map,this._giftPending=new Map,this._profileCache=new Map,this._profileLRU=[],this._profilePending=new Map}_getLoader(){if(!this._loader){let o=v();this._loader=new o.TextureLoader,this._loader.crossOrigin="anonymous"}return this._loader}loadGiftTexture(o,t){if(!o)return;let i=this._giftCache.get(o);if(i){t(i);return}let e=this._giftPending.get(o);if(e){e.callbacks.push(t);return}this._giftPending.set(o,{callbacks:[t]}),this._getLoader().load(o,a=>{this._giftCache.set(o,a);let s=this._giftPending.get(o);if(s){for(let n of s.callbacks)n(a);this._giftPending.delete(o)}},void 0,a=>{console.warn("Failed to load gift texture:",o,a),this._giftPending.delete(o)})}loadProfileTexture(o,t){if(!o)return;let i=this._profileCache.get(o);if(i){this._touchLRU(o),t(i);return}let e=this._profilePending.get(o);if(e){e.callbacks.push(t);return}this._profilePending.set(o,{callbacks:[t]}),this._getLoader().load(o,a=>{this._evictIfNeeded(),this._profileCache.set(o,a),this._profileLRU.push(o);let s=this._profilePending.get(o);if(s){for(let n of s.callbacks)n(a);this._profilePending.delete(o)}},void 0,a=>{console.warn("Failed to load profile texture:",o,a),this._profilePending.delete(o)})}_touchLRU(o){let t=this._profileLRU.indexOf(o);t!==-1&&(this._profileLRU.splice(t,1),this._profileLRU.push(o))}_evictIfNeeded(){for(;this._profileCache.size>=B;){let o=this._profileLRU.shift();if(o){let t=this._profileCache.get(o);t&&t.dispose(),this._profileCache.delete(o)}}}clear(){for(let o of this._giftCache.values())o.dispose();this._giftCache.clear();for(let o of this._profileCache.values())o.dispose();this._profileCache.clear(),this._profileLRU=[]}getStats(){return{gifts:this._giftCache.size,profiles:this._profileCache.size}}},E=new N,g=20,b=g*g;class X{constructor(t,i,e){this._dead=!1,this._elapsed=0,this._finaleStarted=!1,this._finaleTime=0,this._piecesSettled=!1,this._rings=[],this._giftPiecesData=[];var a,s,n,c,d,r,l;let h=v();this._scene=t,this._x=e.x,this._y=e.y,this._giftUrl=e.giftUrl,this._gifterName=e.gifterName,this._giftSize=(a=e.giftSize)!=null?a:320,this._displayDuration=(s=e.displayDuration)!=null?s:5,this._explosionScale=((n=e.explosionSize)!=null?n:100)/100,this._fontSize=((c=e.fontSize)!=null?c:40)+16,this._fontFamily=(d=e.fontFamily)!=null?d:"Poppins, Arial",this._textColor=(r=e.textColor)!=null?r:"#ffffff",this._useRainbow=(l=e.rainbowName)!=null?l:!0,this._particleSystem=i,this._group=new h.Group,this._group.position.set(e.x,e.y,150),t.add(this._group),this._createExplosionEffects(),this._createGiftPieces(),this._createNameLabel(),e.playExplodeSound&&e.playExplodeSound()}_createExplosionEffects(){let t=v(),i=new t.PlaneGeometry(400,400),e=new t.ShaderMaterial({uniforms:t.UniformsUtils.clone(x.uniforms),vertexShader:x.vertexShader,fragmentShader:x.fragmentShader,transparent:!0,depthWrite:!1,blending:t.AdditiveBlending});e.uniforms.uColor.value=new t.Color(1,.95,.8),e.uniforms.uAlpha.value=1,e.uniforms.uGlow.value=2,this._flash=new t.Mesh(i,e),this._flash.position.z=200,this._group.add(this._flash);for(let a=0;a<3;a++){let s=new t.PlaneGeometry(300,300),n=new t.ShaderMaterial({uniforms:t.UniformsUtils.clone(D.uniforms),vertexShader:D.vertexShader,fragmentShader:D.fragmentShader,transparent:!0,depthWrite:!1,blending:t.AdditiveBlending});n.uniforms.uColor.value=new t.Color(1,.8,.4),n.uniforms.uAlpha.value=0;let c=new t.Mesh(s,n);c.position.z=190-a*5,c.userData={delay:a*.08},this._group.add(c),this._rings.push(c)}this._spawnExplosionParticles()}_spawnExplosionParticles(){let t=this._x,i=this._y,e=this._explosionScale;for(let a=0;a<25*e;a++){let s=Math.random()*Math.PI*2,n=(200+Math.random()*400)*e;this._particleSystem.spawn(t,i,160,Math.cos(s)*n,Math.sin(s)*n,15+Math.random()*25,1,.6+Math.random()*.3,.2+Math.random()*.2,-150,.96,.015,0)}for(let a=0;a<20*e;a++){let s=Math.random()*Math.PI*2,n=(150+Math.random()*250)*e;this._particleSystem.spawn(t+(Math.random()-.5)*50,i+(Math.random()-.5)*50,155,Math.cos(s)*n,Math.sin(s)*n,30+Math.random()*50,1,.4+Math.random()*.4,.1,-50,.94,.02,-20)}for(let a=0;a<12*e;a++){let s=Math.random()*Math.PI*2,n=Math.random()*80;this._particleSystem.spawn(t+Math.cos(s)*n,i+Math.sin(s)*n,145,(Math.random()-.5)*60,50+Math.random()*80,70+Math.random()*50,.5,.5,.5,40,.98,.008,60)}for(let a=0;a<15*e;a++){let s=Math.random()*Math.PI*2,n=(200+Math.random()*300)*e;this._particleSystem.spawn(t,i,165,Math.cos(s)*n,Math.sin(s)*n,15+Math.random()*20,1,1,.8,0,.94,.012,0)}}_createGiftPieces(){if(!this._giftUrl)return;let t=v();E.loadGiftTexture(this._giftUrl,i=>{this._giftTexture=i,this._piecesCreatedAt=this._elapsed;let e=this._giftSize/g;this._giftPiecesGeometry=new t.PlaneGeometry(e,e),this._giftPiecesMaterial=new t.ShaderMaterial({uniforms:{uTexture:{value:i},uGridSize:{value:g}},vertexShader:k.vertexShader,fragmentShader:k.fragmentShader,transparent:!0,depthWrite:!1,side:t.DoubleSide}),this._giftPiecesMesh=new t.InstancedMesh(this._giftPiecesGeometry,this._giftPiecesMaterial,b),this._giftPiecesMesh.instanceMatrix.setUsage(t.DynamicDrawUsage),this._giftPiecesMesh.frustumCulled=!1,this._group.add(this._giftPiecesMesh),this._giftPiecesOpacity=new Float32Array(b),this._giftPiecesUvOffset=new Float32Array(b*2),this._giftPiecesGeometry.setAttribute("instanceOpacity",new t.InstancedBufferAttribute(this._giftPiecesOpacity,1)),this._giftPiecesGeometry.setAttribute("instanceUvOffset",new t.InstancedBufferAttribute(this._giftPiecesUvOffset,2)),this._giftPiecesDummy=new t.Object3D,this._giftPiecesData=[];for(let a=0;a<g;a++)for(let s=0;s<g;s++){let n=a*g+s,c=s/g,d=1-(a+1)/g;this._giftPiecesUvOffset[n*2]=c,this._giftPiecesUvOffset[n*2+1]=d,this._giftPiecesOpacity[n]=0;let r=(s-g/2+.5)*e,l=(g/2-a-.5)*e,h=Math.random()*Math.PI*2,_=300+Math.random()*300,m={finalX:r,finalY:l,explodeX:Math.cos(h)*_,explodeY:Math.sin(h)*_,driftX:Math.cos(h)*(40+Math.random()*40),driftY:Math.sin(h)*(40+Math.random()*40),delay:Math.random()*.1,returnDelay:.8+Math.random()*1.5,dissolveStartX:0,dissolveStartY:0,dissolveTargetX:0,dissolveTargetY:0,dissolveDelay:0};this._giftPiecesData.push(m),this._giftPiecesDummy.position.set(0,0,0),this._giftPiecesDummy.scale.set(1,1,1),this._giftPiecesDummy.updateMatrix(),this._giftPiecesMesh.setMatrixAt(n,this._giftPiecesDummy.matrix)}this._giftPiecesMesh.instanceMatrix.needsUpdate=!0,this._giftPiecesGeometry.attributes.instanceOpacity.needsUpdate=!0,this._giftPiecesGeometry.attributes.instanceUvOffset.needsUpdate=!0,this._createFullGiftImage(i)})}_createFullGiftImage(t){let i=v(),e=new i.PlaneGeometry(this._giftSize,this._giftSize),a=new i.MeshBasicMaterial({map:t,transparent:!0,opacity:0});this._fullGiftSprite=new i.Mesh(e,a),this._fullGiftSprite.position.z=5,this._group.add(this._fullGiftSprite)}_createNameLabel(){let t=v();this._nameCanvas=document.createElement("canvas"),this._nameCanvas.width=1024,this._nameCanvas.height=150,this._nameCtx=this._nameCanvas.getContext("2d"),this._drawNameOnce(),this._nameTexture=new t.CanvasTexture(this._nameCanvas),this._nameTexture.needsUpdate=!0;let i=new t.PlaneGeometry(640,94),e=new t.ShaderMaterial({uniforms:{uTexture:{value:this._nameTexture},uTime:{value:0},uAlpha:{value:0},uUseRainbow:{value:this._useRainbow},uTextColor:{value:new t.Color(this._textColor)}},vertexShader:L.vertexShader,fragmentShader:L.fragmentShader,transparent:!0,depthWrite:!1});this._nameSprite=new t.Mesh(i,e),this._nameSprite.position.set(0,-this._giftSize/2-70,10),this._group.add(this._nameSprite)}_drawNameOnce(){if(!this._nameCtx||!this._nameCanvas)return;let t=this._nameCtx,i=this._nameCanvas.width,e=this._nameCanvas.height;t.clearRect(0,0,i,e),t.font=`bold ${this._fontSize}px ${this._fontFamily}`,t.textAlign="center",t.textBaseline="middle",t.shadowColor="rgba(0,0,0,0.9)",t.shadowBlur=15,t.shadowOffsetX=3,t.shadowOffsetY=4,this._useRainbow?(t.fillStyle="#ffffff",t.fillText(this._gifterName||"Anonymous",i/2,e/2),t.shadowColor="rgba(255,255,255,0.3)",t.shadowBlur=20,t.shadowOffsetX=0,t.shadowOffsetY=0,t.fillText(this._gifterName||"Anonymous",i/2,e/2)):(t.fillStyle=this._textColor,t.fillText(this._gifterName||"Anonymous",i/2,e/2))}update(t){var i;this._elapsed+=t;let e=this._elapsed;if(e<.3&&this._flash){let r=e/.3;this._flash.scale.set(1+r*3,1+r*3,1),this._flash.material.uniforms.uAlpha.value=1-r}else this._flash&&(this._flash.material.uniforms.uAlpha.value=0);for(let r=0;r<this._rings.length;r++){let l=this._rings[r],h=e-l.userData.delay;if(h>0&&h<.7){let _=h/.7;l.scale.set(1+_*3,1+_*3,1),l.material.uniforms.uAlpha.value=(1-_)*.8}else h>=.7&&(l.material.uniforms.uAlpha.value=0)}this._updateGiftPieces(e);let a=e-((i=this._piecesCreatedAt)!=null?i:0),s=3.45,n=s+.32,c=.38,d=n+c;if(this._nameSprite&&!this._finaleStarted){let r=this._nameSprite.material;if(this._piecesSettled)r.uniforms.uAlpha.value=0,this._nameSprite.visible=!1;else{let l=e<.18?e/.18:e<2.15?1:Math.max(0,1-(e-.75)/.72);if(l=1-Math.pow(1-Math.min(l,1),3),l<.02)r.uniforms.uAlpha.value=0,this._nameSprite.visible=!1;else{this._nameSprite.visible=!0,r.uniforms.uAlpha.value=l,r.uniforms.uTime.value=e,this._nameSprite.position.y=0+(1-l)*-8;let h=.9+l*.15;this._nameSprite.scale.set(h,h,1)}}}if(this._piecesCreatedAt!==void 0){if(a>s&&!this._finaleStarted){if(this._giftPiecesOpacity&&this._giftPiecesGeometry){let r=Math.min((a-s)/.3,1);for(let l=0;l<b;l++)this._giftPiecesOpacity[l]=1-r;this._giftPiecesGeometry.attributes.instanceOpacity.needsUpdate=!0}if(this._fullGiftSprite){let r=Math.min((a-s)/.4,1);this._fullGiftSprite.material.opacity=r,this._fullGiftSprite.scale.set(1,1,1)}}a>d&&!this._finaleStarted&&(this._finaleStarted=!0,this._finaleTime=0,this._createEpicFinale()),this._finaleStarted&&(this._finaleTime+=t,this._updateEpicFinale(this._finaleTime))}}_updateGiftPieces(t){var i;if(!this._giftPiecesMesh||!this._giftPiecesData.length||!this._giftPiecesDummy||!this._giftPiecesOpacity||!this._giftPiecesGeometry||this._piecesSettled)return;let e=t-((i=this._piecesCreatedAt)!=null?i:0);if(e>3){for(let a=0;a<this._giftPiecesData.length;a++){let s=this._giftPiecesData[a];this._giftPiecesDummy.position.set(s.finalX,s.finalY,0),this._giftPiecesDummy.scale.set(1,1,1),this._giftPiecesDummy.updateMatrix(),this._giftPiecesMesh.setMatrixAt(a,this._giftPiecesDummy.matrix),this._giftPiecesOpacity[a]=1}this._giftPiecesMesh.instanceMatrix.needsUpdate=!0,this._giftPiecesGeometry.attributes.instanceOpacity.needsUpdate=!0,this._piecesSettled=!0;return}for(let a=0;a<this._giftPiecesData.length;a++){let s=this._giftPiecesData[a],n=e-s.delay,c=0,d=0,r=0,l=1;if(n<0)r=0;else{r=.95;let h=.4,_=.5+s.returnDelay*.4,m=1.2;if(n<h){let u=1-Math.pow(1-n/h,3);c=s.explodeX*u,d=s.explodeY*u}else if(n<h+_){let u=(n-h)/_;c=s.explodeX+s.driftX*u,d=s.explodeY+s.driftY*u}else if(n<h+_+m){let u=(n-h-_)/m;u=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;let f=s.explodeX+s.driftX,p=s.explodeY+s.driftY;c=f+(s.finalX-f)*u,d=p+(s.finalY-p)*u,r=.9+u*.1}else c=s.finalX,d=s.finalY,r=1}this._giftPiecesDummy.position.set(c,d,0),this._giftPiecesDummy.scale.set(l,l,1),this._giftPiecesDummy.updateMatrix(),this._giftPiecesMesh.setMatrixAt(a,this._giftPiecesDummy.matrix),this._giftPiecesOpacity[a]=r}this._giftPiecesMesh.instanceMatrix.needsUpdate=!0,this._giftPiecesGeometry.attributes.instanceOpacity.needsUpdate=!0}_createEpicFinale(){if(this._fullGiftSprite&&(this._fullGiftSprite.visible=!1),this._piecesSettled=!1,!(!this._giftPiecesData.length||!this._giftPiecesOpacity||!this._giftPiecesDummy||!this._giftPiecesMesh)){for(let t=0;t<this._giftPiecesData.length;t++){let i=this._giftPiecesData[t];this._giftPiecesDummy.position.set(i.finalX,i.finalY,0),this._giftPiecesDummy.scale.set(1,1,1),this._giftPiecesDummy.updateMatrix(),this._giftPiecesMesh.setMatrixAt(t,this._giftPiecesDummy.matrix),this._giftPiecesOpacity[t]=1;let e=Math.random()*Math.PI*2,a=200+Math.random()*400;i.dissolveStartX=i.finalX,i.dissolveStartY=i.finalY,i.dissolveTargetX=i.finalX+Math.cos(e)*a,i.dissolveTargetY=i.finalY+Math.sin(e)*a,i.dissolveDelay=Math.random()*.3}this._giftPiecesMesh.instanceMatrix.needsUpdate=!0}}_updateEpicFinale(t){if(this._giftPiecesData.length&&this._giftPiecesOpacity&&this._giftPiecesDummy&&this._giftPiecesMesh&&this._giftPiecesGeometry){for(let i=0;i<this._giftPiecesData.length;i++){let e=this._giftPiecesData[i],a=t-e.dissolveDelay;if(a<0)continue;let s=Math.min(a/1.5,1),n=1-Math.pow(1-s,2),c=e.dissolveStartX+(e.dissolveTargetX-e.dissolveStartX)*n,d=e.dissolveStartY+(e.dissolveTargetY-e.dissolveStartY)*n,r=1-n*.5;this._giftPiecesDummy.position.set(c,d,0),this._giftPiecesDummy.scale.set(r,r,1),this._giftPiecesDummy.updateMatrix(),this._giftPiecesMesh.setMatrixAt(i,this._giftPiecesDummy.matrix),this._giftPiecesOpacity[i]=1-n}this._giftPiecesMesh.instanceMatrix.needsUpdate=!0,this._giftPiecesGeometry.attributes.instanceOpacity.needsUpdate=!0}if(this._nameSprite){let i=this._nameSprite.material;i.uniforms.uAlpha.value=0}t>=2.5&&(this._dead=!0)}get isDead(){return this._dead}destroy(){this._scene.remove(this._group),this._giftPiecesGeometry&&this._giftPiecesGeometry.dispose(),this._giftPiecesMaterial&&this._giftPiecesMaterial.dispose(),this._nameTexture&&this._nameTexture.dispose(),this._group.traverse(t=>{let i=t;i!==this._giftPiecesMesh&&(i.geometry&&i.geometry.dispose(),i.material&&i.material.dispose())}),this._giftPiecesData=[],this._giftPiecesOpacity=void 0,this._giftPiecesUvOffset=void 0}}let w=1e3,T=800,O=class{constructor(o){let t=v();this._dummy=new t.Object3D,this._pool=new Array(w),this._freeList=new Array(w),this._activeList=[];for(let i=0;i<w;i++)this._pool[i]={alive:!1,x:0,y:0,z:0,vx:0,vy:0,size:0,r:0,g:0,b:0,gravity:0,friction:1,decay:.02,grow:0,life:0},this._freeList[i]=i;this._geometry=new t.PlaneGeometry(1,1),this._material=new t.ShaderMaterial({uniforms:{},vertexShader:F.vertexShader,fragmentShader:F.fragmentShader,transparent:!0,depthWrite:!1,blending:t.AdditiveBlending}),this._mesh=new t.InstancedMesh(this._geometry,this._material,w),this._mesh.instanceMatrix.setUsage(t.DynamicDrawUsage),this._mesh.frustumCulled=!1,this._colors=new Float32Array(w*3),this._alphas=new Float32Array(w),this._sizes=new Float32Array(w),this._geometry.setAttribute("instanceColor",new t.InstancedBufferAttribute(this._colors,3)),this._geometry.setAttribute("instanceAlpha",new t.InstancedBufferAttribute(this._alphas,1)),this._geometry.setAttribute("instanceSize",new t.InstancedBufferAttribute(this._sizes,1));for(let i=0;i<w;i++)this._alphas[i]=0,this._sizes[i]=0;this._mesh.count=0,o.add(this._mesh)}spawn(o,t,i,e,a,s,n,c,d,r=0,l=1,h=.02,_=0){if(this._freeList.length===0)return-1;let m=this._activeList.length;if(m>T){let p=(m-T)/(w-T)*.8;if(Math.random()<p)return-1}let u=this._freeList.pop(),f=this._pool[u];return f.alive=!0,f.x=o,f.y=t,f.z=i,f.vx=e,f.vy=a,f.size=s,f.r=n,f.g=c,f.b=d,f.gravity=r,f.friction=l,f.decay=h,f.grow=_,f.life=1,this._activeList.push(u),u}update(o){let t=0,i=o*60;for(let e=this._activeList.length-1;e>=0;e--){let a=this._activeList[e],s=this._pool[a];s.vy+=s.gravity*o;let n=Math.pow(s.friction,i);if(s.vx*=n,s.vy*=n,s.x+=s.vx*o,s.y+=s.vy*o,s.size+=s.grow*o,s.size<0&&(s.size=0),s.life-=s.decay*i,s.life<=0){s.alive=!1,this._freeList.push(a),this._activeList[e]=this._activeList[this._activeList.length-1],this._activeList.pop();continue}this._dummy.position.set(s.x,s.y,s.z),this._dummy.scale.set(1,1,1),this._dummy.updateMatrix(),this._mesh.setMatrixAt(t,this._dummy.matrix),this._colors[t*3]=s.r,this._colors[t*3+1]=s.g,this._colors[t*3+2]=s.b,this._alphas[t]=s.life,this._sizes[t]=s.size,t++}this._mesh.count=t,t>0&&(this._mesh.instanceMatrix.needsUpdate=!0,this._geometry.attributes.instanceColor.needsUpdate=!0,this._geometry.attributes.instanceAlpha.needsUpdate=!0,this._geometry.attributes.instanceSize.needsUpdate=!0)}getParticleCount(){return this._activeList.length}destroy(){this._geometry.dispose(),this._material.dispose(),this._activeList.length=0,this._freeList.length=0}};class W{constructor(t,i,e){this._dead=!1,this._elapsed=0,this._exploded=!1,this._trailTimer=0;var a,s;let n=v();this._startY=(a=e.startY)!=null?a:-100,this._x=e.x,this._targetY=e.targetY,this._duration=e.duration/1e3,this._profileUrl=e.profileUrl,this._onExplode=e.onExplode,this._trailDensity=(s=e.trailDensity)!=null?s:100,this._particleSystem=i,this._group=new n.Group,this._group.position.set(e.x,this._startY,100),t.add(this._group),this._buildVisuals(),e.playLaunchSound&&e.playLaunchSound()}_buildVisuals(){let t=v(),i=new t.PlaneGeometry(140,300),e=new t.ShaderMaterial({uniforms:t.UniformsUtils.clone(x.uniforms),vertexShader:x.vertexShader,fragmentShader:x.fragmentShader,transparent:!0,depthWrite:!1,blending:t.AdditiveBlending});e.uniforms.uColor.value=new t.Color(1,.5,.1),e.uniforms.uAlpha.value=.52,e.uniforms.uGlow.value=1.25,this._outerGlow=new t.Mesh(i,e),this._outerGlow.position.set(0,-120,-5),this._group.add(this._outerGlow);let a=new t.PlaneGeometry(60,180),s=new t.ShaderMaterial({uniforms:t.UniformsUtils.clone(z.uniforms),vertexShader:z.vertexShader,fragmentShader:z.fragmentShader,transparent:!0,depthWrite:!1,blending:t.AdditiveBlending});s.uniforms.uAlpha.value=.67,this._flame=new t.Mesh(a,s),this._flame.position.set(0,-100,5),this._group.add(this._flame);let n=new t.CircleGeometry(65,32),c=new t.MeshBasicMaterial({color:16777215,transparent:!0});this._head=new t.Mesh(n,c),this._head.position.z=10,this._group.add(this._head);let d=new t.PlaneGeometry(160,160),r=new t.ShaderMaterial({uniforms:t.UniformsUtils.clone(x.uniforms),vertexShader:x.vertexShader,fragmentShader:x.fragmentShader,transparent:!0,depthWrite:!1,blending:t.AdditiveBlending});if(r.uniforms.uColor.value=new t.Color(1,.8,.4),r.uniforms.uAlpha.value=.6,this._headGlow=new t.Mesh(d,r),this._headGlow.position.z=5,this._group.add(this._headGlow),this._profileUrl){let l=this._head;E.loadProfileTexture(this._profileUrl,h=>{if(!this._dead&&l&&l.material){let _=l.material;_.map=h,_.needsUpdate=!0}})}}update(t){if(this._dead)return;this._elapsed+=t;let i=Math.min(this._elapsed/this._duration,1),e=1-Math.pow(1-i,3),a=this._startY+(this._targetY-this._startY)*e;this._group.position.y=a;let s=1+Math.sin(this._elapsed*30)*.15;this._flame&&this._flame.scale.set(s,.9+Math.sin(this._elapsed*25)*.2,1),this._outerGlow&&this._outerGlow.scale.set(s*.9,s,1),this._headGlow&&(this._headGlow.material.uniforms.uAlpha.value=.5+Math.sin(this._elapsed*20)*.2),this._trailTimer+=t;let n=.02/(this._trailDensity/100);for(;this._trailTimer>=n;)this._trailTimer-=n,this._spawnTrailParticle(a);i>=1&&!this._exploded&&(this._exploded=!0,this._onExplode&&this._onExplode(this._x,this._targetY),this._dead=!0)}_spawnTrailParticle(t){let i=this._x,e=t-70,a,s,n;a=1,s=.92+Math.random()*.07,n=.48+Math.random()*.26,this._particleSystem.spawn(i+(Math.random()-.5)*13,e+(Math.random()-.5)*9,85+Math.random()*7,(Math.random()-.5)*9,-98-Math.random()*52,30+Math.random()*22,a,s,n,19,.962,.01,28),a=1,s=.97+Math.random()*.02,n=.78+Math.random()*.12,this._particleSystem.spawn(i+(Math.random()-.5)*6,e+3+Math.random()*4,88,(Math.random()-.5)*5,-72-Math.random()*32,16+Math.random()*10,a,s,n,12,.968,.013,18);for(let c=0;c<2;c++){let d=Math.PI*.34+Math.random()*Math.PI*.36,r=72+Math.random()*88;a=1,s=.44+Math.random()*.24,n=.03+Math.random()*.11,this._particleSystem.spawn(i+(Math.random()-.5)*7,e,90,Math.cos(d)*r*(Math.random()>.5?1:-1),-Math.sin(d)*r,5+Math.random()*7,a,s,n,-415,.951,.019,0)}a=1,s=.28+Math.random()*.15,n=.025+Math.random()*.07,this._particleSystem.spawn(i+(Math.random()-.5)*11,e+Math.random()*5,88,(Math.random()-.5)*18,-118-Math.random()*68,13+Math.random()*12,a,s,n,-200,.928,.024,0),a=.26+Math.random()*.12,s=.06+Math.random()*.06,n=.018+Math.random()*.03,this._particleSystem.spawn(i+(Math.random()-.5)*17,e-4+Math.random()*8,82,(Math.random()-.5)*14,-74-Math.random()*36,32+Math.random()*26,a,s,n,-112,.905,.017,22)}get isDead(){return this._dead}getGroup(){return this._group}destroy(t){t.remove(this._group),this._group.traverse(i=>{let e=i;e.geometry&&e.geometry.dispose(),e.material&&e.material.dispose()})}}class A{constructor(t,i={}){this._rockets=[],this._explosions=[],this._animationId=null,this._isDestroyed=!1,this._debugFpsLimit=null,this._lastFrameTime=0,this._frameCount=0,this._fpsDisplayTime=0,this._currentFps=0,this._isIdle=!0,this._idleRenderCount=0,this._isPaused=!1,this._audioContext=null,this._launchBuffer=null,this._explodeBuffer=null,this._audioUnlocked=!1,this._enableSound=!0,this._volume=100,this._gainNode=null,this._playLaunchSound=()=>{U.playLift(this)},this._playExplodeSound=()=>{U.playBurst(this)};var e,a,s,n,c,d,r,l,h,_,m,u,f;let p=v();this._canvas=t,this._settings={screenWidth:(e=i.screenWidth)!=null?e:1080,screenHeight:(a=i.screenHeight)!=null?a:1920,rocketSpeed:(s=i.rocketSpeed)!=null?s:.5,displayDuration:(n=i.displayDuration)!=null?n:5,giftSize:(c=i.giftSize)!=null?c:320,explosionSize:(d=i.explosionSize)!=null?d:100,trailDensity:(r=i.trailDensity)!=null?r:100,textColor:(l=i.textColor)!=null?l:"#ffffff",fontSize:(h=i.fontSize)!=null?h:40,rainbowName:(_=i.rainbowName)!=null?_:!0,fontFamily:(m=i.fontFamily)!=null?m:"Poppins, Arial",enableSound:(u=i.enableSound)!=null?u:!0,volume:(f=i.volume)!=null?f:100},this._enableSound=this._settings.enableSound,this._volume=Math.max(0,Math.min(100,this._settings.volume)),this._scene=new p.Scene;let y=this._settings.screenWidth,M=this._settings.screenHeight;this._camera=new p.OrthographicCamera(0,y,M,0,.1,2e3),this._camera.position.z=1e3,this._renderer=new p.WebGLRenderer({canvas:t,alpha:!0,antialias:!1,powerPreference:"high-performance"}),this._renderer.setSize(y,M),this._renderer.setPixelRatio(1),this._renderer.setClearColor(0,0),this._renderer.sortObjects=!0,this._clock=new p.Clock,this._particleSystem=new O(this._scene),this._initAudio(),this._animate=this._animate.bind(this),this._animate()}_initAudio(){try{this._audioContext=new(window.AudioContext||window.webkitAudioContext),this._gainNode=this._audioContext.createGain(),this._gainNode.connect(this._audioContext.destination),this._updateGainNodeVolume(),this._audioUnlocked=!0;let t=()=>{if(this._audioUnlocked||!this._audioContext)return;let i=this._audioContext.createBuffer(1,1,22050),e=this._audioContext.createBufferSource();e.buffer=i,e.connect(this._audioContext.destination),e.start(0),this._audioContext.state==="suspended"&&this._audioContext.resume(),this._audioUnlocked=!0};document.addEventListener("click",t,{once:!0}),document.addEventListener("touchstart",t,{once:!0})}catch(t){console.warn("Failed to initialize audio context:",t)}}loadSound(t,i){this._audioContext&&fetch(i).then(e=>e.arrayBuffer()).then(e=>this._audioContext.decodeAudioData(e)).then(e=>{t==="launch"?this._launchBuffer=e:this._explodeBuffer=e}).catch(e=>console.warn(`Failed to load ${t} sound:`,e))}_playSound(t){if(!(!this._audioContext||!t||!this._enableSound))try{this._audioContext.state==="suspended"&&this._audioContext.resume();let i=this._audioContext.createBufferSource();i.buffer=t,this._gainNode?i.connect(this._gainNode):i.connect(this._audioContext.destination),i.start(0)}catch(i){console.warn("Failed to play sound:",i)}}_updateGainNodeVolume(){this._gainNode&&(this._gainNode.gain.value=this._volume/100)}spawnRocket(t){var i,e;if(this._isDestroyed)return;this._wakeUp();let a=this._settings.screenHeight,s=this._camera,n=(s.right-s.left)/(2*s.zoom),c=(s.right+s.left)/2,d=c-n,r=c+n,l=(s.top+s.bottom)/2,h=(s.top-s.bottom)/(2*s.zoom),_=l-h,m=l+h,u=Math.max(16,88/s.zoom),f=(i=t.targetX)!=null?i:d+u+Math.random()*Math.max(1,r-d-2*u),p=(e=t.targetY)!=null?e:_+(.2+Math.random()*.62)*(m-_),y=_,M=500+(1-this._settings.rocketSpeed)*(2500/.9),S={x:f,targetY:p,duration:M,startY:y,profileUrl:t.profilePictureUrl,trailDensity:this._settings.trailDensity,playLaunchSound:this._playLaunchSound,onExplode:(q,Z)=>{this._spawnExplosion(q,Z,t)}},P=new W(this._scene,this._particleSystem,S);this._rockets.push(P)}_spawnExplosion(t,i,e){let a={x:t,y:i,giftUrl:e.giftImageUrl,gifterName:e.gifterName,giftSize:this._settings.giftSize,displayDuration:this._settings.displayDuration,explosionSize:this._settings.explosionSize,fontSize:this._settings.fontSize,textColor:this._settings.textColor,rainbowName:this._settings.rainbowName,fontFamily:this._settings.fontFamily,playExplodeSound:this._playExplodeSound},s=new X(this._scene,this._particleSystem,a);this._explosions.push(s)}_animate(){if(this._isDestroyed||this._isPaused)return;let t=performance.now();if(this._debugFpsLimit!==null){let e=1e3/this._debugFpsLimit;if(t-this._lastFrameTime<e){this._animationId=requestAnimationFrame(this._animate);return}}this._frameCount++,t-this._fpsDisplayTime>=1e3&&(this._currentFps=this._frameCount,this._frameCount=0,this._fpsDisplayTime=t,this._debugFpsLimit!==null&&console.log(`[GiftFirework] FPS: ${this._currentFps} (limit: ${this._debugFpsLimit})`)),this._lastFrameTime=t;let i=this._clock.getDelta();i>.5&&(i=.5),this._particleSystem.update(i);for(let e=this._rockets.length-1;e>=0;e--)this._rockets[e].update(i),this._rockets[e].isDead&&(this._rockets[e].destroy(this._scene),this._rockets[e]=this._rockets[this._rockets.length-1],this._rockets.pop());for(let e=this._explosions.length-1;e>=0;e--)this._explosions[e].update(i),this._explosions[e].isDead&&(this._explosions[e].destroy(),this._explosions[e]=this._explosions[this._explosions.length-1],this._explosions.pop());this._renderer.render(this._scene,this._camera),this._rockets.length>0||this._explosions.length>0||this._particleSystem.getParticleCount()>0?(this._isIdle=!1,this._idleRenderCount=0,this._animationId=requestAnimationFrame(this._animate)):(this._idleRenderCount++,this._idleRenderCount<3?this._animationId=requestAnimationFrame(this._animate):(this._isIdle=!0,this._animationId=null))}_wakeUp(){this._isIdle&&this._animationId===null&&!this._isDestroyed&&!this._isPaused&&(this._isIdle=!1,this._idleRenderCount=0,this._clock.getDelta(),this._animate())}pause(){this._isPaused||(this._isPaused=!0,this._animationId!==null&&(cancelAnimationFrame(this._animationId),this._animationId=null))}resume(){this._isPaused&&(this._isPaused=!1,!this._isIdle&&!this._isDestroyed&&(this._clock.getDelta(),this._animate()))}updateSettings(t){this._settings={...this._settings,...t},t.enableSound!==void 0&&(this._enableSound=t.enableSound),t.volume!==void 0&&(this._volume=Math.max(0,Math.min(100,t.volume)),this._updateGainNodeVolume())}getSettings(){return{...this._settings}}setDebugFpsLimit(t){this._debugFpsLimit=t,this._lastFrameTime=0,this._clock.getDelta(),console.log(`[GiftFirework] FPS limit set to: ${t===null?"unlimited":t}`)}getDebugFps(){return this._currentFps}resize(t,i){this._settings.screenWidth=t,this._settings.screenHeight=i,this._camera.right=t,this._camera.top=i,this._camera.updateProjectionMatrix(),this._renderer.setSize(t,i)}destroy(){this._isDestroyed=!0,this._animationId!==null&&(cancelAnimationFrame(this._animationId),this._animationId=null);for(let t of this._rockets)t.destroy(this._scene);this._rockets=[];for(let t of this._explosions)t.destroy();this._explosions=[],this._particleSystem.destroy(),this._renderer.dispose(),this._audioContext&&(this._audioContext.close(),this._audioContext=null)}}O.prototype.clearAllParticles=function(){for(let o=this._activeList.length-1;o>=0;o--){let t=this._activeList[o];this._pool[t].alive=!1,this._freeList.push(t)}this._activeList.length=0,this._mesh.count=0},A.prototype.clearAll=function(){for(let o of this._rockets)o.destroy(this._scene);this._rockets=[];for(let o of this._explosions)o.destroy();this._explosions=[],this._particleSystem.clearAllParticles()};let V=1920,R=Math.round(Math.max(220,Math.min(580,355))),I=Math.round(Math.max(36,Math.min(80,62))),j=["tiktok_universe+_7312.webp","rose_5655.webp","leon_the_kitten_6646.webp","kiss_5284.webp","gift.png","finger_heart_5487.webp","trending_figure_9138.webp"];function H(){let o=j;return o[Math.floor(Math.random()*o.length)]}function Y(o,t){let i=o._camera,e=Math.max(.28,Math.min(2.6,t/V));e=Math.min(1,e),i.zoom=e,i.updateProjectionMatrix()}let K=A.prototype.resize;A.prototype.resize=function(o,t){K.call(this,o,t),Y(this,t)};function G(){let o=window.visualViewport,t=Math.max(1,Math.round(o&&o.width?o.width:window.innerWidth)),i=Math.max(1,Math.round(o&&o.height?o.height:window.innerHeight));return{w:t,h:i}}function $(){let o=document.getElementById("fw-canvas");if(!o||!window.THREE)return null;let{w:t,h:i}=G();window.__giftEngine&&(window.__giftEngine.destroy(),window.__giftEngine=null);let e={screenWidth:t,screenHeight:i,rocketSpeed:.5,displayDuration:5,giftSize:R,explosionSize:122,trailDensity:100,textColor:"#ffffff",fontSize:I,rainbowName:!0,fontFamily:"Poppins, Arial, sans-serif",enableSound:!0,volume:75},a=new A(o,e);window.__giftEngine=a,Y(a,i);let s=null;function n(){s!==null&&cancelAnimationFrame(s),s=requestAnimationFrame(function(){s=null;let d=G();a.resize(d.w,d.h),a.updateSettings({giftSize:R,fontSize:I})})}return window.addEventListener("resize",n),window.addEventListener("orientationchange",n),window.visualViewport&&window.visualViewport.addEventListener("resize",n),U.preload(),window.pickRandomGiftImage=H,window.fireworkViewportSize=G,window.fireworkInitComplete=!0,a}window.bootstrapGiftFireworkWidget=$})();})();
