import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, ChevronDown, ChevronUp, Download, FileText, Loader2, RotateCcw, Lock, User, Camera, Check, FileEdit, Zap } from "lucide-react";

/* ============================================================
   FONT STACKS
   ============================================================ */
const JAKARTA = '"Plus Jakarta Sans", "Inter", system-ui, sans-serif';
const INTER   = '"Inter", system-ui, sans-serif';
const MONO    = '"DM Mono", "JetBrains Mono", Menlo, monospace';
const OUTFIT  = '"Outfit", "Plus Jakarta Sans", system-ui, sans-serif';
const DM_SANS = '"DM Sans", "Inter", system-ui, sans-serif';
const PLAYFAIR = '"Playfair Display", Georgia, serif';
const LIBRE   = '"Libre Baskerville", Georgia, serif';

/* ============================================================
   HELPERS
   ============================================================ */
const hex2rgba = (hex, a) => {
  const h = (hex||"#000").replace("#","");
  const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
};
const lighten = (hex, pct) => {
  const h=(hex||"#000").replace("#","");
  const r=Math.min(255,parseInt(h.slice(0,2),16)+Math.round(255*pct));
  const g=Math.min(255,parseInt(h.slice(2,4),16)+Math.round(255*pct));
  const b=Math.min(255,parseInt(h.slice(4,6),16)+Math.round(255*pct));
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
};
const hexToRtf = hex => { const h=(hex||"#000").replace("#",""); return {r:parseInt(h.slice(0,2),16),g:parseInt(h.slice(2,4),16),b:parseInt(h.slice(4,6),16)}; };
const rtfEsc = s => { if(s==null)return""; return String(s).replace(/\\/g,"\\\\").replace(/\{/g,"\\{").replace(/\}/g,"\\}").replace(/[\u0080-\uFFFF]/g,c=>`\\u${c.charCodeAt(0)}?`).replace(/\n/g,"\\line "); };
const dlBlob = (blob, fn) => { const u=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=u; a.download=fn; a.style.display="none"; document.body.appendChild(a); a.click(); setTimeout(()=>{ a.parentNode?.removeChild(a); URL.revokeObjectURL(u); },1500); };

/* ============================================================
   DATA
   ============================================================ */
const EMPTY = {
  name:"", photo:null,
  contact:{ email:"", phone:"", location:"", linkedin:"", github:"" },
  education:[],
  experience:[],
  projects:[],
  activities:[],
  skills:{ technical:[], tools:[], languages:[] },
  awards:[],
};

const SAMPLE = {
  name:"Zoe Pham", photo:null,
  contact:{ email:"zoe.pham@student.uq.edu.au", phone:"+61 432 881 204", location:"Brisbane, QLD", linkedin:"linkedin.com/in/zoepham", github:"github.com/zoepham" },
  education:[{
    degree:"Bachelor of Information Technology (Honours)", major:"Software Engineering", university:"University of Queensland",
    location:"Brisbane, QLD", start:"Feb 2022", end:"Nov 2025", gpa:"6.5 / 7.0",
    coursework:"Algorithms & Data Structures, Human-Computer Interaction, Software Architecture, Machine Learning Fundamentals",
    honors:"Dean's Commendation for Academic Excellence (2023, 2024)",
  }],
  experience:[
    { title:"Software Engineering Intern", company:"Atlassian", location:"Sydney, NSW", start:"Nov 2024", end:"Feb 2025",
      bullets:["Built a Jira automation feature using React and TypeScript, shipped to 12,000+ users within 6 weeks.","Reduced API response time by 34% through query optimisation in a high-traffic internal dashboard.","Participated in daily standups and sprint planning within a 9-person agile team."] },
    { title:"Junior Web Developer (Part-time)", company:"Vivid Digital", location:"Brisbane, QLD", start:"Mar 2023", end:"Oct 2024",
      bullets:["Developed and maintained client websites for 8 local businesses using React, Next.js, and Tailwind CSS.","Integrated headless CMS solutions (Sanity, Contentful) reducing client content update requests by 60%."] },
  ],
  projects:[
    { name:"StudySync — AI Study Planner", tech:"React, Python, OpenAI API", description:"Web app that generates personalised study schedules from uploaded syllabi using GPT-4.", bullets:["Reached 1,200 active users within 3 weeks of launch with zero marketing spend.","Built a FastAPI backend with PostgreSQL, deployed on AWS EC2 with CI/CD via GitHub Actions."], link:"github.com/zoepham/studysync" },
    { name:"Brisbane Food Rescue App", tech:"React Native, Firebase", description:"Mobile app connecting restaurants with surplus food to local charities — UQ Hackathon 2024 Winner.", bullets:["Won 1st place out of 47 teams at UQ Innovation Hackathon (24-hour sprint).","Facilitated 300+ food rescue events in the first month after launch."], link:"" },
  ],
  activities:[
    { role:"Vice President", org:"UQ Computing Society", period:"2023 – Present", description:"Led a 400-member student tech community, organising 12 industry panels, 3 hackathons, and weekly coding workshops." },
    { role:"Mentor", org:"Girls in Tech QLD", period:"2024 – Present", description:"Mentoring 6 high school students from underrepresented backgrounds in coding and career pathways." },
  ],
  skills:{
    technical:["React","TypeScript","Python","Next.js","Node.js","SQL","REST APIs","Git"],
    tools:["Figma","VS Code","AWS","Docker","GitHub Actions","PostgreSQL","Firebase"],
    languages:["English (Native)","Vietnamese (Fluent)"],
  },
  awards:["UQ Innovation Hackathon — 1st Place (2024)","Dean's Commendation for Academic Excellence (2023, 2024)","UQ Future Leaders Scholarship ($8,000) — 2022"],
};

/* ============================================================
   COVER LETTER DATA
   ============================================================ */
const EMPTY_CL = {
  recipientName:"", recipientTitle:"", company:"", companyAddress:"", date:"",
  opening:"", body1:"", body2:"", body3:"", closing:"",
};

const SAMPLE_CL = {
  recipientName:"James Liu",
  recipientTitle:"Engineering Recruiter",
  company:"Canva",
  companyAddress:"110 Kippax St, Surry Hills NSW 2010",
  date:"June 10, 2026",
  opening:"I've been using Canva since high school to make everything from student council posters to research presentations — which is probably why, when I saw this internship role, it felt less like a job ad and more like a natural next step. Canva's mission to democratise design sits at the exact intersection of software engineering and real-world impact that I want to be building toward.",
  body1:"At my most recent internship at Atlassian I built a Jira automation feature in React and TypeScript that shipped to 12,000 users within six weeks, and reduced API response time by 34% in a high-traffic internal dashboard. Working in a fast-moving agile team taught me how to move quickly without cutting corners — and how to ask the right questions early so the wrong decisions don't compound later.",
  body2:"Outside of work I built StudySync, an AI-powered study planner that reached 1,200 active users in three weeks with zero marketing. That project forced me to own the full stack — React frontend, FastAPI backend, AWS deployment, and CI/CD via GitHub Actions — and gave me a genuine feel for what it's like to ship something people actually depend on. I also won first place at the UQ Innovation Hackathon, where our team built and deployed a React Native food rescue app in 24 hours.",
  body3:"I'd love to bring that same drive to Canva's engineering team this summer. I'm available to chat anytime — happy to walk through my projects or talk through how I approach a technical problem.",
  closing:"Thank you for your time, and I look forward to hearing from you.",
};

/* ============================================================
   TEMPLATES
   ============================================================ */
const TEMPLATES = [
  { id:"gradient-fresh",  label:"Fresh Start",  blurb:"Gradient header, education callout card.",        accent:"#6C47FF", accent2:"#06B6D4", layout:"gradient-fresh",  nameFont:OUTFIT,   bodyFont:JAKARTA, swatch:["#6C47FF","#06B6D4"] },
  { id:"split-academic",  label:"Dean's List",   blurb:"Teal sidebar, academic credential-first.",       accent:"#0E6B5E", accent2:null,       layout:"split-academic",  nameFont:JAKARTA,  bodyFont:DM_SANS, swatch:["#0E6B5E","#F0FDF8"] },
  { id:"corporate-clean", label:"Intern Ready",  blurb:"Dark header, skills chips, corporate-polished.", accent:"#0F2744", accent2:null,       layout:"corporate-clean", nameFont:OUTFIT,   bodyFont:INTER,   swatch:["#0F2744","#E8F4FD"] },
  { id:"tech-portfolio",  label:"Portfolio",     blurb:"Mono accents, project-forward, tech & design.",  accent:"#1A1A2E", accent2:"#6C47FF",  layout:"tech-portfolio",  nameFont:OUTFIT,   bodyFont:INTER,   swatch:["#1A1A2E","#6C47FF"] },
  { id:"scholar-serif",   label:"Scholar",       blurb:"Formal serif header for grad school & honours.", accent:"#4A1942", accent2:null,       layout:"scholar-serif",   nameFont:PLAYFAIR, bodyFont:LIBRE,   swatch:["#4A1942","#FDF8FF"] },
  { id:"ats-clean",       label:"ATS Safe",      blurb:"Zero graphics, single-column, maximum ATS compatibility.", accent:"#1B3A5C", accent2:null, layout:"ats-clean", nameFont:JAKARTA,  bodyFont:INTER,   swatch:["#1B3A5C","#F0F4F8"] },
];

const ACCENT_PRESETS = [
  "#6C47FF","#0F2744","#0E6B5E","#B84A2A","#1A1A2E","#4A1942","#0D47A1","#1B3A5C","#2C5F6B","#333333"
];

/* ============================================================
   PHOTO
   ============================================================ */
function PhotoUpload({ photo, onChange }) {
  const ref = useRef(null);
  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-violet-200 flex items-center justify-center bg-violet-50 flex-shrink-0">
        {photo ? <img src={photo} className="w-full h-full object-cover" alt="Profile"/> : <User className="w-5 h-5 text-violet-300"/>}
      </div>
      <div>
        <button onClick={()=>ref.current?.click()} className="text-xs font-medium text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-md transition-colors">
          <Camera className="w-3 h-3 inline mr-1"/>{photo?"Change photo":"Upload photo"}
        </button>
        {photo&&<button onClick={()=>onChange(null)} className="ml-2 text-xs text-gray-400 hover:text-red-500 transition-colors">Remove</button>}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>onChange(ev.target.result); r.readAsDataURL(f); }}/>
    </div>
  );
}

/* ============================================================
   FORM COMPONENTS
   ============================================================ */
const fc = "w-full px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all";
const lc = "block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1";

function Accordion({ title, badge, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button onClick={()=>setOpen(!open)} className="w-full flex items-center justify-between py-3 text-left group">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 group-hover:text-violet-700 transition-colors">{title}</span>
          {badge!=null&&<span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-300"/> : <ChevronDown className="w-4 h-4 text-gray-300"/>}
      </button>
      {open&&<div className="pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function TagInput({ label, items, onChange, placeholder }) {
  const [val, setVal] = useState("");
  const add = () => { const t=val.trim(); if(t&&!items.includes(t)){ onChange([...items,t]); setVal(""); }};
  return (
    <div>
      <label className={lc}>{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {items.map((item,i)=>(
          <span key={i} className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-full font-medium">
            {item}<button onClick={()=>onChange(items.filter((_,j)=>j!==i))} className="text-violet-400 hover:text-red-500 transition-colors"><X className="w-3 h-3"/></button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input className={fc} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"||e.key===","){ e.preventDefault(); add(); }}} placeholder={placeholder||"Type and press Enter"}/>
        <button onClick={add} className="px-3 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded-lg text-xs font-medium transition-colors">Add</button>
      </div>
    </div>
  );
}

function BulletInput({ label, items, onChange, placeholder }) {
  const upd=(i,v)=>onChange(items.map((x,j)=>j===i?v:x));
  const rm=(i)=>onChange(items.filter((_,j)=>j!==i));
  return (
    <div>
      {label&&<label className={lc}>{label}</label>}
      <div className="space-y-1.5">
        {items.map((item,i)=>(
          <div key={i} className="flex gap-1.5">
            <input className={fc} value={item} onChange={e=>upd(i,e.target.value)} placeholder={placeholder||"Add a bullet point"}/>
            <button onClick={()=>rm(i)} className="px-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X className="w-4 h-4"/></button>
          </div>
        ))}
        <button onClick={()=>onChange([...items,""])} className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-violet-50 transition-colors font-medium"><Plus className="w-3 h-3"/>Add point</button>
      </div>
    </div>
  );
}

/* ============================================================
   RESUME FORM
   ============================================================ */
function ResumeForm({ data, setData }) {
  const set = (path, val) => setData(prev => {
    const next = JSON.parse(JSON.stringify(prev));
    const parts = path.split("."); let cur = next;
    for(let i=0;i<parts.length-1;i++) cur=cur[parts[i]];
    cur[parts[parts.length-1]] = val;
    return next;
  });

  const updEdu=(i,k,v)=>setData(p=>({...p,education:p.education.map((e,j)=>j===i?{...e,[k]:v}:e)}));
  const updExp=(i,k,v)=>setData(p=>({...p,experience:p.experience.map((e,j)=>j===i?{...e,[k]:v}:e)}));
  const updPrj=(i,k,v)=>setData(p=>({...p,projects:p.projects.map((e,j)=>j===i?{...e,[k]:v}:e)}));
  const updAct=(i,k,v)=>setData(p=>({...p,activities:p.activities.map((e,j)=>j===i?{...e,[k]:v}:e)}));

  return (
    <div className="space-y-0">
      <Accordion title="Personal Info">
        <PhotoUpload photo={data.photo} onChange={v=>set("photo",v)}/>
        <div><label className={lc}>Full name</label><input className={fc} value={data.name} onChange={e=>set("name",e.target.value)} placeholder="Zoe Pham"/></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={lc}>Email</label><input className={fc} value={data.contact.email} onChange={e=>set("contact.email",e.target.value)} placeholder="zoe@email.com"/></div>
          <div><label className={lc}>Phone</label><input className={fc} value={data.contact.phone} onChange={e=>set("contact.phone",e.target.value)} placeholder="+61 400 000 000"/></div>
          <div><label className={lc}>Location</label><input className={fc} value={data.contact.location} onChange={e=>set("contact.location",e.target.value)} placeholder="Brisbane, QLD"/></div>
          <div><label className={lc}>LinkedIn</label><input className={fc} value={data.contact.linkedin} onChange={e=>set("contact.linkedin",e.target.value)} placeholder="linkedin.com/in/you"/></div>
          <div className="col-span-2"><label className={lc}>GitHub / Portfolio</label><input className={fc} value={data.contact.github} onChange={e=>set("contact.github",e.target.value)} placeholder="github.com/you or yoursite.com"/></div>
        </div>
      </Accordion>

      <Accordion title="Education" badge={data.education.length}>
        {data.education.map((ed,i)=>(
          <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
            <div className="flex justify-between items-center"><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Entry {i+1}</span><button onClick={()=>setData(p=>({...p,education:p.education.filter((_,j)=>j!==i)}))} className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><label className={lc}>Degree / Qualification</label><input className={fc} value={ed.degree} onChange={e=>updEdu(i,"degree",e.target.value)} placeholder="Bachelor of Information Technology"/></div>
              <div className="col-span-2"><label className={lc}>Major / Specialisation</label><input className={fc} value={ed.major} onChange={e=>updEdu(i,"major",e.target.value)} placeholder="Software Engineering"/></div>
              <div className="col-span-2"><label className={lc}>University / Institution</label><input className={fc} value={ed.university} onChange={e=>updEdu(i,"university",e.target.value)} placeholder="University of Queensland"/></div>
              <div><label className={lc}>Location</label><input className={fc} value={ed.location} onChange={e=>updEdu(i,"location",e.target.value)} placeholder="Brisbane, QLD"/></div>
              <div><label className={lc}>GPA / WAM</label><input className={fc} value={ed.gpa} onChange={e=>updEdu(i,"gpa",e.target.value)} placeholder="6.5 / 7.0"/></div>
              <div><label className={lc}>Start date</label><input className={fc} value={ed.start} onChange={e=>updEdu(i,"start",e.target.value)} placeholder="Feb 2022"/></div>
              <div><label className={lc}>End / Expected</label><input className={fc} value={ed.end} onChange={e=>updEdu(i,"end",e.target.value)} placeholder="Nov 2025"/></div>
              <div className="col-span-2"><label className={lc}>Relevant coursework (optional)</label><input className={fc} value={ed.coursework} onChange={e=>updEdu(i,"coursework",e.target.value)} placeholder="Algorithms, HCI, Machine Learning..."/></div>
              <div className="col-span-2"><label className={lc}>Honors / Awards (optional)</label><input className={fc} value={ed.honors} onChange={e=>updEdu(i,"honors",e.target.value)} placeholder="Dean's Commendation, Merit Award..."/></div>
            </div>
          </div>
        ))}
        <button onClick={()=>setData(p=>({...p,education:[...p.education,{degree:"",major:"",university:"",location:"",start:"",end:"",gpa:"",coursework:"",honors:""}]}))} className="w-full py-2 border border-dashed border-violet-200 text-violet-500 hover:bg-violet-50 hover:border-violet-400 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"><Plus className="w-4 h-4"/>Add education</button>
      </Accordion>

      <Accordion title="Work Experience" badge={data.experience.length}>
        {data.experience.map((exp,i)=>(
          <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
            <div className="flex justify-between items-center"><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role {i+1}</span><button onClick={()=>setData(p=>({...p,experience:p.experience.filter((_,j)=>j!==i)}))} className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><label className={lc}>Job title</label><input className={fc} value={exp.title} onChange={e=>updExp(i,"title",e.target.value)} placeholder="Software Engineering Intern"/></div>
              <div><label className={lc}>Company</label><input className={fc} value={exp.company} onChange={e=>updExp(i,"company",e.target.value)} placeholder="Atlassian"/></div>
              <div><label className={lc}>Location</label><input className={fc} value={exp.location} onChange={e=>updExp(i,"location",e.target.value)} placeholder="Sydney, NSW"/></div>
              <div><label className={lc}>Start</label><input className={fc} value={exp.start} onChange={e=>updExp(i,"start",e.target.value)} placeholder="Nov 2024"/></div>
              <div><label className={lc}>End</label><input className={fc} value={exp.end} onChange={e=>updExp(i,"end",e.target.value)} placeholder="Feb 2025 or Present"/></div>
            </div>
            <BulletInput items={exp.bullets||[]} onChange={v=>updExp(i,"bullets",v)} placeholder="What did you achieve or build?"/>
          </div>
        ))}
        <button onClick={()=>setData(p=>({...p,experience:[...p.experience,{title:"",company:"",location:"",start:"",end:"",bullets:[]}]}))} className="w-full py-2 border border-dashed border-violet-200 text-violet-500 hover:bg-violet-50 hover:border-violet-400 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"><Plus className="w-4 h-4"/>Add role</button>
      </Accordion>

      <Accordion title="Projects" badge={data.projects.length}>
        {data.projects.map((p,i)=>(
          <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
            <div className="flex justify-between items-center"><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Project {i+1}</span><button onClick={()=>setData(pr=>({...pr,projects:pr.projects.filter((_,j)=>j!==i)}))} className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button></div>
            <div><label className={lc}>Project name</label><input className={fc} value={p.name} onChange={e=>updPrj(i,"name",e.target.value)} placeholder="StudySync — AI Study Planner"/></div>
            <div><label className={lc}>Tech stack / Tools used</label><input className={fc} value={p.tech} onChange={e=>updPrj(i,"tech",e.target.value)} placeholder="React, Python, OpenAI API"/></div>
            <div><label className={lc}>Description</label><textarea className={fc} rows={2} value={p.description} onChange={e=>updPrj(i,"description",e.target.value)} placeholder="One sentence about what it does and why it matters."/></div>
            <div><label className={lc}>Link (optional)</label><input className={fc} value={p.link} onChange={e=>updPrj(i,"link",e.target.value)} placeholder="github.com/you/project"/></div>
            <BulletInput items={p.bullets||[]} onChange={v=>updPrj(i,"bullets",v)} placeholder="Key achievement or metric"/>
          </div>
        ))}
        <button onClick={()=>setData(p=>({...p,projects:[...p.projects,{name:"",tech:"",description:"",link:"",bullets:[]}]}))} className="w-full py-2 border border-dashed border-violet-200 text-violet-500 hover:bg-violet-50 hover:border-violet-400 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"><Plus className="w-4 h-4"/>Add project</button>
      </Accordion>

      <Accordion title="Activities & Leadership" badge={data.activities.length} defaultOpen={false}>
        {data.activities.map((a,i)=>(
          <div key={i} className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2">
            <div className="flex justify-between items-center"><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Activity {i+1}</span><button onClick={()=>setData(p=>({...p,activities:p.activities.filter((_,j)=>j!==i)}))} className="text-gray-300 hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={lc}>Role</label><input className={fc} value={a.role} onChange={e=>updAct(i,"role",e.target.value)} placeholder="Vice President"/></div>
              <div><label className={lc}>Organisation</label><input className={fc} value={a.org} onChange={e=>updAct(i,"org",e.target.value)} placeholder="UQ Computing Society"/></div>
              <div className="col-span-2"><label className={lc}>Period</label><input className={fc} value={a.period} onChange={e=>updAct(i,"period",e.target.value)} placeholder="2023 – Present"/></div>
              <div className="col-span-2"><label className={lc}>What you did / achieved</label><textarea className={fc} rows={2} value={a.description} onChange={e=>updAct(i,"description",e.target.value)} placeholder="Led a 400-member student tech community..."/></div>
            </div>
          </div>
        ))}
        <button onClick={()=>setData(p=>({...p,activities:[...p.activities,{role:"",org:"",period:"",description:""}]}))} className="w-full py-2 border border-dashed border-violet-200 text-violet-500 hover:bg-violet-50 hover:border-violet-400 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-all"><Plus className="w-4 h-4"/>Add activity</button>
      </Accordion>

      <Accordion title="Skills" defaultOpen={false}>
        <TagInput label="Technical skills" items={data.skills.technical} onChange={v=>set("skills.technical",v)} placeholder="React, Python, SQL…"/>
        <TagInput label="Tools & software" items={data.skills.tools} onChange={v=>set("skills.tools",v)} placeholder="Figma, AWS, Docker…"/>
        <TagInput label="Languages" items={data.skills.languages} onChange={v=>set("skills.languages",v)} placeholder="English (Native)…"/>
      </Accordion>

      <Accordion title="Awards & Scholarships" defaultOpen={false}>
        <BulletInput items={data.awards} onChange={v=>set("awards",v)} placeholder="UQ Hackathon 1st Place (2024)"/>
      </Accordion>
    </div>
  );
}

/* ============================================================
   RESUME LAYOUTS
   ============================================================ */

/* shared helpers */
const contactItems = (data) => [data.contact?.email, data.contact?.phone, data.contact?.location, data.contact?.linkedin, data.contact?.github].filter(Boolean);

function SkillChips({ skills, accent, bodyFont, small=false }) {
  const all = [...(skills.technical||[]), ...(skills.tools||[])];
  if(!all.length) return null;
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:"0.05in" }}>
      {all.map((s,i)=>(
        <span key={i} style={{ fontFamily:bodyFont, fontSize:small?"7.5pt":"8.5pt", background:hex2rgba(accent,0.08), color:accent, padding:"0.02in 0.09in", borderRadius:"50px", fontWeight:600, border:`1px solid ${hex2rgba(accent,0.2)}` }}>{s}</span>
      ))}
      {(skills.languages||[]).map((s,i)=>(
        <span key={"l"+i} style={{ fontFamily:bodyFont, fontSize:small?"7.5pt":"8.5pt", background:hex2rgba("#666",0.07), color:"#555", padding:"0.02in 0.09in", borderRadius:"50px", fontWeight:500, border:"1px solid rgba(0,0,0,0.1)" }}>{s}</span>
      ))}
    </div>
  );
}

function EduCard({ ed, accent, bodyFont, nameFont, card=false }) {
  return (
    <div style={{ marginBottom:"0.12in", ...(card ? { background:hex2rgba(accent,0.04), border:`1px solid ${hex2rgba(accent,0.12)}`, borderRadius:"5px", padding:"0.1in 0.14in" } : {}) }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:"0.2in" }}>
        <div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>{ed.degree}</div>
        <div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#777", whiteSpace:"nowrap", flexShrink:0 }}>{[ed.start,ed.end].filter(Boolean).join(" – ")}</div>
      </div>
      {ed.major&&<div style={{ fontFamily:bodyFont, fontSize:"10pt", color:accent, fontWeight:600, marginTop:"0.02in" }}>{ed.major}</div>}
      <div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#555" }}>{[ed.university,ed.location].filter(Boolean).join(", ")}</div>
      {ed.gpa&&<div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#555", marginTop:"0.02in" }}>GPA: <span style={{ fontWeight:600, color:accent }}>{ed.gpa}</span></div>}
      {ed.coursework&&<div style={{ fontFamily:bodyFont, fontSize:"8.5pt", color:"#777", marginTop:"0.03in", fontStyle:"italic" }}>Coursework: {ed.coursework}</div>}
      {ed.honors&&<div style={{ fontFamily:bodyFont, fontSize:"8.5pt", color:accent, marginTop:"0.03in", fontWeight:500 }}>{ed.honors}</div>}
    </div>
  );
}

function ExpBlock({ exp, accent, bodyFont, i, total }) {
  return (
    <div style={{ marginBottom:i===total-1?"0":"0.14in" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:"0.2in" }}>
        <div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>
          {exp.title}
          {exp.company&&<span style={{ fontWeight:400, color:"#555" }}> — {exp.company}</span>}
          {exp.location&&<span style={{ fontWeight:400, color:"#777", fontSize:"9.5pt" }}>, {exp.location}</span>}
        </div>
        <div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#777", whiteSpace:"nowrap", flexShrink:0 }}>{[exp.start,exp.end].filter(Boolean).join(" – ")}</div>
      </div>
      {(exp.bullets||[]).length>0&&<ul style={{ margin:"0.04in 0 0", paddingLeft:"0.2in" }}>{exp.bullets.map((b,j)=><li key={j} style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.025in", lineHeight:1.55 }}>{b}</li>)}</ul>}
    </div>
  );
}

function ProjBlock({ p, accent, bodyFont, monoFont=false }) {
  return (
    <div style={{ marginBottom:"0.14in" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:"0.15in", flexWrap:"wrap" }}>
        <div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>
          {p.name}
          {p.tech&&<span style={{ fontFamily:monoFont?MONO:bodyFont, fontWeight:400, color:accent, fontSize:"8.5pt", marginLeft:"0.08in" }}>{monoFont?"// ":""}{p.tech}</span>}
        </div>
        {p.link&&<div style={{ fontFamily:bodyFont, fontSize:"8pt", color:accent, fontStyle:"italic" }}>{p.link}</div>}
      </div>
      {p.description&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#555", margin:"0.03in 0", fontStyle:"italic" }}>{p.description}</div>}
      {(p.bullets||[]).length>0&&<ul style={{ margin:"0.03in 0 0", paddingLeft:"0.2in" }}>{p.bullets.map((b,j)=><li key={j} style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.025in", lineHeight:1.55 }}>{b}</li>)}</ul>}
    </div>
  );
}

function SecTitle({ children, accent, bodyFont, style={} }) {
  return (
    <div style={{ fontFamily:bodyFont, fontSize:"8.5pt", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.16em", color:accent, paddingBottom:"0.04in", borderBottom:`1.5px solid ${hex2rgba(accent,0.25)}`, marginBottom:"0.09in", marginTop:"0.18in", ...style }}>
      {children}
    </div>
  );
}

/* ── 1. Gradient Fresh ── */
function LayoutGradientFresh({ data, accent, accent2, nameFont, bodyFont }) {
  const ci = contactItems(data);
  const a2 = accent2||lighten(accent,0.25);
  return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#FAFAFA", fontFamily:bodyFont, boxSizing:"border-box", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.18)" }}>
      <div style={{ background:`linear-gradient(130deg, ${accent} 0%, ${a2} 100%)`, padding:"0.48in 0.7in 0.38in", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-30%", right:"-5%", width:"3.5in", height:"3.5in", borderRadius:"50%", background:"rgba(255,255,255,0.06)" }}/>
        <div style={{ position:"absolute", bottom:"-40%", left:"20%", width:"2.5in", height:"2.5in", borderRadius:"50%", background:"rgba(255,255,255,0.04)" }}/>
        <div style={{ position:"relative" }}>
          <h1 style={{ fontFamily:nameFont, fontSize:"30pt", fontWeight:800, color:"#fff", margin:0, lineHeight:1.1, letterSpacing:"-0.01em" }}>{data.name||"Your Name"}</h1>
          {data.education?.[0]&&<div style={{ color:"rgba(255,255,255,0.85)", fontSize:"10.5pt", marginTop:"0.07in", fontFamily:bodyFont, fontWeight:500 }}>{[data.education[0].major||data.education[0].degree, data.education[0].university].filter(Boolean).join(" · ")}</div>}
          <div style={{ color:"rgba(255,255,255,0.72)", fontSize:"8.5pt", marginTop:"0.1in", fontFamily:bodyFont }}>{ci.join("  ·  ")}</div>
        </div>
      </div>
      <div style={{ padding:"0.3in 0.7in 0.6in", boxSizing:"border-box" }}>
        {data.education?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Education</SecTitle>{data.education.map((ed,i)=><EduCard key={i} ed={ed} accent={accent} bodyFont={bodyFont} nameFont={nameFont} card={true}/>)}</>}
        {data.experience?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Experience</SecTitle>{data.experience.map((exp,i)=><ExpBlock key={i} exp={exp} accent={accent} bodyFont={bodyFont} i={i} total={data.experience.length}/>)}</>}
        {data.projects?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Projects</SecTitle>{data.projects.map((p,i)=><ProjBlock key={i} p={p} accent={accent} bodyFont={bodyFont}/>)}</>}
        {data.activities?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Activities &amp; Leadership</SecTitle>{data.activities.map((a,i)=><div key={i} style={{ marginBottom:"0.1in" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:"0.2in" }}><div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>{a.role}{a.org&&<span style={{ fontWeight:400, color:"#555" }}> — {a.org}</span>}</div><div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#777", whiteSpace:"nowrap", flexShrink:0 }}>{a.period}</div></div>{a.description&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#444", marginTop:"0.03in", lineHeight:1.55 }}>{a.description}</div>}</div>)}</>}
        {(data.skills?.technical?.length||data.skills?.tools?.length||data.skills?.languages?.length)>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Skills</SecTitle><SkillChips skills={data.skills} accent={accent} bodyFont={bodyFont}/></>}
        {data.awards?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Awards &amp; Scholarships</SecTitle><ul style={{ margin:0, paddingLeft:"0.2in" }}>{data.awards.map((a,i)=><li key={i} style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.03in" }}>{a}</li>)}</ul></>}
      </div>
    </div>
  );
}

/* ── 2. Split Academic (Dean's List) ── */
function LayoutSplitAcademic({ data, accent, nameFont, bodyFont }) {
  const ci = contactItems(data);
  return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#FAFAFA", fontFamily:bodyFont, boxSizing:"border-box", display:"flex", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.18)" }}>
      <div style={{ width:"2.5in", background:accent, padding:"0.5in 0.3in", boxSizing:"border-box", flexShrink:0 }}>
        <div style={{ fontFamily:nameFont, fontSize:"17pt", fontWeight:800, color:"#fff", lineHeight:1.2, wordBreak:"break-word" }}>{data.name||"Your Name"}</div>
        {data.education?.[0]&&<div style={{ fontFamily:bodyFont, fontSize:"8.5pt", color:"rgba(255,255,255,0.72)", marginTop:"0.07in", fontStyle:"italic", lineHeight:1.4 }}>{data.education[0].major||data.education[0].degree}</div>}
        <div style={{ marginTop:"0.2in", borderTop:"1px solid rgba(255,255,255,0.18)", paddingTop:"0.15in" }}>
          <div style={{ fontFamily:bodyFont, fontSize:"7pt", textTransform:"uppercase", letterSpacing:"0.18em", color:"rgba(255,255,255,0.45)", marginBottom:"0.08in" }}>Contact</div>
          {ci.map((v,i)=><div key={i} style={{ fontFamily:bodyFont, fontSize:"8pt", color:"rgba(255,255,255,0.85)", marginBottom:"0.05in", wordBreak:"break-word" }}>{v}</div>)}
        </div>
        {(data.skills?.technical?.length||data.skills?.tools?.length)>0&&<div style={{ marginTop:"0.18in", borderTop:"1px solid rgba(255,255,255,0.18)", paddingTop:"0.15in" }}>
          <div style={{ fontFamily:bodyFont, fontSize:"7pt", textTransform:"uppercase", letterSpacing:"0.18em", color:"rgba(255,255,255,0.45)", marginBottom:"0.08in" }}>Technical Skills</div>
          {[...(data.skills.technical||[]),...(data.skills.tools||[])].map((s,i)=><div key={i} style={{ fontFamily:bodyFont, fontSize:"8pt", color:"rgba(255,255,255,0.88)", marginBottom:"0.04in", display:"flex", alignItems:"center", gap:"0.06in" }}><span style={{ width:"4px", height:"4px", borderRadius:"50%", background:"rgba(255,255,255,0.45)", flexShrink:0, display:"inline-block" }}/>{s}</div>)}
        </div>}
        {data.skills?.languages?.length>0&&<div style={{ marginTop:"0.15in", borderTop:"1px solid rgba(255,255,255,0.18)", paddingTop:"0.15in" }}>
          <div style={{ fontFamily:bodyFont, fontSize:"7pt", textTransform:"uppercase", letterSpacing:"0.18em", color:"rgba(255,255,255,0.45)", marginBottom:"0.08in" }}>Languages</div>
          {data.skills.languages.map((s,i)=><div key={i} style={{ fontFamily:bodyFont, fontSize:"8pt", color:"rgba(255,255,255,0.88)", marginBottom:"0.04in" }}>{s}</div>)}
        </div>}
        {data.awards?.length>0&&<div style={{ marginTop:"0.15in", borderTop:"1px solid rgba(255,255,255,0.18)", paddingTop:"0.15in" }}>
          <div style={{ fontFamily:bodyFont, fontSize:"7pt", textTransform:"uppercase", letterSpacing:"0.18em", color:"rgba(255,255,255,0.45)", marginBottom:"0.08in" }}>Awards</div>
          {data.awards.map((a,i)=><div key={i} style={{ fontFamily:bodyFont, fontSize:"7.5pt", color:"rgba(255,255,255,0.85)", marginBottom:"0.06in", lineHeight:1.5 }}>{a}</div>)}
        </div>}
      </div>
      <div style={{ flex:1, padding:"0.5in 0.45in 0.6in 0.4in", boxSizing:"border-box" }}>
        {data.education?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont} style={{ marginTop:0 }}>Education</SecTitle>{data.education.map((ed,i)=><EduCard key={i} ed={ed} accent={accent} bodyFont={bodyFont} nameFont={nameFont}/>)}</>}
        {data.experience?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Experience</SecTitle>{data.experience.map((exp,i)=><ExpBlock key={i} exp={exp} accent={accent} bodyFont={bodyFont} i={i} total={data.experience.length}/>)}</>}
        {data.projects?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Projects</SecTitle>{data.projects.map((p,i)=><ProjBlock key={i} p={p} accent={accent} bodyFont={bodyFont}/>)}</>}
        {data.activities?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Activities &amp; Leadership</SecTitle>{data.activities.map((a,i)=><div key={i} style={{ marginBottom:"0.1in" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}><div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>{a.role}{a.org&&<span style={{ fontWeight:400, color:"#555" }}> — {a.org}</span>}</div><div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#777", whiteSpace:"nowrap", flexShrink:0 }}>{a.period}</div></div>{a.description&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#444", marginTop:"0.03in", lineHeight:1.55 }}>{a.description}</div>}</div>)}</>}
      </div>
    </div>
  );
}

/* ── 3. Corporate Clean (Intern Ready) ── */
function LayoutCorporateClean({ data, accent, nameFont, bodyFont }) {
  const ci = contactItems(data);
  return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#FAFAFA", fontFamily:bodyFont, boxSizing:"border-box", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.18)" }}>
      <div style={{ background:accent, padding:"0.42in 0.7in", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:"2.5in", height:"100%", background:"rgba(255,255,255,0.04)", clipPath:"polygon(30% 0, 100% 0, 100% 100%, 0% 100%)" }}/>
        <div style={{ position:"relative" }}>
          <h1 style={{ fontFamily:nameFont, fontSize:"28pt", fontWeight:800, color:"#fff", margin:0, lineHeight:1.1, letterSpacing:"0.01em" }}>{data.name||"Your Name"}</h1>
          {data.education?.[0]&&<div style={{ color:"rgba(255,255,255,0.75)", fontSize:"10pt", marginTop:"0.06in", fontFamily:bodyFont }}>{[data.education[0].major||data.education[0].degree, data.education[0].university].filter(Boolean).join(" · ")}</div>}
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:"8.5pt", marginTop:"0.09in", fontFamily:bodyFont }}>{ci.join("  ·  ")}</div>
        </div>
      </div>
      <div style={{ padding:"0.35in 0.7in 0.6in", boxSizing:"border-box" }}>
        {(data.skills?.technical?.length||data.skills?.tools?.length)>0&&<div style={{ marginBottom:"0.15in" }}><SecTitle accent={accent} bodyFont={bodyFont} style={{ marginTop:0 }}>Skills</SecTitle><SkillChips skills={data.skills} accent={accent} bodyFont={bodyFont}/></div>}
        {data.education?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Education</SecTitle>{data.education.map((ed,i)=><EduCard key={i} ed={ed} accent={accent} bodyFont={bodyFont} nameFont={nameFont}/>)}</>}
        {data.experience?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Experience</SecTitle>{data.experience.map((exp,i)=><ExpBlock key={i} exp={exp} accent={accent} bodyFont={bodyFont} i={i} total={data.experience.length}/>)}</>}
        {data.projects?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Projects</SecTitle>{data.projects.map((p,i)=><ProjBlock key={i} p={p} accent={accent} bodyFont={bodyFont}/>)}</>}
        {data.activities?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Activities &amp; Leadership</SecTitle>{data.activities.map((a,i)=><div key={i} style={{ marginBottom:"0.1in" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}><div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>{a.role}{a.org&&<span style={{ fontWeight:400, color:"#555" }}> — {a.org}</span>}</div><div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#777", whiteSpace:"nowrap", flexShrink:0 }}>{a.period}</div></div>{a.description&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#444", marginTop:"0.03in" }}>{a.description}</div>}</div>)}</>}
        {data.awards?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Awards &amp; Scholarships</SecTitle><ul style={{ margin:0, paddingLeft:"0.2in" }}>{data.awards.map((a,i)=><li key={i} style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.03in" }}>{a}</li>)}</ul></>}
      </div>
    </div>
  );
}

/* ── 4. Tech Portfolio ── */
function LayoutTechPortfolio({ data, accent, accent2, nameFont, bodyFont }) {
  const ci = contactItems(data); const a2 = accent2||accent;
  return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#F8F9FA", fontFamily:bodyFont, boxSizing:"border-box", display:"flex", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.22)" }}>
      <div style={{ width:"0.18in", background:a2, flexShrink:0 }}/>
      <div style={{ flex:1, padding:"0.55in 0.55in 0.6in 0.45in", boxSizing:"border-box" }}>
        <div style={{ marginBottom:"0.25in", paddingBottom:"0.18in", borderBottom:`1px solid ${hex2rgba(accent,0.12)}` }}>
          <h1 style={{ fontFamily:nameFont, fontSize:"28pt", fontWeight:700, color:"#0d0d0d", margin:0, lineHeight:1.1 }}>{data.name||"Your Name"}</h1>
          {data.education?.[0]&&<div style={{ fontFamily:MONO, fontSize:"8.5pt", color:a2, marginTop:"0.07in" }}>// {data.education[0].major||data.education[0].degree}</div>}
          <div style={{ fontFamily:MONO, fontSize:"7.5pt", color:"#666", marginTop:"0.07in", letterSpacing:"0.02em" }}>{ci.join("  |  ")}</div>
        </div>
        {(data.skills?.technical?.length||data.skills?.tools?.length)>0&&<div style={{ marginBottom:"0.15in", padding:"0.1in 0.12in", background:hex2rgba(accent,0.04), borderRadius:"4px", border:`1px solid ${hex2rgba(accent,0.1)}` }}><div style={{ fontFamily:MONO, fontSize:"8pt", color:a2, fontWeight:500, marginBottom:"0.06in" }}>{'// skills'}</div><SkillChips skills={data.skills} accent={a2} bodyFont={MONO}/></div>}
        {data.projects?.length>0&&<><SecTitle accent={a2} bodyFont={bodyFont}>Selected Projects</SecTitle>{data.projects.map((p,i)=><ProjBlock key={i} p={p} accent={a2} bodyFont={bodyFont} monoFont={true}/>)}</>}
        {data.experience?.length>0&&<><SecTitle accent={a2} bodyFont={bodyFont}>Experience</SecTitle>{data.experience.map((exp,i)=><ExpBlock key={i} exp={exp} accent={a2} bodyFont={bodyFont} i={i} total={data.experience.length}/>)}</>}
        {data.education?.length>0&&<><SecTitle accent={a2} bodyFont={bodyFont}>Education</SecTitle>{data.education.map((ed,i)=><EduCard key={i} ed={ed} accent={a2} bodyFont={bodyFont} nameFont={nameFont}/>)}</>}
        {data.activities?.length>0&&<><SecTitle accent={a2} bodyFont={bodyFont}>Activities</SecTitle>{data.activities.map((a,i)=><div key={i} style={{ marginBottom:"0.08in" }}><div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10pt", color:"#111" }}>{a.role}{a.org&&<span style={{ fontWeight:400, color:"#555" }}> — {a.org}</span>}<span style={{ fontFamily:MONO, fontSize:"8pt", color:"#999", marginLeft:"0.1in" }}>{a.period}</span></div>{a.description&&<div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#555", marginTop:"0.02in" }}>{a.description}</div>}</div>)}</>}
        {data.awards?.length>0&&<><SecTitle accent={a2} bodyFont={bodyFont}>Recognition</SecTitle><ul style={{ margin:0, paddingLeft:"0.2in" }}>{data.awards.map((a,i)=><li key={i} style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.03in" }}>{a}</li>)}</ul></>}
      </div>
    </div>
  );
}

/* ── 5. Scholar Serif ── */
function LayoutScholarSerif({ data, accent, nameFont, bodyFont }) {
  const ci = contactItems(data);
  return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#FEFDF9", fontFamily:bodyFont, boxSizing:"border-box", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.14)" }}>
      <div style={{ padding:"0.6in 0.85in 0.3in", boxSizing:"border-box", textAlign:"center", borderBottom:`1px solid ${hex2rgba(accent,0.2)}` }}>
        <h1 style={{ fontFamily:nameFont, fontSize:"30pt", fontWeight:700, color:"#111", margin:0, lineHeight:1.1 }}>{data.name||"Your Name"}</h1>
        {data.education?.[0]&&<div style={{ fontFamily:bodyFont, fontSize:"10.5pt", color:"#666", marginTop:"0.08in", fontStyle:"italic" }}>{[data.education[0].major||data.education[0].degree, data.education[0].university].filter(Boolean).join(" · ")}</div>}
        <div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#777", marginTop:"0.1in" }}>{ci.join("  ·  ")}</div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.12in", marginTop:"0.2in" }}>
          <div style={{ width:"0.6in", height:"1px", background:hex2rgba(accent,0.3) }}/>
          <div style={{ width:"6px", height:"6px", background:accent, transform:"rotate(45deg)" }}/>
          <div style={{ width:"0.6in", height:"1px", background:hex2rgba(accent,0.3) }}/>
        </div>
      </div>
      <div style={{ padding:"0.3in 0.85in 0.6in", boxSizing:"border-box" }}>
        {data.education?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont} style={{ marginTop:0 }}>Education</SecTitle>{data.education.map((ed,i)=><EduCard key={i} ed={ed} accent={accent} bodyFont={bodyFont} nameFont={nameFont}/>)}</>}
        {data.experience?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Experience</SecTitle>{data.experience.map((exp,i)=><ExpBlock key={i} exp={exp} accent={accent} bodyFont={bodyFont} i={i} total={data.experience.length}/>)}</>}
        {data.projects?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Projects &amp; Research</SecTitle>{data.projects.map((p,i)=><ProjBlock key={i} p={p} accent={accent} bodyFont={bodyFont}/>)}</>}
        {data.activities?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Activities &amp; Leadership</SecTitle>{data.activities.map((a,i)=><div key={i} style={{ marginBottom:"0.1in" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}><div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>{a.role}{a.org&&<span style={{ fontWeight:400, color:"#555" }}> — {a.org}</span>}</div><div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#777", whiteSpace:"nowrap" }}>{a.period}</div></div>{a.description&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#444", marginTop:"0.03in", fontStyle:"italic" }}>{a.description}</div>}</div>)}</>}
        {(data.skills?.technical?.length||data.skills?.tools?.length)>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Skills &amp; Tools</SecTitle><div style={{ fontFamily:bodyFont, fontSize:"10pt", color:"#333" }}>{[...(data.skills.technical||[]),...(data.skills.tools||[])].join("  ·  ")}</div></>}
        {data.awards?.length>0&&<><SecTitle accent={accent} bodyFont={bodyFont}>Awards &amp; Scholarships</SecTitle><ul style={{ margin:0, paddingLeft:"0.2in" }}>{data.awards.map((a,i)=><li key={i} style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.03in" }}>{a}</li>)}</ul></>}
      </div>
    </div>
  );
}

/* ── 6. ATS Clean ── */
function LayoutAtsClean({ data, accent, nameFont, bodyFont }) {
  const ci = contactItems(data);
  const SH = ({ children }) => (
    <div style={{ fontFamily:bodyFont, fontSize:"8.5pt", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.18em", color:accent, borderBottom:`1px solid ${hex2rgba(accent,0.22)}`, paddingBottom:"0.04in", marginTop:"0.18in", marginBottom:"0.08in" }}>{children}</div>
  );
  return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#fff", fontFamily:bodyFont, boxSizing:"border-box", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.1)", padding:"0.65in 0.85in 0.7in" }}>
      <div style={{ borderBottom:`2px solid ${accent}`, paddingBottom:"0.16in", marginBottom:"0.2in" }}>
        <h1 style={{ fontFamily:nameFont, fontSize:"24pt", fontWeight:700, color:accent, margin:0, lineHeight:1.1 }}>{data.name||"Your Name"}</h1>
        {data.education?.[0]&&<div style={{ fontFamily:bodyFont, fontSize:"10pt", color:"#555", marginTop:"0.04in", fontStyle:"italic" }}>{[data.education[0].major||data.education[0].degree, data.education[0].university].filter(Boolean).join(", ")}</div>}
        <div style={{ fontFamily:bodyFont, fontSize:"8.5pt", color:"#666", marginTop:"0.07in" }}>{ci.join("  ·  ")}</div>
      </div>
      {data.education?.length>0&&<><SH>Education</SH>{data.education.map((ed,i)=><div key={i} style={{ marginBottom:"0.12in" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}><div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>{ed.degree}{ed.major&&<span style={{ fontWeight:400 }}> — {ed.major}</span>}</div><div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#666", whiteSpace:"nowrap", flexShrink:0 }}>{[ed.start,ed.end].filter(Boolean).join(" – ")}</div></div><div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#555" }}>{[ed.university,ed.location].filter(Boolean).join(", ")}{ed.gpa&&<span style={{ fontWeight:600 }}> · GPA: {ed.gpa}</span>}</div>{ed.coursework&&<div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#777", fontStyle:"italic" }}>Coursework: {ed.coursework}</div>}{ed.honors&&<div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#555" }}>{ed.honors}</div>}</div>)}</>}
      {data.experience?.length>0&&<><SH>Experience</SH>{data.experience.map((exp,i)=><ExpBlock key={i} exp={exp} accent={accent} bodyFont={bodyFont} i={i} total={data.experience.length}/>)}</>}
      {data.projects?.length>0&&<><SH>Projects</SH>{data.projects.map((p,i)=><div key={i} style={{ marginBottom:"0.12in" }}><div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>{p.name}{p.tech&&<span style={{ fontWeight:400, color:"#555" }}> ({p.tech})</span>}{p.link&&<span style={{ fontStyle:"italic", color:"#777", fontSize:"9pt" }}> — {p.link}</span>}</div>{p.description&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#555", fontStyle:"italic" }}>{p.description}</div>}{(p.bullets||[]).length>0&&<ul style={{ margin:"0.03in 0 0", paddingLeft:"0.2in" }}>{p.bullets.map((b,j)=><li key={j} style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.02in" }}>{b}</li>)}</ul>}</div>)}</>}
      {data.activities?.length>0&&<><SH>Activities &amp; Leadership</SH>{data.activities.map((a,i)=><div key={i} style={{ marginBottom:"0.09in" }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}><div style={{ fontFamily:bodyFont, fontWeight:700, fontSize:"10.5pt", color:"#111" }}>{a.role}{a.org&&<span style={{ fontWeight:400 }}> — {a.org}</span>}</div><div style={{ fontFamily:bodyFont, fontSize:"9pt", color:"#666", whiteSpace:"nowrap" }}>{a.period}</div></div>{a.description&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#444" }}>{a.description}</div>}</div>)}</>}
      {(data.skills?.technical?.length||data.skills?.tools?.length||data.skills?.languages?.length)>0&&<><SH>Skills</SH>{data.skills?.technical?.length>0&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.04in" }}><span style={{ fontWeight:600 }}>Technical: </span>{data.skills.technical.join(", ")}</div>}{data.skills?.tools?.length>0&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.04in" }}><span style={{ fontWeight:600 }}>Tools: </span>{data.skills.tools.join(", ")}</div>}{data.skills?.languages?.length>0&&<div style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222" }}><span style={{ fontWeight:600 }}>Languages: </span>{data.skills.languages.join(", ")}</div>}</>}
      {data.awards?.length>0&&<><SH>Awards &amp; Scholarships</SH><ul style={{ margin:0, paddingLeft:"0.2in" }}>{data.awards.map((a,i)=><li key={i} style={{ fontFamily:bodyFont, fontSize:"9.5pt", color:"#222", marginBottom:"0.03in" }}>{a}</li>)}</ul></>}
    </div>
  );
}

/* ── Router ── */
function ResumePreview({ templateId, data, accent }) {
  const tpl = TEMPLATES.find(t=>t.id===templateId)||TEMPLATES[0];
  const props = { data, accent:accent||tpl.accent, accent2:tpl.accent2, nameFont:tpl.nameFont, bodyFont:tpl.bodyFont };
  switch(tpl.layout) {
    case "gradient-fresh":  return <LayoutGradientFresh {...props}/>;
    case "split-academic":  return <LayoutSplitAcademic {...props}/>;
    case "corporate-clean": return <LayoutCorporateClean {...props}/>;
    case "tech-portfolio":  return <LayoutTechPortfolio {...props}/>;
    case "scholar-serif":   return <LayoutScholarSerif {...props}/>;
    case "ats-clean":       return <LayoutAtsClean {...props}/>;
    default:                return <LayoutGradientFresh {...props}/>;
  }
}

/* ============================================================
   EXPORT
   ============================================================ */
function exportPDF(el, name) {
  if(!el)return;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${(name||"Resume").replace(/[<>&"']/g,"")}</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap"><style>@page{size:letter;margin:0}html,body{margin:0;padding:0;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${el.innerHTML}<script>(function(){if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){setTimeout(function(){window.focus();window.print();},200);})}else{setTimeout(function(){window.focus();window.print();},800);}})()</script></body></html>`;
  const w=window.open("","_blank","width=900,height=1100");
  if(!w){alert("Please allow pop-ups to print.");return;}
  w.document.open();w.document.write(html);w.document.close();
}

function exportWord(data, accent) {
  const ac = hexToRtf(accent);
  const fn = ((data.name||"resume").replace(/[^a-z0-9]+/gi,"_").toLowerCase())+"_resume.rtf";
  const out = [];
  out.push(`{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat{\\fonttbl{\\f0\\fswiss\\fcharset0 Arial;}{\\f1\\froman\\fcharset0 Garamond;}}{\\colortbl;\\red17\\green17\\blue17;\\red80\\green80\\blue80;\\red${ac.r}\\green${ac.g}\\blue${ac.b};}\\paperw12240\\paperh15840\\margl1080\\margr1080\\margt1080\\margb1080\\f0\\fs22\\cf1`);
  if(data.name) out.push(`{\\pard\\ql\\sb0\\sa80\\fs44\\b\\cf3 ${rtfEsc(data.name)}\\b0\\par}`);
  const ed0=data.education?.[0];
  if(ed0) out.push(`{\\pard\\ql\\sb0\\sa40\\fs22\\i\\cf2 ${rtfEsc([ed0.major||ed0.degree,ed0.university].filter(Boolean).join(" · "))}\\i0\\par}`);
  const ci=contactItems(data);
  if(ci.length) out.push(`{\\pard\\ql\\sb0\\sa240\\fs19\\cf2 ${rtfEsc(ci.join("  ·  "))}\\par}`);
  const sh=t=>out.push(`{\\pard\\ql\\sb200\\sa60\\fs19\\b\\cf3 ${rtfEsc(t.toUpperCase())}\\b0\\par}{\\pard\\ql\\sb0\\sa100\\brdrb\\brdrs\\brdrw10\\brdrcf3\\par}`);
  if(data.education?.length){sh("Education");data.education.forEach(ed=>{out.push(`{\\pard\\ql\\sb80\\sa0\\fs22\\b\\cf1 ${rtfEsc(ed.degree)}${ed.major?` \\u8212? ${rtfEsc(ed.major)}`:""}\\b0\\par}`);if(ed.university)out.push(`{\\pard\\ql\\sa40\\fs21\\cf2 ${rtfEsc([ed.university,ed.location].filter(Boolean).join(", "))}${ed.gpa?`  \\b GPA: ${rtfEsc(ed.gpa)}\\b0`:""}\\par}`);if(ed.coursework)out.push(`{\\pard\\ql\\sa40\\fs20\\i\\cf2 Coursework: ${rtfEsc(ed.coursework)}\\i0\\par}`);if(ed.honors)out.push(`{\\pard\\ql\\sa40\\fs20\\cf3 ${rtfEsc(ed.honors)}\\par}`);out.push(`{\\pard\\sb60\\par}`);})}
  if(data.experience?.length){sh("Experience");data.experience.forEach(exp=>{out.push(`{\\pard\\ql\\sb80\\sa20\\fs22\\tx9000\\tqr\\tx9000 {\\b ${rtfEsc(exp.title)}\\b0}${exp.company?` \\u8212? ${rtfEsc(exp.company)}`:""}${exp.location?`, ${rtfEsc(exp.location)}`:""}\\tab ${rtfEsc([exp.start,exp.end].filter(Boolean).join(" \\u8212? "))}\\par}`);(exp.bullets||[]).forEach(b=>out.push(`{\\pard\\fi-280\\li360\\sa20\\fs22 \\u8226? \\tab ${rtfEsc(b)}\\par}`));out.push(`{\\pard\\sb60\\par}`);})}
  if(data.projects?.length){sh("Projects");data.projects.forEach(p=>{out.push(`{\\pard\\ql\\sb80\\sa20\\fs22\\b ${rtfEsc(p.name)}\\b0${p.tech?` {\\cf3 (${rtfEsc(p.tech)})}`:""}`);if(p.link)out.push(` {\\cf2\\i ${rtfEsc(p.link)}\\i0}`);out.push(`\\par}`);if(p.description)out.push(`{\\pard\\ql\\sa20\\fs21\\i\\cf2 ${rtfEsc(p.description)}\\i0\\par}`);(p.bullets||[]).forEach(b=>out.push(`{\\pard\\fi-280\\li360\\sa20\\fs22 \\u8226? \\tab ${rtfEsc(b)}\\par}`));out.push(`{\\pard\\sb60\\par}`);})}
  if(data.activities?.length){sh("Activities & Leadership");data.activities.forEach(a=>{out.push(`{\\pard\\ql\\sb80\\sa20\\fs22\\tx9000\\tqr\\tx9000 {\\b ${rtfEsc(a.role)}\\b0}${a.org?` \\u8212? ${rtfEsc(a.org)}`:""} \\tab ${rtfEsc(a.period||"")}\\par}`);if(a.description)out.push(`{\\pard\\ql\\sa40\\fs21\\cf2 ${rtfEsc(a.description)}\\par}`);out.push(`{\\pard\\sb40\\par}`);})}
  const allSkills=[...(data.skills?.technical||[]),...(data.skills?.tools||[])];
  if(allSkills.length){sh("Skills");if(data.skills?.technical?.length)out.push(`{\\pard\\ql\\sa40\\fs22 {\\b Technical:\\b0 } ${rtfEsc(data.skills.technical.join(", "))}\\par}`);if(data.skills?.tools?.length)out.push(`{\\pard\\ql\\sa40\\fs22 {\\b Tools:\\b0 } ${rtfEsc(data.skills.tools.join(", "))}\\par}`);if(data.skills?.languages?.length)out.push(`{\\pard\\ql\\sa40\\fs22 {\\b Languages:\\b0 } ${rtfEsc(data.skills.languages.join(", "))}\\par}`);}
  if(data.awards?.length){sh("Awards & Scholarships");data.awards.forEach(a=>out.push(`{\\pard\\fi-280\\li360\\sa30\\fs22 \\u8226? \\tab ${rtfEsc(a)}\\par}`));}
  out.push("}");
  dlBlob(new Blob([out.join("\n")],{type:"application/rtf"}),fn);
}

/* ============================================================
   COVER LETTER FORM
   ============================================================ */
function CoverLetterForm({ cl, setCl, onAutoFill }) {
  const set=(k,v)=>setCl(p=>({...p,[k]:v}));
  return (
    <div className="space-y-0">
      <Accordion title="CL — Your Details">
        <button onClick={onAutoFill} className="w-full flex items-center justify-center gap-2 py-2 mb-1 rounded-xl text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 transition-all">
          <Zap className="w-3.5 h-3.5"/>Auto-fill from resume
        </button>
        <div><label className={lc}>Full name</label><input className={fc} value={cl.senderName||""} onChange={e=>set("senderName",e.target.value)} placeholder="Zoe Pham"/></div>
        <div><label className={lc}>Your title / degree</label><input className={fc} value={cl.senderTitle||""} onChange={e=>set("senderTitle",e.target.value)} placeholder="B.IT (Software Engineering) Student"/></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={lc}>Email</label><input className={fc} value={cl.senderEmail||""} onChange={e=>set("senderEmail",e.target.value)} placeholder="zoe@email.com"/></div>
          <div><label className={lc}>Phone</label><input className={fc} value={cl.senderPhone||""} onChange={e=>set("senderPhone",e.target.value)} placeholder="+61 400 000 000"/></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={lc}>Location</label><input className={fc} value={cl.senderLocation||""} onChange={e=>set("senderLocation",e.target.value)} placeholder="Brisbane, QLD"/></div>
          <div><label className={lc}>LinkedIn / Portfolio</label><input className={fc} value={cl.senderLinkedin||""} onChange={e=>set("senderLinkedin",e.target.value)} placeholder="linkedin.com/in/you"/></div>
        </div>
      </Accordion>
      <Accordion title="CL — Recipient & Company">
        <div><label className={lc}>Date</label><input className={fc} value={cl.date} onChange={e=>set("date",e.target.value)} placeholder="June 10, 2026"/></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className={lc}>Hiring manager name</label><input className={fc} value={cl.recipientName} onChange={e=>set("recipientName",e.target.value)} placeholder="James Liu"/></div>
          <div><label className={lc}>Their title</label><input className={fc} value={cl.recipientTitle} onChange={e=>set("recipientTitle",e.target.value)} placeholder="Engineering Recruiter"/></div>
        </div>
        <div><label className={lc}>Company</label><input className={fc} value={cl.company} onChange={e=>set("company",e.target.value)} placeholder="Canva"/></div>
        <div><label className={lc}>Address <span className="normal-case font-normal text-gray-300">(optional)</span></label><input className={fc} value={cl.companyAddress} onChange={e=>set("companyAddress",e.target.value)} placeholder="110 Kippax St, Surry Hills NSW 2010"/></div>
      </Accordion>
      <Accordion title="CL — Letter Body">
        <p className="text-[11px] text-gray-400 leading-relaxed -mt-1">Write each paragraph separately — the preview assembles them in order.</p>
        <div><label className={lc}>Opening paragraph</label><textarea className={fc} rows={4} value={cl.opening} onChange={e=>set("opening",e.target.value)} placeholder="Hook the reader — why this company, why you, why now."/></div>
        <div><label className={lc}>Body paragraph 1</label><textarea className={fc} rows={4} value={cl.body1} onChange={e=>set("body1",e.target.value)} placeholder="Your strongest achievement or relevant experience."/></div>
        <div><label className={lc}>Body paragraph 2 <span className="normal-case font-normal text-gray-300">(optional)</span></label><textarea className={fc} rows={4} value={cl.body2} onChange={e=>set("body2",e.target.value)} placeholder="A project, skill, or angle that sets you apart."/></div>
        <div><label className={lc}>Body paragraph 3 <span className="normal-case font-normal text-gray-300">(optional)</span></label><textarea className={fc} rows={3} value={cl.body3} onChange={e=>set("body3",e.target.value)} placeholder="Why you're excited about this specific role or team."/></div>
        <div><label className={lc}>Closing sentence</label><input className={fc} value={cl.closing} onChange={e=>set("closing",e.target.value)} placeholder="Thank you for your time and consideration."/></div>
      </Accordion>
    </div>
  );
}

/* ============================================================
   COVER LETTER PREVIEW — matches each resume template
   ============================================================ */
function CoverLetterPreview({ templateId, cl, accent }) {
  const tpl  = TEMPLATES.find(t=>t.id===templateId)||TEMPLATES[0];
  const ac   = accent||tpl.accent;
  const ac2  = tpl.accent2;
  const nf   = tpl.nameFont;
  const bf   = tpl.bodyFont;
  const layout = tpl.layout;

  const empty = !cl.senderName && !cl.company && !cl.opening;
  if(empty) return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#FAFAFA", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.15)", boxSizing:"border-box" }}>
      <div style={{ textAlign:"center", color:"#bbb", fontFamily:JAKARTA, fontSize:"11pt" }}>
        <div style={{ fontSize:"24pt", marginBottom:"0.15in" }}>✉</div>Fill in the form to preview your cover letter
      </div>
    </div>
  );

  const contactStr = [cl.senderEmail, cl.senderPhone, cl.senderLocation, cl.senderLinkedin].filter(Boolean).join("  ·  ");
  const salutation = `Dear ${cl.recipientName||"Hiring Manager"},`;
  const paragraphs = [cl.opening, cl.body1, cl.body2, cl.body3].filter(Boolean);
  const closing    = cl.closing||"Thank you for your time and consideration.";

  const BodyBlock = ({ pad="0.45in 0.7in 0.7in", darkBg=false }) => {
    const tc = darkBg?"rgba(255,255,255,0.92)":"#1c1c1c";
    const sc = darkBg?"rgba(255,255,255,0.6)":"#555";
    return (
      <div style={{ padding:pad, boxSizing:"border-box" }}>
        {cl.date&&<div style={{ fontFamily:bf, fontSize:"9.5pt", color:sc, marginBottom:"0.18in" }}>{cl.date}</div>}
        {(cl.recipientName||cl.recipientTitle||cl.company)&&(
          <div style={{ fontFamily:bf, fontSize:"9.5pt", color:tc, lineHeight:1.7, marginBottom:"0.26in" }}>
            {cl.recipientName&&<div style={{ fontWeight:600 }}>{cl.recipientName}</div>}
            {cl.recipientTitle&&<div style={{ color:sc }}>{cl.recipientTitle}</div>}
            {cl.company&&<div style={{ color:sc }}>{cl.company}</div>}
            {cl.companyAddress&&<div style={{ color:darkBg?"rgba(255,255,255,0.4)":"#999" }}>{cl.companyAddress}</div>}
          </div>
        )}
        <div style={{ fontFamily:bf, fontSize:"10.5pt", color:tc, marginBottom:"0.2in" }}>{salutation}</div>
        {paragraphs.map((p,i)=><p key={i} style={{ fontFamily:bf, fontSize:"10.5pt", color:tc, lineHeight:1.78, margin:"0 0 0.17in 0" }}>{p}</p>)}
        <div style={{ fontFamily:bf, fontSize:"10.5pt", color:tc, marginTop:"0.06in" }}>{closing}</div>
        <div style={{ fontFamily:bf, fontSize:"10.5pt", color:tc, marginTop:"0.28in" }}>Sincerely,</div>
        <div style={{ fontFamily:nf, fontSize:"12pt", fontWeight:700, color:darkBg?"#fff":ac, marginTop:"0.3in", letterSpacing:"-0.01em" }}>{cl.senderName||""}</div>
        {cl.senderTitle&&<div style={{ fontFamily:bf, fontSize:"9pt", color:sc, marginTop:"0.03in", fontStyle:"italic" }}>{cl.senderTitle}</div>}
      </div>
    );
  };

  /* gradient-fresh */
  if(layout==="gradient-fresh") {
    const a2 = ac2||lighten(ac,0.25);
    return (
      <div style={{ width:"8.5in", minHeight:"11in", background:"#FAFAFA", boxSizing:"border-box", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.18)" }}>
        <div style={{ background:`linear-gradient(130deg, ${ac} 0%, ${a2} 100%)`, padding:"0.45in 0.7in 0.35in", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-30%", right:"-5%", width:"3.5in", height:"3.5in", borderRadius:"50%", background:"rgba(255,255,255,0.06)" }}/>
          <div style={{ position:"relative" }}>
            <h1 style={{ fontFamily:nf, fontSize:"26pt", fontWeight:800, color:"#fff", margin:0, lineHeight:1.1 }}>{cl.senderName||"Your Name"}</h1>
            {cl.senderTitle&&<div style={{ fontFamily:bf, fontSize:"10pt", color:"rgba(255,255,255,0.78)", marginTop:"0.05in", fontStyle:"italic" }}>{cl.senderTitle}</div>}
            {contactStr&&<div style={{ fontFamily:bf, fontSize:"8.5pt", color:"rgba(255,255,255,0.68)", marginTop:"0.09in" }}>{contactStr}</div>}
          </div>
        </div>
        <BodyBlock pad="0.42in 0.7in 0.7in"/>
      </div>
    );
  }

  /* split-academic */
  if(layout==="split-academic") return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#FAFAFA", boxSizing:"border-box", display:"flex", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.18)" }}>
      <div style={{ width:"2.5in", background:ac, padding:"0.5in 0.3in", boxSizing:"border-box", flexShrink:0 }}>
        <div style={{ fontFamily:nf, fontSize:"16pt", fontWeight:800, color:"#fff", lineHeight:1.2, wordBreak:"break-word" }}>{cl.senderName||"Your Name"}</div>
        {cl.senderTitle&&<div style={{ fontFamily:bf, fontSize:"8.5pt", color:"rgba(255,255,255,0.7)", marginTop:"0.06in", fontStyle:"italic", lineHeight:1.4 }}>{cl.senderTitle}</div>}
        <div style={{ marginTop:"0.2in", borderTop:"1px solid rgba(255,255,255,0.18)", paddingTop:"0.15in" }}>
          <div style={{ fontFamily:bf, fontSize:"7pt", textTransform:"uppercase", letterSpacing:"0.18em", color:"rgba(255,255,255,0.45)", marginBottom:"0.08in" }}>Contact</div>
          {[cl.senderEmail,cl.senderPhone,cl.senderLocation,cl.senderLinkedin].filter(Boolean).map((v,i)=><div key={i} style={{ fontFamily:bf, fontSize:"8pt", color:"rgba(255,255,255,0.85)", marginBottom:"0.05in", wordBreak:"break-word" }}>{v}</div>)}
        </div>
      </div>
      <div style={{ flex:1 }}><BodyBlock pad="0.5in 0.45in 0.7in 0.4in"/></div>
    </div>
  );

  /* corporate-clean */
  if(layout==="corporate-clean") return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#FAFAFA", boxSizing:"border-box", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.18)" }}>
      <div style={{ background:ac, padding:"0.42in 0.7in", boxSizing:"border-box", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, right:0, width:"2.5in", height:"100%", background:"rgba(255,255,255,0.04)", clipPath:"polygon(30% 0, 100% 0, 100% 100%, 0% 100%)" }}/>
        <div style={{ position:"relative" }}>
          <h1 style={{ fontFamily:nf, fontSize:"26pt", fontWeight:800, color:"#fff", margin:0, lineHeight:1.1 }}>{cl.senderName||"Your Name"}</h1>
          {cl.senderTitle&&<div style={{ fontFamily:bf, fontSize:"10pt", color:"rgba(255,255,255,0.75)", marginTop:"0.05in", fontStyle:"italic" }}>{cl.senderTitle}</div>}
          {contactStr&&<div style={{ fontFamily:bf, fontSize:"8.5pt", color:"rgba(255,255,255,0.65)", marginTop:"0.09in" }}>{contactStr}</div>}
        </div>
      </div>
      <BodyBlock pad="0.42in 0.7in 0.7in"/>
    </div>
  );

  /* tech-portfolio */
  if(layout==="tech-portfolio") {
    const a2 = ac2||ac;
    return (
      <div style={{ width:"8.5in", minHeight:"11in", background:"#F8F9FA", boxSizing:"border-box", display:"flex", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.22)" }}>
        <div style={{ width:"0.18in", background:a2, flexShrink:0 }}/>
        <div style={{ flex:1, padding:"0.55in 0.55in 0.7in 0.45in", boxSizing:"border-box" }}>
          <div style={{ marginBottom:"0.3in", paddingBottom:"0.18in", borderBottom:`1px solid ${hex2rgba(ac,0.12)}` }}>
            <h1 style={{ fontFamily:nf, fontSize:"26pt", fontWeight:700, color:"#0d0d0d", margin:0, lineHeight:1.1 }}>{cl.senderName||"Your Name"}</h1>
            {cl.senderTitle&&<div style={{ fontFamily:MONO, fontSize:"8.5pt", color:a2, marginTop:"0.06in" }}>// {cl.senderTitle}</div>}
            {contactStr&&<div style={{ fontFamily:MONO, fontSize:"7.5pt", color:"#666", marginTop:"0.07in", letterSpacing:"0.02em" }}>{contactStr}</div>}
          </div>
          <BodyBlock pad="0"/>
        </div>
      </div>
    );
  }

  /* scholar-serif */
  if(layout==="scholar-serif") return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#FEFDF9", boxSizing:"border-box", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.14)" }}>
      <div style={{ padding:"0.55in 0.85in 0.28in", boxSizing:"border-box", textAlign:"center", borderBottom:`1px solid ${hex2rgba(ac,0.2)}` }}>
        <h1 style={{ fontFamily:nf, fontSize:"28pt", fontWeight:700, color:"#111", margin:0, lineHeight:1.1 }}>{cl.senderName||"Your Name"}</h1>
        {cl.senderTitle&&<div style={{ fontFamily:bf, fontSize:"10pt", color:"#666", marginTop:"0.06in", fontStyle:"italic" }}>{cl.senderTitle}</div>}
        {contactStr&&<div style={{ fontFamily:bf, fontSize:"8.5pt", color:"#777", marginTop:"0.09in" }}>{contactStr}</div>}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.12in", marginTop:"0.18in" }}>
          <div style={{ width:"0.6in", height:"1px", background:hex2rgba(ac,0.3) }}/><div style={{ width:"6px", height:"6px", background:ac, transform:"rotate(45deg)" }}/><div style={{ width:"0.6in", height:"1px", background:hex2rgba(ac,0.3) }}/>
        </div>
      </div>
      <BodyBlock pad="0.32in 0.85in 0.7in"/>
    </div>
  );

  /* ats-clean */
  return (
    <div style={{ width:"8.5in", minHeight:"11in", background:"#fff", boxSizing:"border-box", boxShadow:"0 12px 40px -10px rgba(0,0,0,0.1)", padding:"0.65in 0.85in 0.7in" }}>
      <div style={{ borderBottom:`2px solid ${ac}`, paddingBottom:"0.16in", marginBottom:"0.3in" }}>
        <h1 style={{ fontFamily:nf, fontSize:"24pt", fontWeight:700, color:ac, margin:0, lineHeight:1.1 }}>{cl.senderName||"Your Name"}</h1>
        {cl.senderTitle&&<div style={{ fontFamily:bf, fontSize:"10pt", color:"#555", marginTop:"0.04in", fontStyle:"italic" }}>{cl.senderTitle}</div>}
        {contactStr&&<div style={{ fontFamily:bf, fontSize:"8.5pt", color:"#666", marginTop:"0.07in" }}>{contactStr}</div>}
      </div>
      <BodyBlock pad="0"/>
    </div>
  );
}

/* ============================================================
   COVER LETTER WORD EXPORT
   ============================================================ */
function exportCLWord(cl, accent) {
  const ac = hexToRtf(accent);
  const fn = ((cl.senderName||"cover-letter").replace(/[^a-z0-9]+/gi,"_").toLowerCase())+"_cover_letter.rtf";
  const out = [];
  out.push(`{\\rtf1\\ansi\\ansicpg1252\\deff0\\nouicompat{\\fonttbl{\\f0\\fswiss\\fcharset0 Arial;}{\\f1\\froman\\fcharset0 Garamond;}}{\\colortbl;\\red17\\green17\\blue17;\\red80\\green80\\blue80;\\red${ac.r}\\green${ac.g}\\blue${ac.b};}\\paperw12240\\paperh15840\\margl1152\\margr1152\\margt1152\\margb1152\\f0\\fs22\\cf1`);
  if(cl.senderName) out.push(`{\\pard\\ql\\sb0\\sa60\\fs40\\b\\cf3 ${rtfEsc(cl.senderName)}\\b0\\par}`);
  if(cl.senderTitle) out.push(`{\\pard\\ql\\sb0\\sa40\\fs22\\i\\cf2 ${rtfEsc(cl.senderTitle)}\\i0\\par}`);
  const ci=[cl.senderEmail,cl.senderPhone,cl.senderLocation,cl.senderLinkedin].filter(Boolean);
  if(ci.length) out.push(`{\\pard\\ql\\sb0\\sa240\\fs19\\cf2 ${rtfEsc(ci.join("  ·  "))}\\par}`);
  out.push(`{\\pard\\ql\\sb0\\sa240\\brdrb\\brdrs\\brdrw15\\brdrcf3\\par}`);
  if(cl.date) out.push(`{\\pard\\ql\\sb0\\sa120\\fs20\\cf2 ${rtfEsc(cl.date)}\\par}`);
  if(cl.recipientName||cl.recipientTitle||cl.company) {
    out.push(`{\\pard\\ql\\sb120\\sa0\\fs21\\cf1`);
    if(cl.recipientName) out.push(`{\\b ${rtfEsc(cl.recipientName)}\\b0}\\line `);
    if(cl.recipientTitle) out.push(`${rtfEsc(cl.recipientTitle)}\\line `);
    if(cl.company) out.push(`${rtfEsc(cl.company)}\\line `);
    if(cl.companyAddress) out.push(`{\\cf2 ${rtfEsc(cl.companyAddress)}}`);
    out.push(`\\par}`);
  }
  out.push(`{\\pard\\ql\\sb240\\sa120\\fs22\\cf1 ${rtfEsc(`Dear ${cl.recipientName||"Hiring Manager"},`)}\\par}`);
  [cl.opening,cl.body1,cl.body2,cl.body3].filter(Boolean).forEach(p=>{
    out.push(`{\\pard\\ql\\sb0\\sa180\\fs22\\cf1 ${rtfEsc(p)}\\par}`);
  });
  if(cl.closing) out.push(`{\\pard\\ql\\sb60\\sa120\\fs22\\cf1 ${rtfEsc(cl.closing)}\\par}`);
  out.push(`{\\pard\\ql\\sb180\\sa60\\fs22\\cf1 Sincerely,\\par}`);
  out.push(`{\\pard\\ql\\sb240\\sa0\\fs24\\b\\cf3 ${rtfEsc(cl.senderName||"")}\\b0\\par}`);
  if(cl.senderTitle) out.push(`{\\pard\\ql\\sb40\\sa0\\fs20\\i\\cf2 ${rtfEsc(cl.senderTitle)}\\i0\\par}`);
  out.push("}");
  dlBlob(new Blob([out.join("\n")],{type:"application/rtf"}),fn);
}

/* ============================================================
   TEMPLATE CARD
   ============================================================ */
function TemplateCard({ tpl, selected, onClick }) {
  return (
    <button onClick={onClick} className={`text-left p-3 rounded-xl border-2 transition-all ${selected?"border-violet-500 bg-violet-50 shadow-md shadow-violet-100":"border-gray-100 bg-white hover:border-violet-200 hover:shadow-sm"}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="flex gap-1">
          {tpl.swatch.map((c,i)=><div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background:c }}/>)}
        </div>
        <span className={`text-sm font-bold ${selected?"text-violet-700":"text-gray-800"}`}>{tpl.label}</span>
        {selected&&<Check className="w-3.5 h-3.5 text-violet-500 ml-auto"/>}
      </div>
      <p className={`text-[11px] leading-snug ${selected?"text-violet-600":"text-gray-400"}`}>{tpl.blurb}</p>
    </button>
  );
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function GradCV() {
  const [unlocked, setUnlocked] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [data, setData] = useState(SAMPLE);
  const [cl, setCl] = useState(SAMPLE_CL);
  const [tplId, setTplId] = useState("gradient-fresh");
  const [accentOverride, setAccentOverride] = useState(null);
  const [rightPanel, setRightPanel] = useState("resume");
  const [scale, setScale] = useState(0.75);
  const [previewH, setPreviewH] = useState(11*96);
  const [clScale, setClScale] = useState(0.75);
  const [clH, setClH] = useState(11*96);
  const [exporting, setExporting] = useState(null);
  const wrapRef    = useRef(null);
  const clWrapRef  = useRef(null);
  const previewRef = useRef(null);
  const clPrevRef  = useRef(null);
  const printRef   = useRef(null);
  const clPrintRef = useRef(null);

  const tpl = TEMPLATES.find(t=>t.id===tplId)||TEMPLATES[0];
  const effectiveAccent = accentOverride||tpl.accent;

  useEffect(()=>{
    const fit=()=>{
      if(wrapRef.current){ const w=wrapRef.current.clientWidth; setScale(Math.max(0.3,Math.min(1,(w-32)/(8.5*96)))); }
      if(clWrapRef.current){ const w=clWrapRef.current.clientWidth; setClScale(Math.max(0.3,Math.min(1,(w-32)/(8.5*96)))); }
    };
    fit(); window.addEventListener("resize",fit); return()=>window.removeEventListener("resize",fit);
  },[unlocked,rightPanel]);

  useEffect(()=>{
    if(!previewRef.current)return;
    const ob=new ResizeObserver(entries=>{for(const e of entries)setPreviewH(e.contentRect.height+32);}); ob.observe(previewRef.current); return()=>ob.disconnect();
  },[unlocked,tplId,data,effectiveAccent]);

  useEffect(()=>{
    if(!clPrevRef.current)return;
    const ob=new ResizeObserver(entries=>{for(const e of entries)setClH(e.contentRect.height+32);}); ob.observe(clPrevRef.current); return()=>ob.disconnect();
  },[unlocked,tplId,cl,effectiveAccent]);

  const handleUnlock=()=>{ if(pw==="GradCV2026"){setUnlocked(true);setPwErr(false);}else{setPwErr(true);setPw("");} };

  // Auto-fill CL sender from resume data
  const handleAutoFill=()=>setCl(p=>({...p,
    senderName: data.name||p.senderName,
    senderEmail: data.contact?.email||p.senderEmail,
    senderPhone: data.contact?.phone||p.senderPhone,
    senderLocation: data.contact?.location||p.senderLocation,
    senderLinkedin: data.contact?.linkedin||p.senderLinkedin,
    senderTitle: data.education?.[0] ? `${data.education[0].major||data.education[0].degree} Student` : (p.senderTitle||""),
  }));

  const handlePDF=()=>{ setExporting("pdf"); try{exportPDF(printRef.current,data.name);}catch(e){alert("PDF export failed.");}finally{setTimeout(()=>setExporting(null),500);} };
  const handleWord=()=>{ setExporting("word"); try{exportWord(data,effectiveAccent);}catch(e){alert("Word export failed.");}finally{setTimeout(()=>setExporting(null),400);} };
  const handleCLPDF=()=>{
    if(!clPrintRef.current)return;
    const fonts="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap";
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cover Letter</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}"><style>@page{size:letter;margin:0}html,body{margin:0;padding:0;background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body>${clPrintRef.current.innerHTML}<script>(function(){if(document.fonts&&document.fonts.ready){document.fonts.ready.then(function(){setTimeout(function(){window.focus();window.print();},200);})}else{setTimeout(function(){window.focus();window.print();},800);}})()</script></body></html>`;
    const w=window.open("","_blank","width=900,height=1100");
    if(!w){alert("Please allow pop-ups to print.");return;}
    w.document.open();w.document.write(html);w.document.close();
  };
  const handleCLWord=()=>{ setExporting("clword"); try{exportCLWord(cl,effectiveAccent);}catch(e){alert("Word export failed.");}finally{setTimeout(()=>setExporting(null),400);} };

  // Shared template + accent picker strip
  const TemplatePicker = () => (
    <div className="bg-white border-b border-violet-50 px-4 pt-4 pb-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Template</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 font-medium">Accent</span>
          <label className="relative w-6 h-6 rounded-full overflow-hidden border-2 border-white shadow cursor-pointer" style={{ background:effectiveAccent }}>
            <input type="color" value={effectiveAccent} onChange={e=>setAccentOverride(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
          </label>
          <div className="flex gap-1">
            {ACCENT_PRESETS.map(c=>{
              const active=effectiveAccent.toLowerCase()===c.toLowerCase();
              return <button key={c} onClick={()=>setAccentOverride(c)} title={c} className={`w-4 h-4 rounded-full border transition-transform hover:scale-110 ${active?"border-gray-800 ring-1 ring-gray-800 ring-offset-1":"border-gray-200"}`} style={{ background:c }}/>;
            })}
          </div>
          {accentOverride&&<button onClick={()=>setAccentOverride(null)} className="text-[10px] text-violet-500 hover:text-violet-700 underline font-medium">Reset</button>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {TEMPLATES.map(t=><TemplateCard key={t.id} tpl={t} selected={tplId===t.id} onClick={()=>{ setTplId(t.id); setAccentOverride(null); }}/>)}
      </div>
    </div>
  );

  /* ── PASSWORD GATE ── */
  if(!unlocked) return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ background:"linear-gradient(135deg, #F0EDFF 0%, #E8F4FD 100%)" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'); * { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; box-sizing: border-box; }`}</style>
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5 shadow-lg shadow-violet-200" style={{ background:"linear-gradient(135deg,#6C47FF,#06B6D4)" }}>
            <Lock className="w-6 h-6 text-white"/>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>GradCV</h1>
          <p className="text-sm text-gray-400">Student Resume + Cover Letter Builder</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <input type="password" value={pw} onChange={e=>{setPw(e.target.value);setPwErr(false);}} onKeyDown={e=>e.key==="Enter"&&handleUnlock()} autoFocus placeholder="Enter password"
              className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all ${pwErr?"border-red-300 bg-red-50":"border-gray-200 bg-gray-50 focus:border-violet-400"}`}/>
            {pwErr&&<p className="text-xs text-red-500 mt-2">Incorrect password — please try again.</p>}
          </div>
          <div className="px-5 py-3 bg-gray-50 flex justify-end">
            <button onClick={handleUnlock} className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm shadow-violet-200" style={{ background:"linear-gradient(135deg,#6C47FF,#7C5CFF)" }}>Unlock →</button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── MAIN EDITOR ── */
  return (
    <div className="min-h-screen w-full" style={{ background:"#F4F2FF" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&family=Playfair+Display:wght@400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap'); *, *::before, *::after{box-sizing:border-box;} .scroll-thin::-webkit-scrollbar{width:6px;} .scroll-thin::-webkit-scrollbar-track{background:transparent;} .scroll-thin::-webkit-scrollbar-thumb{background:rgba(108,71,255,0.15);border-radius:3px;} .pdf-offscreen{position:absolute;left:-99999px;top:0;width:8.5in;pointer-events:none;}`}</style>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-violet-100/60 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shadow-violet-200" style={{ background:"linear-gradient(135deg,#6C47FF,#06B6D4)" }}>
            <span className="text-white font-bold text-xs">G</span>
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-none" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>GradCV</div>
            <div className="text-[10px] text-violet-400 font-medium tracking-wide">Resume + Cover Letter Bundle</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>{setData(SAMPLE);setCl(SAMPLE_CL);setTplId("gradient-fresh");setAccentOverride(null);}} className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors font-medium">
            <RotateCcw className="w-3.5 h-3.5"/>Sample
          </button>
          <button onClick={()=>{setData(EMPTY);setCl(EMPTY_CL);}} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors font-medium">
            <X className="w-3 h-3"/>Clear
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] min-h-[calc(100vh-49px)]">

        {/* LEFT — resume + cover letter form */}
        <aside className="bg-white border-r border-violet-50 lg:h-[calc(100vh-49px)] lg:overflow-y-auto scroll-thin">
          <div className="p-5">
            <h2 className="font-bold text-gray-900 text-base mb-1" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Resume</h2>
            <p className="text-xs text-gray-400 mb-5 leading-relaxed">Fill in your details — the preview updates live.</p>
            <ResumeForm data={data} setData={setData}/>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background:"linear-gradient(to right, transparent, #E9E4FF)" }}/>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100">
                <FileEdit className="w-3 h-3 text-violet-400"/>
                <span className="text-[11px] font-semibold text-violet-500 uppercase tracking-wider">Cover Letter</span>
              </div>
              <div className="flex-1 h-px" style={{ background:"linear-gradient(to left, transparent, #E9E4FF)" }}/>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">Your cover letter automatically matches your chosen template and accent colour.</p>
            <CoverLetterForm cl={cl} setCl={setCl} onAutoFill={handleAutoFill}/>
          </div>
        </aside>

        {/* RIGHT — tabs + preview */}
        <main className="lg:h-[calc(100vh-49px)] flex flex-col overflow-hidden">

          {/* Tab bar */}
          <div className="bg-white border-b border-violet-50 px-4 flex items-end gap-0 pt-0">
            <button onClick={()=>setRightPanel("resume")} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${rightPanel==="resume"?"border-violet-500 text-violet-700":"border-transparent text-gray-400 hover:text-gray-700"}`}>Resume</button>
            <button onClick={()=>setRightPanel("coverletter")} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${rightPanel==="coverletter"?"border-violet-500 text-violet-700":"border-transparent text-gray-400 hover:text-gray-700"}`}>
              <FileEdit className="w-3 h-3"/>Cover Letter
            </button>
          </div>

          {/* ── RESUME TAB ── */}
          {rightPanel==="resume"&&<>
            <TemplatePicker/>
            <div ref={wrapRef} className="flex-1 overflow-auto scroll-thin p-4 md:p-8" style={{ background:"#EAE7FF" }}>
              <div style={{ width:`${8.5*scale}in`, minHeight:`${previewH*scale}px`, margin:"0 auto", paddingBottom:"2rem" }}>
                <div style={{ transform:`scale(${scale})`, transformOrigin:"top left", width:"8.5in" }}>
                  <div ref={previewRef}><ResumePreview templateId={tplId} data={data} accent={effectiveAccent}/></div>
                </div>
              </div>
            </div>
            <div className="border-t border-violet-100 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">Template</div>
                <div className="text-sm font-bold text-gray-800" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{tpl.label}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleWord} disabled={exporting!==null} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition-all">
                  {exporting==="word"?<Loader2 className="w-4 h-4 animate-spin"/>:<FileText className="w-4 h-4"/>}Word
                </button>
                <button onClick={handlePDF} disabled={exporting!==null} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300" style={{ background:"linear-gradient(135deg,#6C47FF,#7C5CFF)" }}>
                  {exporting==="pdf"?<Loader2 className="w-4 h-4 animate-spin"/>:<Download className="w-4 h-4"/>}Download PDF
                </button>
              </div>
            </div>
          </>}

          {/* ── COVER LETTER TAB ── */}
          {rightPanel==="coverletter"&&<>
            <TemplatePicker/>
            <div ref={clWrapRef} className="flex-1 overflow-auto scroll-thin p-4 md:p-8" style={{ background:"#EAE7FF" }}>
              <div style={{ width:`${8.5*clScale}in`, minHeight:`${clH*clScale}px`, margin:"0 auto", paddingBottom:"2rem" }}>
                <div style={{ transform:`scale(${clScale})`, transformOrigin:"top left", width:"8.5in" }}>
                  <div ref={clPrevRef}><CoverLetterPreview templateId={tplId} cl={cl} accent={effectiveAccent}/></div>
                </div>
              </div>
            </div>
            <div className="border-t border-violet-100 bg-white px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">Matching</div>
                <div className="text-sm font-bold text-gray-800" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{tpl.label} · Cover Letter</div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCLWord} disabled={exporting!==null} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 disabled:opacity-40 transition-all">
                  {exporting==="clword"?<Loader2 className="w-4 h-4 animate-spin"/>:<FileText className="w-4 h-4"/>}Word
                </button>
                <button onClick={handleCLPDF} disabled={exporting!==null} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-all shadow-md shadow-violet-200 hover:shadow-lg hover:shadow-violet-300" style={{ background:"linear-gradient(135deg,#6C47FF,#7C5CFF)" }}>
                  {exporting==="clpdf"?<Loader2 className="w-4 h-4 animate-spin"/>:<Download className="w-4 h-4"/>}Download PDF
                </button>
              </div>
            </div>
          </>}

        </main>
      </div>

      {/* Off-screen print areas */}
      <div ref={printRef} className="pdf-offscreen" aria-hidden="true">
        <ResumePreview templateId={tplId} data={data} accent={effectiveAccent}/>
      </div>
      <div ref={clPrintRef} className="pdf-offscreen" aria-hidden="true">
        <CoverLetterPreview templateId={tplId} cl={cl} accent={effectiveAccent}/>
      </div>
    </div>
  );
}
