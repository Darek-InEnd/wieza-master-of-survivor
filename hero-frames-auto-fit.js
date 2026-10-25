/* Wieża: rzeczywiste dopasowanie ramek. Wczytywany przez sw.js. */
(() => {
  "use strict";
  const W=".hero-portrait-frame-wrap", P=".hero-v2-portrait", F=".hero-portrait-frame-overlay";
  const alphaCache=new WeakMap();
  const mobile=()=>matchMedia("(max-width:700px)").matches;

  function alphaBounds(img){
    if(alphaCache.has(img)) return alphaCache.get(img);
    try{
      const w=img.naturalWidth,h=img.naturalHeight;
      if(!w||!h) return null;
      const c=document.createElement("canvas"); c.width=w;c.height=h;
      const x=c.getContext("2d",{willReadFrequently:true}); if(!x)return null;
      x.drawImage(img,0,0); const d=x.getImageData(0,0,w,h).data;
      let l=w,t=h,r=-1,b=-1;
      for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++)if(d[(y*w+xx)*4+3]>32){
        if(xx<l)l=xx;if(xx>r)r=xx;if(y<t)t=y;if(y>b)b=y;
      }
      const a=r<0?null:{x:l/w,y:t/h,w:(r-l+1)/w,h:(b-t+1)/h};
      alphaCache.set(img,a);return a;
    }catch(_){alphaCache.set(img,null);return null;}
  }

  function fit(wrap){
    if(!wrap?.isConnected)return;
    const p=wrap.querySelector(`:scope > ${P}`), f=wrap.querySelector(`:scope > ${F}`);
    if(!p||!f)return;
    const is7=/_7star_/i.test(p.getAttribute("src")||p.currentSrc||"");
    const side=is7?(mobile()?98:112):(mobile()?58:66);
    const nw=p.naturalWidth||1,nh=p.naturalHeight||1,ratio=nw/nh;
    let w=side,h=side;if(ratio>1)h=side/ratio;else if(ratio<1)w=side*ratio;

    wrap.style.setProperty("position","relative","important");
    wrap.style.setProperty("display","inline-flex","important");
    wrap.style.setProperty("align-items","center","important");
    wrap.style.setProperty("justify-content","center","important");
    wrap.style.setProperty("width",w+"px","important");
    wrap.style.setProperty("height",h+"px","important");
    wrap.style.setProperty("flex",`0 0 ${w}px`,"important");
    wrap.style.setProperty("box-sizing","border-box","important");
    wrap.style.setProperty("overflow","visible","important");

    for(const [k,v] of Object.entries({
      position:"relative",display:"block",width:"100%",height:"100%",
      "min-width":"0","min-height":"0","max-width":"none","max-height":"none",
      flex:"0 0 100%","object-fit":"contain","object-position":"center",
      margin:"0",border:"0","box-sizing":"border-box","z-index":"1"
    }))p.style.setProperty(k,v,"important");

    for(const [k,v] of Object.entries({
      position:"absolute","max-width":"none","max-height":"none",padding:"0",margin:"0",
      border:"0","object-fit":"fill",transform:"none","transform-origin":"center",
      "pointer-events":"none","z-index":"2",display:"block"
    }))f.style.setProperty(k,v,"important");

    const a=f.complete&&f.naturalWidth?alphaBounds(f):null;
    if(a&&a.w>0&&a.h>0){
      const fw=w/a.w,fh=h/a.h;
      f.style.setProperty("left",(-a.x*fw)+"px","important");
      f.style.setProperty("top",(-a.y*fh)+"px","important");
      f.style.setProperty("width",fw+"px","important");
      f.style.setProperty("height",fh+"px","important");
    }else{
      f.style.setProperty("left","0","important");f.style.setProperty("top","0","important");
      f.style.setProperty("width","100%","important");f.style.setProperty("height","100%","important");
    }
    wrap.classList.add("frame-autofit-fixed");
  }

  function scan(root=document){
    const wraps=[];
    if(root.matches?.(W))wraps.push(root);
    root.querySelectorAll?.(W).forEach(x=>wraps.push(x));
    for(const wrap of wraps){
      const p=wrap.querySelector(`:scope > ${P}`),f=wrap.querySelector(`:scope > ${F}`);
      if(!p||!f)continue;
      const run=()=>fit(wrap);
      if(p.tagName==="IMG"&&!p.complete)p.addEventListener("load",run,{once:true});
      if(!f.complete||!f.naturalWidth)f.addEventListener("load",run,{once:true});
      if((p.tagName!=="IMG"||p.complete)&&f.complete&&f.naturalWidth)run();
    }
  }
  function start(){
    scan();
    new MutationObserver(records=>records.forEach(r=>{
      if(r.type==="childList")r.addedNodes.forEach(n=>{if(n.nodeType===1)scan(n);});
      else if(r.type==="attributes"){const w=r.target.closest?.(W);if(w)scan(w);}
    })).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:["src","class"]});
    addEventListener("resize",()=>document.querySelectorAll(W).forEach(fit),{passive:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
