(()=>{
window.ThemeRenderer=(function(){
let container=null,visibleRanks=10;

function proxyAvatar(url){
if(!url)return"";
if(url.indexOf("tiktokcdn")>=0||url.indexOf("byteimg")>=0){
return"/proxy/avatar?url="+encodeURIComponent(url);
}
return url;
}

function mount(el){container=el}

function update(users){
if(!container)return;
if(!Array.isArray(users))users=[];
const allRanks=container.querySelectorAll("[data-rank]");
allRanks.forEach(rankEl=>{
const rank=parseInt(rankEl.getAttribute("data-rank"),10);
const user=users[rank-1]||null;
if(!user||rank>users.length){
rankEl.style.opacity="0";
rankEl.style.pointerEvents="none";
return;
}
rankEl.style.opacity="1";
rankEl.style.pointerEvents="";
const nickname=user.nickname||user.uniqueId||"—";
const rawAvatar=user.avatar||"";
const avatar=proxyAvatar(rawAvatar);
const score=typeof user.score==="number"?user.score:typeof user.coinCount==="number"?user.coinCount:0;
const avatars=rankEl.querySelectorAll("img");
avatars.forEach(img=>{
if(avatar){img.src=avatar;img.setAttribute("referrerpolicy","no-referrer");img.style.display="";img.onerror=function(){this.style.display="none"}}
else{img.style.display="none"}
});
const nameEls=rankEl.querySelectorAll("[data-name]");
nameEls.forEach(el=>el.textContent=nickname);
const scoreEls=rankEl.querySelectorAll("[data-score]");
scoreEls.forEach(el=>el.textContent=score.toLocaleString());
});
}

function setVisibleRanks(n){visibleRanks=n}

return{mount,update,setVisibleRanks,proxyAvatar};
})();
})();
