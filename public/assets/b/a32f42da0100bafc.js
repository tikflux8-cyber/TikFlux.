(()=>{(function(){let F=window.location.hostname,q=F==="localhost"||F==="127.0.0.1",N=window.ENV_CONFIG?.API_URL||(q?"http://localhost:3000":"https://api.tikoverlay.live"),A=window.ENV_CONFIG?.EDGE_WS_URL||(q?"ws://localhost:3000/ws":"wss://edge.tikoverlay.live/ws");window.DEBUG&&console.log("\u{1F30D} [LikeGoal] Environment:",{hostname:F,isLocal:q,EDGE_WS_URL:A,API_URL:N});let P=new URLSearchParams(window.location.search||"").get("debug")==="1"||!!window.DEBUG;function d(...e){P&&console.log("[LikeGoal:demo]",...e)}let f=100,c=0,O=!1,m=null,p="#ff1515",W="Like Goal",D="thmanyah_sans";function w(){return document.getElementById("like-goal-theme-root")}function U(){return window.LikeGoalThemeLoader?.getEngine?.()??null}let h=!1,E=0,x=null,L=null;function M(e){document.body.classList.toggle("goal-demo-fill-active",!!e)}function Q(){h=!1,x!==null&&(cancelAnimationFrame(x),x=null),L!==null&&(clearTimeout(L),L=null),M(!1)}function Y(){if(d("runParentDemoFill() called",{demoFillActive:h,goalValue:f,currentValue:c,themeKey:l}),h){d("skip \u2014 demo already running");return}h=!0,E=c;let e=f,t=2800,a=performance.now();M(!0),d("start animation 0 \u2192",e,"then restore real",E),u(0),d("after updateCurrentValue(0) \u2014 display currentValue=",c);let o=0;function i(n){if(!h){d("step aborted \u2014 demoFillActive false");return}o++;let y=Math.max(0,n-a),s=Math.min(1,y/t),g=1-(1-s)*(1-s),T=Math.min(e,Math.max(0,Math.round(g*e)));u(T),(o<=2||o%45===0||s>=1)&&d("frame",o,{u:Number(s.toFixed(4)),shown:T,currentValue:c,fillW:document.getElementById("fill")?.style?.width}),s<1?x=requestAnimationFrame(i):(x=null,d("animation end, set full target",e),u(e),L=setTimeout(()=>{L=null,h=!1,d("restore real progress",E),M(!1),u(E)},400))}x=requestAnimationFrame(i)}let J=new Set(["bar","heart","heartglass","moon","star","sun","potion","potion3","potion5","cozy"]),l="bar";function Z(e){let t=typeof e=="string"?e.trim():"bar";return J.has(t)?t:"bar"}async function b(e){l=Z(e),await window.LikeGoalThemeLoader.switchTheme(l),k(p),z(W),S(D),I()}let K=new URLSearchParams(window.location.search),$=K.get("uid"),B=!$||K.get("mock")==="1",ee=!B&&!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String($||"").trim());window.DEBUG&&console.log("\u2764\uFE0F [LikeGoal] Starting with userId:",$,"| Mock:",B);function te(){document.body.classList.add("loaded"),document.body.style.opacity="1",document.body.style.visibility="visible",document.body.innerHTML=`
      <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;max-width:680px;">
          <img src="/assets/img/tikoverlay-mark.png" alt="TikOverlay" style="width:170px;max-width:60vw;filter:drop-shadow(0 4px 14px rgba(0,0,0,0.45));" />
          <div style="font-family:Cairo,Arial,sans-serif;font-size:1.95rem;font-weight:900;line-height:1.4;color:#ff0000;text-shadow:0 2px 10px rgba(0,0,0,0.7);">
            \u0627\u0644\u0631\u0627\u0628\u0637 \u062E\u0637\u0623<br/>\u062A\u0627\u0643\u062F \u0645\u0646 \u0646\u0633\u062E \u0627\u0644\u0631\u0627\u0628\u0637 \u0628\u0634\u0643\u0644 \u0635\u062D\u064A\u062D
          </div>
        </div>
      </div>`}let oe=50,ne=20,le=600,ae=2600;function R(){O||(O=!0,document.body.classList.add("loaded"))}function V(e){let t=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t?{r:parseInt(t[1],16),g:parseInt(t[2],16),b:parseInt(t[3],16)}:null}function k(e){p=e;let t=V(e);if(!t)return;if(l==="bar"){let o=w(),i=o?.querySelector(".title"),n=o?.querySelector(".like-icon"),y=o?.querySelector(".bar-wrapper .bar")||o?.querySelector(".bar"),s=o?.querySelector("#fill"),g=o?.querySelector("#counter");if(i&&(i.style.color=e,i.style.textShadow=`
          0 0 6px rgba(${t.r}, ${t.g}, ${t.b}, 0.6),
          0 0 14px rgba(${t.r}, ${t.g}, ${t.b}, 0.4)
        `),n){let r=n.querySelector("svg");r&&(r.style.fill=e,r.style.filter=`
            drop-shadow(0 0 12px rgb(${t.r}, ${t.g}, ${t.b}))
            drop-shadow(0 0 20px rgba(${t.r}, ${t.g}, ${t.b}, 0.9))
          `)}if(y&&(y.style.background=`linear-gradient(to bottom, rgba(${t.r}, ${t.g}, ${t.b}, 0.356), transparent)`,y.style.borderColor=e,y.style.boxShadow=`
          0 0 12px rgb(${t.r}, ${t.g}, ${t.b}),
          0 0 30px rgba(${t.r}, ${t.g}, ${t.b}, 0.9),
          0 0 50px rgba(${t.r}, ${t.g}, ${t.b}, 0.6)
        `),s){let r={r:Math.floor(t.r*.3),g:Math.floor(t.g*.3),b:Math.floor(t.b*.3)};s.style.background=`linear-gradient(to right, rgb(${r.r}, ${r.g}, ${r.b}), rgb(${t.r}, ${t.g}, ${t.b}))`,s.style.boxShadow=`0 0 22px rgb(${t.r}, ${t.g}, ${t.b})`}g&&(g.style.color=e,g.style.textShadow=`
          0 1px 0 rgba(0,0,0,0.88),
          0 2px 4px rgba(0,0,0,0.55),
          0 0 2px rgba(0,0,0,0.85),
          0 0 8px rgba(${t.r}, ${t.g}, ${t.b}, 0.75),
          0 0 16px rgba(${t.r}, ${t.g}, ${t.b}, 0.5)
        `),(o?.querySelectorAll(".spark svg")??[]).forEach(r=>{r.style.fill=e,r.style.filter=`
          drop-shadow(0 0 16px rgb(${t.r}, ${t.g}, ${t.b}))
          drop-shadow(0 0 40px rgba(${t.r}, ${t.g}, ${t.b}, 0.9))
          drop-shadow(0 0 70px rgba(${t.r}, ${t.g}, ${t.b}, 0.6))
        `}),re(t)}let a=U();a?.applyColor&&a.applyColor(e)}let ie="Like Goal";function z(e){let t=typeof e=="string"&&e.trim()?e.trim().slice(0,160):ie;W=t;let a=w();if(a){if(l==="bar"){let o=a.querySelector(".title");o&&(o.textContent=t)}else if(l==="heart"){let o=a.querySelector(".goal-label");o&&(o.textContent=t)}else if(l==="potion"||l==="potion3"||l==="potion5"||l==="cozy"||l==="heartglass"||l==="moon"||l==="star"||l==="sun"){let o=U();o?.setTitle&&o.setTitle(t)}k(p)}}function S(e){D=e||"thmanyah_sans";let t=window.GoalFontStacks,a=t?t.cssStack(t.normalize(D)):'"Thmanyah Sans", "Segoe UI", sans-serif',o=w();if(!o)return;o.querySelectorAll("#counter, #goalPercentText, #goalValueText, .potion-goal-counter, .text1, .cozy-leftNum, .cozy-rightNum, .hg-text1, .mg-text1, .sg-text1, .su-text1").forEach(n=>{n.style.removeProperty("font-family")});let i=l==="bar"?".title":l==="heart"?".goal-label":l==="heartglass"?".hg-title":l==="moon"?".mg-title":l==="star"?".sg-title":l==="sun"?".su-title":l==="potion3"||l==="potion5"?".textbottom .title":l==="cozy"?".cozy-goal-title":".potion-goal-title";o.querySelectorAll(i).forEach(n=>{n.style.fontFamily=a}),l==="cozy"&&o.querySelectorAll(".cozy-leftNum, .cozy-rightNum, .cozy-dataCounts").forEach(n=>{n.style.fontFamily=a}),l==="heartglass"&&o.querySelectorAll(".hg-text1, .hg-textbottom").forEach(n=>{n.style.fontFamily=a}),l==="moon"&&o.querySelectorAll(".mg-text1, .mg-textbottom").forEach(n=>{n.style.fontFamily=a}),l==="star"&&o.querySelectorAll(".sg-text1, .sg-textbottom").forEach(n=>{n.style.fontFamily=a}),l==="sun"&&o.querySelectorAll(".su-text1, .su-textbottom").forEach(n=>{n.style.fontFamily=a})}function re(e){let t=document.createElement("style");t.id="dynamic-goal-complete-style";let a=document.getElementById("dynamic-goal-complete-style");a&&a.remove(),t.textContent=`
      .fill.goal-complete {
        box-shadow:
          0 0 12px rgb(${e.r}, ${e.g}, ${e.b}),
          0 0 30px rgba(${e.r}, ${e.g}, ${e.b}, 0.9),
          0 0 50px rgba(${e.r}, ${e.g}, ${e.b}, 0.6) !important;
      }
      
      .fill.goal-complete::after {
        background: rgba(${e.r}, ${e.g}, ${e.b}, 0.85) !important;
        box-shadow:
          0 0 12px rgb(${e.r}, ${e.g}, ${e.b}),
          0 0 30px rgba(${e.r}, ${e.g}, ${e.b}, 0.9),
          0 0 50px rgba(${e.r}, ${e.g}, ${e.b}, 0.6) !important;
      }
      
      @keyframes barGlowPulse {
        0% {
          box-shadow:
            0 0 12px rgba(${e.r}, ${e.g}, ${e.b}, 0.6),
            0 0 30px rgba(${e.r}, ${e.g}, ${e.b}, 0.4),
            0 0 50px rgba(${e.r}, ${e.g}, ${e.b}, 0.3);
        }
        50% {
          box-shadow:
            0 0 18px rgb(${e.r}, ${e.g}, ${e.b}),
            0 0 45px rgba(${e.r}, ${e.g}, ${e.b}, 0.9),
            0 0 80px rgba(${e.r}, ${e.g}, ${e.b}, 0.8);
        }
        100% {
          box-shadow:
            0 0 12px rgba(${e.r}, ${e.g}, ${e.b}, 0.6),
            0 0 30px rgba(${e.r}, ${e.g}, ${e.b}, 0.4),
            0 0 50px rgba(${e.r}, ${e.g}, ${e.b}, 0.3);
        }
      }
    `,document.head.appendChild(t)}function I(){let e=Math.min(c/f*100,100),t=w();if(l==="bar"&&t){let o=t.querySelector("#fill"),i=t.querySelector("#counter"),n=t.querySelector(".bar-wrapper .bar")||t.querySelector(".bar");o&&(o.style.width=e+"%"),i&&(i.innerText=`${c} / ${f}`),o&&n&&(c>=f?(o.classList.add("goal-complete"),n.classList.add("goal-complete")):(o.classList.remove("goal-complete"),n.classList.remove("goal-complete")))}let a=U();a?.setState&&a.setState(c,f)}function u(e){typeof e=="number"&&!isNaN(e)&&(c=Math.max(0,e),I())}function H(e){typeof e=="number"&&!isNaN(e)&&e>0&&(f=e,I())}function he(){Q(),c=0,I()}async function se(){if($)try{let e=await fetch(`${N}/api/widget/like-goal/${$}/settings`);if(e.ok){let t=await e.json();window.DEBUG&&console.log("\u2705 [LikeGoal] Settings loaded:",t),t.goal_value!==void 0&&H(parseInt(t.goal_value)),t.goal_color&&k(t.goal_color),t.theme_key&&await b(t.theme_key),t.goal_title!==void 0&&t.goal_title!==null&&z(String(t.goal_title)),t.goal_font!==void 0&&t.goal_font!==null&&S(String(t.goal_font)),setTimeout(()=>R(),50)}}catch(e){console.error("\u274C [LikeGoal] \u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u0645\u064A\u0644 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0647\u062F\u0641:",e),setTimeout(()=>R(),500)}}async function X(e){e&&(e.theme_key!==void 0&&await b(e.theme_key),e.goal_value!==void 0&&H(parseInt(e.goal_value,10)),e.goal_color&&k(e.goal_color),e.goal_title!==void 0&&e.goal_title!==null&&z(String(e.goal_title)),e.goal_font!==void 0&&e.goal_font!==null&&S(String(e.goal_font)))}window.addEventListener("message",e=>{let t=e.data;!t||t.source!=="tikoverlay-goals-dashboard"&&t.source!=="tikscale-goals-dashboard"||t.type!=="goal_setup"||t.event==="like_goal_settings"&&X(t.data)});function ce(){if(window.DEBUG&&console.log("\u{1F50C} [LikeGoal] connectSocket() called"),!$){console.error("\u274C [LikeGoal] Cannot connect - userId is missing!");return}if(typeof createEdgeWsClient!="function"){console.error("\u274C [LikeGoal] Cannot connect - edge-ws-client not loaded!");return}window.DEBUG&&console.log("\u2705 [LikeGoal] Connecting to Edge WS:",A),m=createEdgeWsClient({streamerId:$,url:A,reconnection:!0,reconnectionDelay:1e3,reconnectionDelayMax:5e3,reconnectionAttempts:1/0}),m.on("connect",()=>{window.DEBUG&&console.log("\u2705 [LikeGoal] Edge transport open:",m.id)}),m.on("connected",()=>{window.DEBUG&&console.log("\u2705 [LikeGoal] Subscribed on Edge")}),m.on("disconnect",e=>{window.DEBUG&&console.log("\u26A0\uFE0F [LikeGoal] Edge disconnected. Reason:",e)}),m.on("error",e=>{console.error("\u274C [LikeGoal] Socket error:",e)}),m.on("like_goal_update",e=>{if(e){if(e.mode==="demo"){(window.DEBUG||P)&&console.log("\u{1F9EA} [LikeGoal] like_goal_update (demo mode):",e),d("socket like_goal_update demo"),Y();return}if(window.DEBUG&&console.log("\u{1F4CA} [LikeGoal] Progress update received:",e),e.current_value!==void 0){let t=parseInt(e.current_value,10);h?E=Math.max(0,t):u(t)}}}),m.on("like_goal_settings",e=>{window.DEBUG&&console.log("\u2699\uFE0F [LikeGoal] Settings update received:",e),X(e)})}function C(e,t){return Math.random()*(t-e)+e}function de(){let e=w()?.querySelector(".sparkles-layer");if(!e)return;let t=document.createElement("div");t.className="spark",t.innerHTML=`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="spark-star">
        <path d="M247.355,106.9C222.705,82.241,205.833,39.18,197.46,0
          c-8.386,39.188-25.24,82.258-49.899,106.917
          c-24.65,24.642-67.724,41.514-106.896,49.904
          c39.188,8.373,82.254,25.235,106.904,49.895
          c24.65,24.65,41.522,67.72,49.908,106.9
          c8.373-39.188,25.24-82.258,49.886-106.917
          c24.65-24.65,67.724-41.514,106.896-49.904
          C315.08,148.422,272.014,131.551,247.355,106.9z"/>
      </svg>
    `;let a=t.querySelector("svg");if(a&&p){let n=V(p);n&&(a.style.fill=p,a.style.filter=`
          drop-shadow(0 0 16px rgb(${n.r}, ${n.g}, ${n.b}))
          drop-shadow(0 0 40px rgba(${n.r}, ${n.g}, ${n.b}, 0.9))
          drop-shadow(0 0 70px rgba(${n.r}, ${n.g}, ${n.b}, 0.6))
        `)}let o=C(5.2,17.2);t.style.width=`${o}px`,t.style.height=`${o}px`,t.style.left=`${C(0,e.clientWidth)}px`,t.style.top=`${C(0,e.clientHeight)}px`,e.appendChild(t);let i=C(le,ae);t.animate([{transform:"translateX(0px)",opacity:0},{opacity:1},{transform:`translateX(${ne}px)`,opacity:0}],{duration:i,easing:"ease-out"}),setTimeout(()=>t.remove(),i)}setInterval(()=>{if(l!=="bar")return;let e=w()?.querySelector(".sparkles-layer");e&&e.children.length<oe&&de()},100);let G=["bar","heart","heartglass","moon","star","sun","potion","potion3","potion5","cozy"],ue=900,ge=3800,_=null,v=null;function fe(){_!==null&&(cancelAnimationFrame(_),_=null),v!==null&&(clearTimeout(v),v=null)}async function me(){window.DEBUG&&console.log("\u{1F3AD} [LikeGoal] Starting Mock Mode"),fe();let e=G.indexOf(l);e<0&&(e=0),await b(G[e]);async function t(){M(!0),u(0);let a=f,o=ge,i=performance.now();function n(y){let s=Math.max(0,y-i),g=Math.min(1,s/o),T=1-(1-g)*(1-g),r=Math.min(a,Math.max(0,Math.round(T*a)));u(r),g<1?_=requestAnimationFrame(n):(_=null,u(a),v=setTimeout(()=>{v=null,e=(e+1)%G.length,(async()=>(await b(G[e]),u(0),t()))()},ue))}_=requestAnimationFrame(n)}t(),R()}async function j(){if(window.DEBUG&&console.log("\u{1F680} [LikeGoal] Widget initializing..."),ee){te();return}let e=document.getElementById("like-goal-theme-mount");if(!e||!window.LikeGoalThemeLoader){console.error("\u274C [LikeGoal] Theme mount or loader missing");return}LikeGoalThemeLoader.init(e),B?(await b(G[0]),k(p),S("thmanyah_sans"),me()):(await b("bar"),k(p),S("thmanyah_sans"),await se(),ce())}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",j):j()})();})();
