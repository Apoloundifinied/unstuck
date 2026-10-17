/* Meaningful, nonessential interactions. Static UI remains functional without this script. */
(() => {
  'use strict';
  const scenarios = {
    fix: {title:"My leads aren't syncing.",text:'New form submissions reach n8n but fail before entering HubSpot.',type:'Troubleshooting',stack:'n8n · HubSpot',nodes:['Lead form','Webhook','HubSpot'],skill:'Webhooks & CRM integrations',keywords:'HubSpot · HTTP requests · retries',caption:'A failed step makes the required specialty clearer.'},
    build: {title:'I need a working lead pipeline.',text:'Route incoming leads, validate contacts, update a CRM, and notify the sales team.',type:'Custom build',stack:'n8n · Forms · Slack',nodes:['New lead','Validation','Sales'],skill:'Business workflow architecture',keywords:'Lead routing · validation · notifications',caption:'A clearly scoped outcome helps buyers find the right builder.'},
    connect: {title:'My tools do not talk to each other.',text:'When a payment succeeds, update the records and send an internal notification.',type:'Integration',stack:'n8n · Stripe · Sheets',nodes:['Stripe','n8n mapping','Sheets'],skill:'Payments & data integrations',keywords:'Stripe · Sheets · data mapping',caption:'Find a specialist by integrations, not a generic job title.'}
  };
  const buttons = document.querySelectorAll('[data-scenario]');
  function changeScenario(key){
    const s=scenarios[key];if(!s)return;
    const ids={'demo-title':s.title,'demo-text':s.text,'demo-type':s.type,'demo-stack':s.stack,'node-a':s.nodes[0],'node-b':s.nodes[1],'node-c':s.nodes[2],'demo-specialty':s.skill,'demo-keywords':s.keywords,'flow-caption-text':s.caption};
    for(const [id,value] of Object.entries(ids)){const el=document.getElementById(id);if(el)el.textContent=value;}
    buttons.forEach(b=>{let active=b.dataset.scenario===key;b.classList.toggle('is-selected',active);b.setAttribute('aria-pressed',String(active));});
  }
  buttons.forEach(b=>b.addEventListener('click',()=>changeScenario(b.dataset.scenario)));
  const visual=document.getElementById('visual-object');
  const holder=visual?.parentElement;
  if(!visual||!holder)return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
  let raf=0;
  holder.addEventListener('pointermove',e=>{
    if(reduced.matches||!fine.matches)return;
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      const r=holder.getBoundingClientRect(),x=((e.clientX-r.left)/r.width-.5)*5,y=(.5-(e.clientY-r.top)/r.height)*4;
      visual.style.transform=`perspective(900px) rotateY(${x}deg) rotateX(${y}deg)`;
    });
  });
  holder.addEventListener('pointerleave',()=>{cancelAnimationFrame(raf);visual.style.transform='';});
})();
