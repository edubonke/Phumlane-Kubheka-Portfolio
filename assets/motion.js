/* PK / Living Motion — meaning-led, input-responsive, and motion-safe.
   Designed for Technology, made human (2026). Plain browser APIs; no animation dependency. */
(() => {
 "use strict";
 const doc=document,html=doc.documentElement;
 const $=(s,r=doc)=>r.querySelector(s), $$=(s,r=doc)=>Array.from(r.querySelectorAll(s));
 const reduce=matchMedia("(prefers-reduced-motion: reduce)");
 const fine=matchMedia("(hover:hover) and (pointer:fine)");
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 const toggle=$("#globalMotionToggle");
 let paused=false,practicePaused=false;
 const canLive=()=>!paused&&!practicePaused&&!reduce.matches&&!doc.hidden;

 // One global user-facing switch: continuous motion in every section pauses together.
 function setPaused(value){
   paused=!!value;
   html.classList.toggle("motion-paused",paused);
   if(toggle){
     toggle.setAttribute("aria-pressed",String(paused));
     toggle.setAttribute("aria-label",paused?"Resume continuous animations":"Pause continuous animations");
     toggle.title=paused?"Resume continuous animations":"Pause continuous animations";
     toggle.innerHTML=(paused?"▶":"Ⅱ")+'<span class="motion-control-label"> Motion</span>';
   }
   doc.dispatchEvent(new CustomEvent("pk-motion-change",{detail:{paused}}));
   syncPractice();
 }
 toggle?.addEventListener("click",()=>setPaused(!paused));

 // 01. Kinetic hero: readable before JS, replayable on demand, skipped if motion is reduced.
 const heroHeading=$("#heroHeading"),heroReplay=$("#heroReplay");
 function replayHero(){
   if(!heroHeading||reduce.matches)return;
   heroHeading.classList.remove("kinetic-active");
   void heroHeading.offsetWidth;
   heroHeading.classList.add("kinetic-active");
 }
 if(!reduce.matches)requestAnimationFrame(replayHero);
 heroReplay?.addEventListener("click",replayHero);
 reduce.addEventListener?.("change",()=>{
   if(reduce.matches)heroHeading?.classList.remove("kinetic-active");
   syncPractice();
 });

 // 03. The existing user portraits remain; the visitor can independently flip either face.
 const portrait=$("#portraitArt"),flipper=$("#portraitFlipper"),flipButton=$("#portraitFlipButton");
 flipButton?.addEventListener("click",()=>{
   const flipped=flipper.classList.toggle("user-flipped");
   flipButton.setAttribute("aria-pressed",String(flipped));
   flipButton.setAttribute("aria-label",flipped?"Return to original portrait":"Flip to alternate portrait");
 });
 if(portrait&&fine.matches){
   portrait.addEventListener("pointermove",event=>{
     if(reduce.matches)return;
     const box=portrait.getBoundingClientRect();
     portrait.style.setProperty("--portrait-light-x",(100*(event.clientX-box.left)/box.width).toFixed(1)+"%");
     portrait.style.setProperty("--portrait-light-y",(100*(event.clientY-box.top)/box.height).toFixed(1)+"%");
   },{passive:true});
   portrait.addEventListener("pointerleave",()=>{
     portrait.style.setProperty("--portrait-light-x","45%");
     portrait.style.setProperty("--portrait-light-y","32%");
   },{passive:true});
 }

 // 04/05. Actual project cards and live-preview dialogs, not fabricated demo websites.
 if(fine.matches){
   $$(".project-card").forEach(card=>{
     const visual=$(".project-visual",card);
     if(!visual)return;
     card.addEventListener("pointermove",event=>{
       if(reduce.matches)return;
       const rect=visual.getBoundingClientRect();
       const x=clamp((event.clientX-rect.left)/Math.max(1,rect.width)-0.5,-.5,.5);
       const y=clamp((event.clientY-rect.top)/Math.max(1,rect.height)-0.5,-.5,.5);
       visual.style.setProperty("--project-tilt-x",(x*3).toFixed(2)+"deg");
       visual.style.setProperty("--project-tilt-y",(-y*3).toFixed(2)+"deg");
     },{passive:true});
     card.addEventListener("pointerleave",()=>{
       visual.style.setProperty("--project-tilt-x","0deg");
       visual.style.setProperty("--project-tilt-y","0deg");
     },{passive:true});
   });
 }

 // 06. Refined Practice Loop: live knowledge exchange + grounded interactive explanation.
 const stage=$("#practiceStage"),canvas=$("#practiceCanvas");
 const nodes=$$(".practice-node"),links=$$(".practice-link"),pkicker=$("#practiceKicker");
 const ptitle=$("#practiceTitle"),pdesc=$("#practiceDescription"),ptags=$("#practiceTags");
 const practicePause=$("#practicePause");
 const topics=[
   {
     kicker:"01 / SUPPORT",title:"Understand the problem.",
     desc:"Hands-on IT support reveals the problems people encounter with devices, systems and everyday digital tools. Those observations inform better software and clearer technical teaching.",
     tags:["Hardware & OS","Root-cause diagnosis","User understanding"]
   },
   {
     kicker:"02 / BUILD",title:"Design a useful solution.",
     desc:"Web development translates practical needs into clear interfaces, accessible interactions and reliable experiences. What gets built becomes a better way to help and teach people.",
     tags:["Frontend development","User experience","Practical testing"]
   },
   {
     kicker:"03 / TEACH",title:"Make knowledge transferable.",
     desc:"ICT education turns technical ideas into understandable, repeatable skills. Learner questions and classroom feedback show where systems and explanations can improve.",
     tags:["Accessible learning","Practical assessment","Digital confidence"]
   }
 ];
 let selected=0,cv=canvas?.getContext("2d")||null,sw=0,sh=0,phase=0,frame=0,lastFrame=0,stageVisible=false;
 let pointer={x:-999,y:-999};
 function renderTopic(i){
   selected=i;
   nodes.forEach((btn,index)=>btn.setAttribute("aria-pressed",String(index===i)));
   links.forEach((btn,index)=>{
     const current=index===i;btn.classList.toggle("is-selected",current);btn.setAttribute("aria-pressed",String(current));
   });
   const data=topics[i];
   if(pkicker)pkicker.textContent=data.kicker;
   if(ptitle)ptitle.textContent=data.title;
   if(pdesc)pdesc.textContent=data.desc;
   if(ptags){
     ptags.replaceChildren(...data.tags.map(tag=>{
       const span=doc.createElement("span");span.textContent=tag;return span;
     }));
   }
   paintPractice();
 }
 pdesc?.setAttribute("aria-live","polite");
 function attachPracticalChoice(btns){
   btns.forEach((btn,index)=>{
     btn.addEventListener("click",()=>renderTopic(index));
     btn.addEventListener("keydown",event=>{
       const dir=(event.key==="ArrowRight"||event.key==="ArrowDown")?1:(event.key==="ArrowLeft"||event.key==="ArrowUp")?-1:0;
       if(!dir)return;
       event.preventDefault();
       const next=(index+dir+3)%3;
       renderTopic(next);
       btns[next].focus();
     });
   });
 }
 attachPracticalChoice(nodes);attachPracticalChoice(links);
 const pcoords=()=>[
   {x:sw*(sw<570?.18:.19),y:sh*.51},
   {x:sw*(sw<570?.79:.77),y:sh*.27},
   {x:sw*(sw<570?.79:.77),y:sh*.76}
 ];
 function bezier(a,b,c,t){
   const u=1-t;
   return {x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y};
 }
 function paintPractice(){
   if(!cv||!sw||!sh)return;
   cv.clearRect(0,0,sw,sh);
   const p=pcoords(),controls=[{x:sw*.48,y:sh*.12},{x:sw*.96,y:sh*.51},{x:sw*.47,y:sh*.92}];
   const edges=[[0,1],[1,2],[2,0]];
   // Highly restrained spatial grid and ambient focus, drawn on demand or at max 30 FPS.
   const glow=cv.createRadialGradient(sw*.49,sh*.52,10,sw*.49,sh*.52,sw*.4);
   glow.addColorStop(0,"rgba(93,117,234,.20)");glow.addColorStop(1,"rgba(93,117,234,0)");
   cv.fillStyle=glow;cv.fillRect(0,0,sw,sh);
   cv.fillStyle="rgba(184,201,255,.14)";
   for(let x=14;x<sw;x+=32)for(let y=14;y<sh;y+=32)cv.fillRect(x,y,1.1,1.1);
   edges.forEach(([from,to],i)=>{
     const a=p[from],b=p[to],ctrl=controls[i],active=i===selected;
     cv.beginPath();cv.moveTo(a.x,a.y);cv.quadraticCurveTo(ctrl.x,ctrl.y,b.x,b.y);
     cv.strokeStyle=active?"rgba(234,253,127,.81)":"rgba(167,185,248,.34)";
     cv.lineWidth=active?2.1:1.15;cv.stroke();
     const count=active?3:2;
     for(let k=0;k<count;k++){
       const t=(phase*(active?.2:.13)+k/count+i*.17)%1;
       const q=bezier(a,b,ctrl,t);
       const radius=active?15:10;
       const halo=cv.createRadialGradient(q.x,q.y,0,q.x,q.y,radius);
       halo.addColorStop(0,active?"rgba(234,253,127,.67)":"rgba(148,177,255,.45)");
       halo.addColorStop(1,"rgba(161,188,255,0)");
       cv.fillStyle=halo;cv.beginPath();cv.arc(q.x,q.y,radius,0,Math.PI*2);cv.fill();
       cv.fillStyle=active?"#eafd7f":"#b8c9ff";
       cv.beginPath();cv.arc(q.x,q.y,active?3.2:2.3,0,Math.PI*2);cv.fill();
     }
   });
   if(pointer.x>=0&&pointer.y>=0){
     const halo=cv.createRadialGradient(pointer.x,pointer.y,0,pointer.x,pointer.y,75);
     halo.addColorStop(0,"rgba(174,194,255,.16)");
     halo.addColorStop(1,"rgba(174,194,255,0)");
     cv.fillStyle=halo;cv.fillRect(pointer.x-75,pointer.y-75,150,150);
   }
 }
 function resizePractice(){
   if(!stage||!cv)return;
   const rect=stage.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.6);
   sw=Math.max(1,rect.width);sh=Math.max(1,rect.height);
   canvas.width=Math.round(sw*dpr);canvas.height=Math.round(sh*dpr);
   cv.setTransform(dpr,0,0,dpr,0,0);
   paintPractice();
 }
 function tickPractice(now){
   frame=0;
   if(!canLive()||!stageVisible)return;
   if(now-lastFrame>=33){
     phase+=Math.min(0.06,Math.max(.025,(now-lastFrame)/1000));
     paintPractice();lastFrame=now;
   }
   frame=requestAnimationFrame(tickPractice);
 }
 function syncPractice(){
   if(frame)cancelAnimationFrame(frame);
   frame=0;lastFrame=0;
   paintPractice();
   if(canLive()&&stageVisible&&cv)frame=requestAnimationFrame(tickPractice);
 }
 practicePause?.addEventListener("click",()=>{
   practicePaused=!practicePaused;
   practicePause.setAttribute("aria-pressed",String(practicePaused));
   practicePause.textContent=practicePaused?"Resume signal ▶":"Pause signal Ⅱ";
   syncPractice();
 });
 if(stage&&cv){
   if("ResizeObserver" in window)new ResizeObserver(resizePractice).observe(stage);
   else addEventListener("resize",resizePractice,{passive:true});
   if("IntersectionObserver" in window){
     new IntersectionObserver(entries=>{
       stageVisible=entries[0]?.isIntersecting||false;syncPractice();
     },{threshold:0}).observe(stage);
   }else stageVisible=true;
   stage.addEventListener("pointermove",event=>{
     const rect=stage.getBoundingClientRect();
     pointer={x:event.clientX-rect.left,y:event.clientY-rect.top};
     if(!canLive())paintPractice();
   },{passive:true});
   stage.addEventListener("pointerleave",()=>{
     pointer={x:-999,y:-999};
     if(!canLive())paintPractice();
   },{passive:true});
   doc.addEventListener("visibilitychange",syncPractice);
   resizePractice();renderTopic(0);syncPractice();
 }

 // 07/12. Scroll-linked career timeline and live chapter reading progress.
 const timeline=$("#careerTimeline"),timelineItems=$$(".timeline-item",timeline||doc);
 const chapter=$("#readingChapter"),percent=$("#readingPercent");
 const sections=["top","work","expertise","experience","about","lab","contact"];
 const sectionNames=["INTRO","WORK","EXPERTISE","CAREER","ABOUT","LAB","CONTACT"];
 let scrollQueued=false;
 function updateScrollEffects(){
   scrollQueued=false;
   const max=Math.max(1,doc.documentElement.scrollHeight-innerHeight);
   const progress=Math.round(clamp(scrollY/max,0,1)*100);
   if(percent)percent.textContent=String(progress).padStart(2,"0")+"%";
   let current=0;
   for(let i=0;i<sections.length;i++){
     const el=doc.getElementById(sections[i]);
     if(el&&el.getBoundingClientRect().top<=innerHeight*.32)current=i;
   }
   if(chapter)chapter.textContent=sectionNames[current];
   if(timeline){
     const r=timeline.getBoundingClientRect();
     const value=clamp((innerHeight*.62-r.top)/Math.max(1,r.height),0,1);
     timeline.style.setProperty("--timeline-progress",(value*100).toFixed(1)+"%");
     timelineItems.forEach(el=>el.classList.toggle("timeline-active",el.getBoundingClientRect().top<innerHeight*.62));
   }
 }
 addEventListener("scroll",()=>{
   if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateScrollEffects);}
 },{passive:true});
 addEventListener("resize",updateScrollEffects,{passive:true});
 updateScrollEffects();

 // 08. About: real principles instead of generic animated filler.
 const perspectiveButtons=$$(".perspective-tab"),perspectiveTitle=$("#perspectiveTitle"),perspectiveDescription=$("#perspectiveDescription"),perspectiveStory=$("#perspectiveStory");
 const perspectives=[
  ["Start with clarity.","Understand the actual problem before choosing a technical solution."],
  ["Build something useful.","Design and test digital experiences that help people do their work confidently."],
  ["Share the knowledge.","Make technical ideas accessible, practical and transferable to everyday users and learners."]
 ];
 function pickPerspective(index){
   perspectiveButtons.forEach((btn,i)=>{
     const active=i===index;btn.classList.toggle("is-selected",active);btn.setAttribute("aria-pressed",String(active));
   });
   if(perspectiveTitle)perspectiveTitle.textContent=perspectives[index][0];
   if(perspectiveDescription)perspectiveDescription.textContent=perspectives[index][1];
   if(perspectiveStory&&!reduce.matches){
     perspectiveStory.classList.remove("story-animate");
     void perspectiveStory.offsetWidth;
     perspectiveStory.classList.add("story-animate");
   }
 }
 perspectiveButtons.forEach((btn,i)=>{
   btn.addEventListener("click",()=>pickPerspective(i));
   btn.addEventListener("keydown",event=>{
     const move=event.key==="ArrowRight"?1:event.key==="ArrowLeft"?-1:0;
     if(!move)return;event.preventDefault();
     const next=(i+move+3)%3;pickPerspective(next);perspectiveButtons[next].focus();
   });
 });

 // 09. Meaningful diagnosis feedback alongside the existing functioning checklist.
 const diagInputs=$$("#diagnosticList [data-check]"),diagSignal=$("#diagSignal"),labProgress=$(".lab-progress");
 function feedbackDiagnostic(){
   const finished=diagInputs.filter(el=>el.checked).length;
   const count=diagInputs.length;
   if(diagSignal){
     diagSignal.textContent=finished===count?"All checks complete — record the findings.":
       finished===0?"Select a check to begin diagnosis.":
       finished+" of "+count+" checks confirmed. Continue diagnosing.";
     diagSignal.classList.toggle("is-complete",finished===count);
   }
   labProgress?.classList.toggle("is-complete",finished===count);
   if(labProgress&&!reduce.matches){
     labProgress.classList.remove("just-updated");
     void labProgress.offsetWidth;
     labProgress.classList.add("just-updated");
   }
 }
 diagInputs.forEach(input=>input.addEventListener("change",feedbackDiagnostic));
 $("#diagReset")?.addEventListener("click",feedbackDiagnostic);
 feedbackDiagnostic();

 // 10. Visualise the actual converter output, with independent per-bit flips.
 const decimal=$("#decimalInput"),binaryOut=$("#binaryOutput");
 const tiles=$$("#binaryBitGrid span");
 let prevBits=tiles.map(n=>n.textContent).join("");
 function updateBits(){
   if(!binaryOut||!tiles.length)return;
   const bits=binaryOut.value;
   if(!/^[01]{8}$/.test(bits)){
     tiles.forEach(n=>{n.classList.remove("bit-turn");n.textContent="–";});
     prevBits="--------";
     return;
   }
   tiles.forEach((node,i)=>{
     const changed=bits[i]!==prevBits[i];
     node.textContent=bits[i];
     if(changed&&!reduce.matches){
       node.classList.remove("bit-turn");
       void node.offsetWidth;
       node.classList.add("bit-turn");
     }
   });
   prevBits=bits;
 }
 tiles.forEach(node=>node.addEventListener("animationend",()=>node.classList.remove("bit-turn")));
 decimal?.addEventListener("input",updateBits);
 $("#convertBtn")?.addEventListener("click",updateBits);
 updateBits();

 // 11. Contact CTA: cursor magnetism + small click ripple, without blocking mail links.
 if(fine.matches){
   $$(".magnetic-cta").forEach(link=>{
     link.addEventListener("pointermove",event=>{
       if(reduce.matches)return;
       const r=link.getBoundingClientRect();
       const x=(event.clientX-r.left-r.width/2)*.12;
       const y=(event.clientY-r.top-r.height/2)*.13;
       link.style.setProperty("--magnet-x",clamp(x,-16,16)+"px");
       link.style.setProperty("--magnet-y",clamp(y,-10,10)+"px");
     },{passive:true});
     link.addEventListener("pointerleave",()=>{
       link.style.setProperty("--magnet-x","0px");
       link.style.setProperty("--magnet-y","0px");
     },{passive:true});
   });
 }
 $$(".magnetic-cta").forEach(link=>link.addEventListener("click",event=>{
   if(reduce.matches)return;
   const r=link.getBoundingClientRect();
   const ripple=doc.createElement("span");ripple.className="magnet-ripple";
   ripple.style.left=(event.clientX-r.left)+"px";
   ripple.style.top=(event.clientY-r.top)+"px";
   ripple.setAttribute("aria-hidden","true");
   link.appendChild(ripple);
   ripple.addEventListener("animationend",()=>ripple.remove(),{once:true});
 }));

 // 13. Continuous marquee is existing site content; CSS handles pause and hover.
 setPaused(false);
})();