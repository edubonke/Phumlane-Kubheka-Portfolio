
/* PK / FIELD NOTES — progressive enhancement: the content remains readable without JS. */
(() => {
  "use strict";
  const doc = document;
  const $ = (selector, root = doc) => root.querySelector(selector);
  const $$ = (selector, root = doc) => Array.from(root.querySelectorAll(selector));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover:hover) and (pointer:fine)");
  const theme = $("#themeToggle");
  const html = doc.documentElement;

  // Visitor-controlled appearance; photography flips with the chosen mode.
  let saved = "";
  try { saved = localStorage.getItem("pk-theme") || ""; } catch (_) {}
  if (saved === "dark" || saved === "light") html.dataset.theme = saved;
  const setThemeButton = () => {
    const dark = html.dataset.theme === "dark";
    theme.setAttribute("aria-pressed", String(dark));
    theme.setAttribute("aria-label", dark ? "Switch to light appearance" : "Switch to dark appearance");
    $(".theme-icon", theme).textContent = dark ? "☼" : "◐";
    doc.querySelector('meta[name="theme-color"]').content = dark ? "#15191d" : "#f5f2eb";
    drawBinary();
  };
  theme.addEventListener("click", () => {
    const mode = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = mode;
    try { localStorage.setItem("pk-theme", mode); } catch (_) {}
    setThemeButton();
  });

  // Compact navigation, explicit keyboard escape and close-on-navigation.
  const menuButton = $("#menuToggle");
  const menu = $("#mobileNav");
  const closeMenu = () => {
    menu.hidden = true;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
  };
  menuButton.addEventListener("click", () => {
    const expand = menu.hidden;
    menu.hidden = !expand;
    menuButton.setAttribute("aria-expanded", String(expand));
    menuButton.setAttribute("aria-label", expand ? "Close menu" : "Open menu");
  });
  $$("a", menu).forEach(a => a.addEventListener("click", closeMenu));
  doc.addEventListener("keydown", event => {
    if (event.key === "Escape" && !menu.hidden) closeMenu();
  });
  addEventListener("resize", () => { if (innerWidth > 860 && !menu.hidden) closeMenu(); }, {passive:true});

  // Scroll orientation with passive input work and a cheap rAF.
  const progress = $("#scrollProgress");
  const navLinks = $$(".desktop-nav a");
  let scrollPending = false;
  const onScroll = () => {
    scrollPending = false;
    const max = Math.max(1, doc.documentElement.scrollHeight - innerHeight);
    progress.style.width = Math.min(100, Math.max(0, scrollY / max * 100)) + "%";
    const sections = ["work", "expertise", "experience", "about"];
    let current = "";
    for (const name of sections) {
      const rect = doc.getElementById(name).getBoundingClientRect();
      if (rect.top <= 145) current = name;
    }
    navLinks.forEach(link => {
      if (link.hash === "#" + current) link.setAttribute("aria-current","true");
      else link.removeAttribute("aria-current");
    });
  };
  addEventListener("scroll", () => {
    if (!scrollPending) {
      scrollPending = true;
      requestAnimationFrame(onScroll);
    }
  },{passive:true});
  onScroll();
  $("#year").textContent = String(new Date().getFullYear());

  // Viewport reveals. Reduced-motion and no-Observer visitors always see content.
  const reveals = $$(".reveal");
  if (!reduce.matches && "IntersectionObserver" in window) {
    html.classList.add("js");
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      });
    },{threshold:.045,rootMargin:"0px 0px -35px 0px"});
    reveals.forEach(node => observer.observe(node));
  }

  // Ambient 0/1 system: purposely confined to the hero, not body copy.
  const binary = $("#binaryCanvas");
  const context = binary.getContext("2d");
  const hero = $(".hero");
  let bw = 0, bh = 0, cells = [], binaryTimer = null;
  function prepareBinary() {
    if (!context) return;
    const rect = hero.getBoundingClientRect();
    bw = Math.max(1, Math.round(rect.width));
    bh = Math.max(1, Math.round(rect.height));
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    binary.width = Math.round(bw * ratio);
    binary.height = Math.round(bh * ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
    cells = [];
    const xStep = innerWidth < 650 ? 49 : 57;
    const yStep = innerWidth < 650 ? 54 : 59;
    for (let y=15; y<bh+50; y+=yStep) for (let x=16; x<bw+50; x+=xStep)
      cells.push({x,y,bit:Math.random()<.5?"0":"1",bright:Math.random()<.07});
    drawBinary();
  }
  function drawBinary() {
    if (!context || !bw) return;
    context.clearRect(0,0,bw,bh);
    const dark = html.dataset.theme === "dark";
    context.font = '600 11px "DM Sans", monospace';
    context.textAlign = "center";
    context.textBaseline = "middle";
    for (const cell of cells) {
      context.fillStyle = cell.bright ? (dark ? "rgba(176,192,255,.25)" : "rgba(53,73,228,.25)") : (dark ? "rgba(162,170,191,.16)" : "rgba(43,50,74,.12)");
      context.fillText(cell.bit,cell.x,cell.y);
    }
  }
  const pauseBinary = () => { if (binaryTimer !== null) clearInterval(binaryTimer); binaryTimer=null; };
  function syncBinary() {
    pauseBinary();
    drawBinary();
    if (doc.hidden || reduce.matches || !context) return;
    binaryTimer=setInterval(() => {
      cells.forEach(c => {
        if (Math.random()<.13) c.bit = c.bit==="0"?"1":"0";
        if (Math.random()<.08) c.bright = !c.bright;
      });
      drawBinary();
    },270);
  }
  if (context) {
    let resizeWait;
    const onResize=() => {
      clearTimeout(resizeWait);
      resizeWait=setTimeout(prepareBinary,160);
    };
    addEventListener("resize",onResize,{passive:true});
    doc.addEventListener("visibilitychange",syncBinary);
    if (reduce.addEventListener) reduce.addEventListener("change",syncBinary);
    prepareBinary();
    syncBinary();
  }
  setThemeButton();

  // One meaningful portrait parallax, on pointer devices and only with motion allowed.
  const portrait = $("#portraitArt");
  if (fine.matches && !reduce.matches) {
    let frame=0, mx=0, my=0;
    portrait.addEventListener("pointermove",event => {
      const r=portrait.getBoundingClientRect();
      mx=((event.clientX-r.left)/r.width-.5)*5;
      my=((event.clientY-r.top)/r.height-.5)*-5;
      if (frame) cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{portrait.style.transform="perspective(1200px) rotateY("+mx.toFixed(2)+"deg) rotateX("+my.toFixed(2)+"deg)";});
    },{passive:true});
    portrait.addEventListener("pointerleave",()=>{portrait.style.transform="";});
  }

  // Project case information deliberately distinguishes concepts from deployed products.
  const CASES = {
    edubonke: {
      name:"EduBonke",tag:"EDTECH / PRODUCT DESIGN",
      note:"Prototype with synthetic data. Production authentication and tenant isolation are not yet verified.",
      challenge:"College administration, learner records and assessment activity become difficult to coordinate when workflows are fragmented.",
      role:"Product concept, interface design, frontend prototyping and workflow modelling.",
      process:"Mapped learner, administration and assessment journeys, built role-aware screens and experimented with demonstration data. Identified gaps to address before production.",
      result:"An inspectable product prototype and a clearer specification for secure implementation.",
      url:"https://edubonke.github.io/EduBonke/",git:"https://github.com/edubonke/EduBonke"
    },
    kubhexa:{
      name:"Kubhexa Digital",tag:"WEB / BRAND EXPERIENCE",
      note:"Published studio website with responsive sections and enquiry navigation.",
      challenge:"Small businesses want to understand services, evaluate actual work and make contact with confidence.",
      role:"Web design, frontend development, publishing and SEO refinement.",
      process:"Structured the service offering and project showcases, built responsive pages and refined information hierarchy and discoverability.",
      result:"A published digital studio presence with more direct project discovery and enquiries.",
      url:"https://edubonke.github.io/Kubhexa-Digital/",git:"https://github.com/edubonke/Kubhexa-Digital"
    },
    shiftstart:{
      name:"ShiftStart",tag:"INTERFACE / RECRUITMENT",
      note:"Recruitment-focused redesign concept with functional and responsive testing.",
      challenge:"Job seekers and employers need a simple, low-friction recruitment journey.",
      role:"Interface redesign, frontend execution and functional checks.",
      process:"Reworked navigation, responsive interactions and the structure of recruitment pages, then reviewed the experience at different sizes.",
      result:"A testable recruitment website concept with more legible journeys.",
      url:"https://edubonke.github.io/Shift-Start/",git:"https://github.com/edubonke/Shift-Start"
    },
    auntie:{
      name:"Auntie & Uncle",tag:"SERVICE DESIGN / BOOKING",
      note:"Marketplace prototype with booking conflict, rescheduling and cancellation scenario tests.",
      challenge:"Service bookings require clear availability and predictable changes.",
      role:"Product flows, dashboards, integration and testing.",
      process:"Developed customer, service provider and administrator journeys, including the booking and schedule-change rules tested in the prototype.",
      result:"More coherent workflows and verified prototype scenarios ready for further product development.",
      url:"https://edubonke.github.io/Auntie-Uncle-V2/",git:"https://github.com/edubonke/Auntie-Uncle-V2"
    },
    alphasonic:{
      name:"Alphasonic International",tag:"BUSINESS / WEB DESIGN",
      note:"Responsive business website redesign.",
      challenge:"Visitors need to understand services, review relevant media and find an enquiry route quickly.",
      role:"Frontend development, information architecture and responsive testing.",
      process:"Reorganised services and media, improved the page hierarchy and built clear quote request interactions.",
      result:"A clearer business website designed around service discovery and enquiries.",
      url:"https://edubonke.github.io/Alphasonic-International/",git:"https://github.com/edubonke/Alphasonic-International"
    },
    cartide:{
      name:"Cartide Bar Scents",tag:"COMMERCE / BRAND",
      note:"Responsive brand showcase concept informed by supplied social identity.",
      challenge:"Translate a distinctive fragrance brand into a mobile-friendly product experience.",
      role:"Brand-sensitive frontend work, web presentation and visual checks.",
      process:"Aligned typography, product navigation and responsive layout to the brand's social presence.",
      result:"A mobile-friendly showcase that makes products and enquiries easier to discover.",
      url:"https://edubonke.github.io/Cartide-Bar-Scents/",git:"https://github.com/edubonke/Cartide-Bar-Scents"
    },
    labops:{
      name:"Computer Lab Reliability",tag:"IT SUPPORT / OPERATIONS",
      note:"Applied ICT-support practice, not a public software product.",
      challenge:"Shared teaching labs need consistent equipment readiness and fast fault resolution.",
      role:"Lab preparation, technical diagnostics and issue documentation.",
      process:"Use repeatable hardware, OS, networking and peripheral checks, recording issues and corrective actions.",
      result:"Structured practices supporting daily classes and practical assessments.",url:"",git:""
    },
    training:{
      name:"ICT Teaching & Assessment",tag:"LEARNING / DOCUMENTATION",
      note:"Professional teaching and assessment work, not a public software product.",
      challenge:"Learners need practical, accessible routes to demonstrate technical competence.",
      role:"ICT lecturing, accessible material design and learner progress support.",
      process:"Structure hands-on exercises, prepare accessible assessment resources and support portfolio evidence records and certification administration.",
      result:"Practical learning materials that make technical outcomes easier to practise and assess.",url:"",git:""
    }
  };
  const projects=$$(".project-card");
  const filters=$$(".filter");
  const status=$("#filterStatus");
  filters.forEach(btn => btn.addEventListener("click", () => {
    const mode=btn.dataset.filter;
    let shown=0;
    projects.forEach(card => {
      const visible=mode==="all"||card.dataset.category===mode;
      card.hidden=!visible;
      if(visible)shown++;
    });
    filters.forEach(control => {
      const selected=control===btn;
      control.classList.toggle("active",selected);
      control.setAttribute("aria-pressed",String(selected));
    });
    status.textContent="Showing "+shown+" selected "+(shown===1?"project":"projects");
    // Content is always immediately visible after filters, no stale scroll reveal.
    projects.filter(c=>!c.hidden).forEach(c=>c.classList.add("in-view"));
    queueResizePreviews();
  }));

  // Small live site previews load only near the viewport.
  const miniFrames=$$(".site-peek");
  function scalePeek(frame) {
    const box=frame.parentElement.getBoundingClientRect();
    frame.style.setProperty("--peek-scale",String(Math.max(.1,box.width/1200)));
    frame.style.height="760px";
  }
  function queueResizePreviews(){miniFrames.forEach(scalePeek);}
  if ("ResizeObserver" in window) {
    const ro=new ResizeObserver(entries=>{
      entries.forEach(entry=>{
        const frame=$(".site-peek",entry.target);
        if(frame)scalePeek(frame);
      });
    });
    $$(".project-visual").forEach(v=>ro.observe(v));
  } else addEventListener("resize",queueResizePreviews,{passive:true});
  queueResizePreviews();
  const loadPeek=frame => {
    if(!frame || !frame.dataset.src)return;
    const address=frame.dataset.src;
    delete frame.dataset.src;
    frame.addEventListener("load",()=>frame.parentElement.classList.add("peek-loaded"),{once:true});
    frame.src=address;
  };
  if("IntersectionObserver" in window) {
    const peeker=new IntersectionObserver(entries=> {
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        loadPeek(entry.target);
        peeker.unobserve(entry.target);
      });
    },{rootMargin:"300px 0px",threshold:0});
    miniFrames.forEach(frame=>peeker.observe(frame));
  } else miniFrames.forEach(loadPeek);

  // Native dialogs support escape and keyboard focus automatically.
  const preview=$("#previewDialog");
  const previewFrame=$("#previewFrame");
  const previewTitle=$("#previewTitle");
  const device=$("#deviceFrame");
  const previewOpen=$("#openWebsite");
  const previewModes=$$("[data-size]",preview);
  let activeUrl="";
  function setPreviewSize(size) {
    device.classList.toggle("mobile",size==="mobile");
    previewModes.forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.size===size)));
  }
  $$("[data-preview]").forEach(btn=>btn.addEventListener("click",()=>{
    const data=CASES[btn.dataset.preview];
    if(!data || !data.url)return;
    activeUrl=data.url;
    previewTitle.textContent=data.name;
    previewOpen.href=activeUrl;
    previewFrame.title="Interactive live preview of "+data.name;
    setPreviewSize("desktop");
    preview.showModal();
    doc.body.style.overflow="hidden";
    previewFrame.src=activeUrl;
  }));
  previewModes.forEach(btn=>btn.addEventListener("click",()=>setPreviewSize(btn.dataset.size)));
  $("#closePreview").addEventListener("click",()=>preview.close());
  $("#reloadPreview").addEventListener("click",()=>{if(activeUrl)previewFrame.src=activeUrl;});
  preview.addEventListener("click",event=>{if(event.target===preview)preview.close();});
  preview.addEventListener("close",()=>{
    previewFrame.src="about:blank";activeUrl="";
    doc.body.style.overflow="";
  });

  const caseDialog=$("#caseDialog");
  $$("[data-case]").forEach(btn=>btn.addEventListener("click",()=>{
    const data=CASES[btn.dataset.case];
    if(!data)return;
    $("#caseKicker").textContent=data.tag+" / CASE STUDY";
    $("#caseTitle").textContent=data.name;
    $("#caseNote").textContent=data.note;
    $("#caseChallenge").textContent=data.challenge;
    $("#caseRole").textContent=data.role;
    $("#caseProcess").textContent=data.process;
    $("#caseResult").textContent=data.result;
    const live=$("#caseLive"),source=$("#caseSource");
    live.hidden=!data.url;
    source.hidden=!data.git;
    if(data.url)live.href=data.url;
    if(data.git)source.href=data.git;
    caseDialog.showModal();
    doc.body.style.overflow="hidden";
  }));
  $("#closeCase").addEventListener("click",()=>caseDialog.close());
  $("#caseDone").addEventListener("click",()=>caseDialog.close());
  caseDialog.addEventListener("click",event=>{if(event.target===caseDialog)caseDialog.close();});
  caseDialog.addEventListener("close",()=>{doc.body.style.overflow="";});

  // Working technical demonstrations.
  const checks=$$("[data-check]");
  const counter=$("#diagCount");
  const bar=$("#diagProgress");
  const updateDiag=()=>{
    const n=checks.filter(input=>input.checked).length;
    counter.textContent=n+" of "+checks.length+" checks"+(n===checks.length?" — ready to document":"");
    bar.style.width=(n/checks.length*100)+"%";
  };
  checks.forEach(c=>c.addEventListener("change",updateDiag));
  $("#diagReset").addEventListener("click",()=>{checks.forEach(c=>c.checked=false);updateDiag();});
  updateDiag();

  const decimal=$("#decimalInput");
  const output=$("#binaryOutput");
  const hint=$("#binaryHint");
  const convert=()=>{
    const raw=decimal.value.trim();
    const value=Number(raw);
    if(raw===""||!Number.isInteger(value)||value<0||value>255){
      decimal.setAttribute("aria-invalid","true");
      output.value="—";
      hint.textContent="Enter a whole number from 0 to 255.";
      return;
    }
    decimal.removeAttribute("aria-invalid");
    const bits=value.toString(2).padStart(8,"0");
    output.value=bits;
    hint.textContent=value+" in decimal = "+bits+" in binary.";
  };
  $("#convertBtn").addEventListener("click",convert);
  decimal.addEventListener("input",convert);
  convert();
})();