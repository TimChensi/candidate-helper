/* Локальный помощник: поиск города и расстояния по прямой. Без внешних запросов. */
(function(){
"use strict";
const data=window.CANDIDATE_GEO_DATA;
const input=document.getElementById("residenceCity");
const select=document.getElementById("processingCity");
const suggestions=document.getElementById("geoCitySuggestions");
const details=document.getElementById("geoNearestDetails");
const results=document.getElementById("geoNearestList");
const note=document.getElementById("geoNearestNote");
if(!data||!input||!select||!suggestions||!details||!results||!note)return;

function norm(value){
 return String(value||"").toLowerCase().normalize("NFKC")
  .replace(/ё/g,"е").replace(/[‐‑‒–—-]/g," ")
  .replace(/[.,;:()]/g," ").replace(/\s+/g," ").trim()
  .replace(/^(г|город)\s+/,"");
}
const aliases={
 "Санкт-Петербург":["спб","питер","петербург","ленинград","санкт петербург","с петербург"],
 "Москва":["мск","москва город"],
 "Екатеринбург":["екб","екат","свердловск"],
 "Нижний Новгород":["нн","нижний","горький"],
 "Ростов-на-Дону":["ростов","ростов на дону"],
 "Набережные Челны":["челны","наб челны","набежные челны"],
 "Уфа":["уфа город"],
 "Республика Татарстан":["татарстан","рт"],
 "Республика Башкортостан":["башкирия","башкортостан"],
 "Республика Саха (Якутия)":["якутия","саха"],
 "Республика Северная Осетия - Алания":["северная осетия","осетия"],
 "Ханты-Мансийский автономный округ - Югра":["хмао","югра","ханты мансийский округ"],
 "Ямало-Ненецкий автономный округ":["янао","ямало ненецкий округ"]
};
const normalizedAliases=new Map();
for(const [key,list] of Object.entries(aliases))normalizedAliases.set(norm(key),list.map(norm));
const niceNames=data.alternatives||{};
const places=data.cities.map((v,rank)=>{
 const preferred=niceNames[v[0]]&&norm(niceNames[v[0]])===norm(v[0])?niceNames[v[0]]:v[0];
 const extra=[...(normalizedAliases.get(norm(v[0]))||[])];
 if(niceNames[v[0]])extra.push(norm(niceNames[v[0]]));
 return {name:preferred,region:v[1],lat:v[2],lon:v[3],rank,kind:"city",aliases:[...new Set(extra)]};
});
const byRegion=new Map();
for(const p of places)if(!byRegion.has(p.region))byRegion.set(p.region,p);
const regions=data.regions.map(v=>{
 const anchor=byRegion.get(v[0]);
 if(!anchor)return null;
 const extra=[...(normalizedAliases.get(norm(v[0]))||[])];
 if(/^Республика /i.test(v[0]))extra.push(norm(v[0].replace(/^Республика /i,"")));
 if(/ская область$/.test(v[0]))extra.push(norm(v[0].replace(/ область$/,"")));
 return {name:v[0],region:v[0],lat:anchor.lat,lon:anchor.lon,anchor:anchor.name,rank:10000,kind:"region",aliases:[...new Set(extra)]};
}).filter(Boolean);
const items=places.concat(regions);
for(const p of items){
 p.searchName=norm(p.name);
 p.searchRegion=norm(p.region);
 p.aliases=p.aliases||[];
 p.matchTexts=[p.searchName,...p.aliases];
}
let selected=null,suggested=[],selectedIndex=-1;
const inputParent=input.closest(".geo-field-entry");
function dismiss(){
 suggestions.hidden=true;
 suggestions.replaceChildren();
 suggested=[];selectedIndex=-1;
 input.setAttribute("aria-expanded","false");
}
function levenshtein(a,b,cap){
 if(Math.abs(a.length-b.length)>cap)return cap+1;
 let prev=Array.from({length:b.length+1},(_,i)=>i);
 for(let i=1;i<=a.length;i++){
  const curr=[i];
  let rowMin=i;
  for(let j=1;j<=b.length;j++){
   const cost=a[i-1]===b[j-1]?0:1;
   const value=Math.min(curr[j-1]+1,prev[j]+1,prev[j-1]+cost);
   curr.push(value);rowMin=Math.min(rowMin,value);
  }
  if(rowMin>cap)return cap+1;
  prev=curr;
 }
 return prev[b.length];
}
function rankPlace(p,q,allowFuzzy){
 let best=999;
 for(const v of p.matchTexts){
  if(v===q)best=Math.min(best,v===p.searchName?0:0.25);
  else if(v.startsWith(q))best=Math.min(best,1);
  else if(v.split(" ").some(w=>w.startsWith(q)))best=Math.min(best,2);
  else if(v.includes(q))best=Math.min(best,3);
 }
 if(best<999)return best;
 if(allowFuzzy){
  const cap=q.length>=6?2:1;
  for(const v of p.matchTexts){
   if(levenshtein(v,q,cap)<=cap)best=Math.min(best,6);
   if(levenshtein(v.split(" ")[0],q,cap)<=cap)best=Math.min(best,7);
  }
 }
 return best;
}
function findSuggestions(inputValue){
 const q=norm(inputValue);
 if(q.length<2)return[];
 let found=items.map(p=>({p,score:rankPlace(p,q,false)})).filter(x=>x.score<999);
 if(found.length<4&&q.length>=4){
  const existing=new Set(found.map(x=>x.p));
  for(const p of items){
   if(existing.has(p))continue;
   const score=rankPlace(p,q,true);
   if(score<999)found.push({p,score});
  }
 }
 found.sort((a,b)=>a.score-b.score||(a.p.kind==="city"?0:1)-(b.p.kind==="city"?0:1)||a.p.rank-b.p.rank);
 return found.slice(0,6).map(x=>x.p);
}
function optionText(p){
 return p.kind==="region"?"Регион, ориентир: "+p.anchor:p.region;
}
function choosePlace(p){
 selected=p;
 const duplicates=places.filter(x=>x.searchName===p.searchName);
 input.value=p.kind==="city"&&duplicates.length>1?p.name+", "+p.region:p.name;
 dismiss();
 updateNearest();
 input.dispatchEvent(new Event("change",{bubbles:true}));
}
function renderSuggestions(){
 const value=input.value.trim();
 suggested=findSuggestions(value);
 selectedIndex=-1;
 suggestions.replaceChildren();
 if(!suggested.length||document.activeElement!==input){dismiss();return;}
 for(const [i,p] of suggested.entries()){
  const btn=document.createElement("button");
  btn.type="button";btn.className="geo-option";btn.setAttribute("role","option");btn.setAttribute("aria-selected","false");
  const top=document.createElement("span");top.className="geo-option-name";top.textContent=p.name;
  const sub=document.createElement("small");sub.textContent=optionText(p);
  btn.append(top,sub);
  btn.addEventListener("pointerdown",e=>{e.preventDefault();choosePlace(p)});
  btn.addEventListener("click",()=>choosePlace(p));
  suggestions.append(btn);
 }
 suggestions.hidden=false;
 input.setAttribute("aria-expanded","true");
}
function exactPlace(value){
 const typed=norm(value);
 if(!typed)return null;
 if(selected&&norm(input.value)===typed&&
   (typed===selected.searchName||
    (selected.kind==="city"&&typed===norm(selected.name+", "+selected.region))))return selected;
 const canonical=items.filter(p=>p.searchName===typed||p.kind==="city"&&norm(p.name+", "+p.region)===typed);
 if(canonical.length===1)return canonical[0];
 if(canonical.length>1)return null;
 const matches=items.filter(p=>p.aliases.includes(typed));
 return matches.length===1?matches[0]:null;
}
function haversine(a,b){
 const rad=Math.PI/180,dl=(b.lat-a.lat)*rad,do2=(b.lon-a.lon)*rad;
 const h=Math.sin(dl/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(do2/2)**2;
 return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));
}
function resolveDestination(text){
 const base=String(text||"").replace(/\s*\([^)]*\)\s*$/,"").trim();
 if(!base||base==="Не выбран")return null;
 if(norm(base)==="татарстан"){
  const kazan=places.find(p=>p.searchName===norm("Казань"));
  return kazan?{key:"Казань",place:kazan,isRegion:true,raw:text}:null;
 }
 const reg=regions.find(p=>p.searchName===norm(base));
 if(reg)return {key:base,place:reg,isRegion:true,raw:text};
 const p=places.find(item=>item.searchName===norm(base));
 return p?{key:base,place:p,isRegion:false,raw:text}:null;
}
function destinations(){
 const map=new Map();
 for(const option of select.options){
  if(!option.value)continue;
  const r=resolveDestination(option.textContent.trim());
  if(!r)continue;
  const key=norm(r.key);
  if(!map.has(key))map.set(key,{key,names:[],place:r.place,region:r.isRegion});
  const item=map.get(key);
  item.names.push(r.raw);item.region=item.region||r.isRegion;
 }
 return [...map.values()];
}
const endpoints=destinations();
function appendText(parent,tag,className,value){
 const el=document.createElement(tag);el.className=className;el.textContent=value;parent.append(el);return el;
}
function updateNearest(){
 results.replaceChildren();
 const raw=input.value.trim();
 const place=exactPlace(raw);
 if(!raw){
  appendText(results,"p","geo-note","Укажите город проживания, чтобы увидеть ближайшие направления.");
  note.textContent="Расстояния считаются по прямой, без прокладки маршрута.";
  return;
 }
 if(!place){
  appendText(results,"p","geo-note","Город не определён. Можно сохранить название вручную, но расчёт расстояний недоступен.");
  note.textContent="Для расчёта выберите подходящую подсказку или введите точное название города.";
  return;
 }
 const nearest=endpoints.map(e=>({...e,km:haversine(place,e.place)})).sort((a,b)=>a.km-b.km).slice(0,5);
 if(!nearest.length){
  appendText(results,"p","geo-note","Список городов оформления пока недоступен.");
  return;
 }
 const container=document.createElement("ol");
 container.className="geo-nearest-items";
 for(const [index,item] of nearest.entries()){
  const li=document.createElement("li"),line=document.createElement("div"),km=Math.round(item.km);
  li.className="geo-nearest-item";
  appendText(line,"strong","geo-nearest-name",(index+1)+". "+(item.names.length>1?
   (item.key==="казань"?"Казань / Татарстан":item.place.name+" ("+item.names.length+" направления)") :
   item.names[0]));
  appendText(line,"span","geo-nearest-km","~"+km.toLocaleString("ru-RU")+" км");
  li.append(line);
  const sub=item.region?"Ориентир: "+(item.place.anchor||item.place.name)+" (регион, приблизительно)":item.names.length>1?"Несколько вариантов оформления":"По прямой";
  appendText(li,"small","geo-nearest-sub",sub);
  container.append(li);
 }
 results.append(container);
 note.textContent=(place.kind==="region"?"Для региона «"+place.name+"» использован ориентир: "+place.anchor+". ":"")+
  "Расстояния по прямой, не по дорогам. Для регионов точка оформления может отличаться.";
}
input.addEventListener("input",()=>{
 selected=null;renderSuggestions();updateNearest();
});
input.addEventListener("focus",renderSuggestions);
input.addEventListener("blur",()=>setTimeout(dismiss,150));
input.addEventListener("keydown",e=>{
 if(suggestions.hidden||!suggested.length)return;
 if(e.key==="Escape"){dismiss();return;}
 if(e.key!=="ArrowDown"&&e.key!=="ArrowUp"&&e.key!=="Enter")return;
 if(e.key==="Enter"&&selectedIndex<0)return;
 e.preventDefault();
 if(e.key==="ArrowDown")selectedIndex=(selectedIndex+1)%suggested.length;
 if(e.key==="ArrowUp")selectedIndex=(selectedIndex-1+suggested.length)%suggested.length;
 if(e.key==="Enter"){choosePlace(suggested[selectedIndex]);return;}
 [...suggestions.children].forEach((c,i)=>{c.classList.toggle("geo-selected",i===selectedIndex);c.setAttribute("aria-selected",String(i===selectedIndex));});
});
document.addEventListener("pointerdown",e=>{if(inputParent&&!inputParent.contains(e.target))dismiss();});
input.form?.addEventListener("reset",()=>setTimeout(()=>{selected=null;dismiss();updateNearest()},0));
const editCard=document.getElementById("editCard");
if(editCard&&window.MutationObserver){
 new MutationObserver(()=>{selected=null;dismiss();updateNearest()}).observe(editCard,{attributes:true,attributeFilter:["class"]});
}
updateNearest();
})();