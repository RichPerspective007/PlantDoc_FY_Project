import { LANGUAGES } from "../data/LangTrans";
import { useState, useRef, useEffect } from "react";

export function CommPg({t,lang,back,onLang}){
  const [tab,setTab]=useState("chat");
  const [msgs,setMsgs]=useState(t.communityMessages);
  const [inp,setInp]=useState("");const endRef=useRef();
  const c=LANGUAGES.find(l=>l.code===lang);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"})},[msgs]);
  const send=()=>{const m=inp.trim();if(!m)return;setInp("");setMsgs(p=>[...p,{user:"You",text:m,time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),avatar:"Y",mine:true}])};
  const groups=[{name:t.groupName,count:"1,247",icon:"🌾"},{name:"Organic Farming",count:"834",icon:"🌱"},{name:"Pest Control",count:"562",icon:"🐛"}];
  return(
    <div className="shell">
      <div className="shell-head">
        <button className="ghost" onClick={back}>{t.back}</button>
        <span className="shell-title">👥 {t.communityTitle}</span>
        <button className="chip" onClick={onLang}>{c?.flag} {c?.native}</button>
      </div>
      <div className="comm-wrap">
        <div className="comm-side">
          <div className="cs-sec">Groups</div>
          {groups.map((g,i)=>(
            <div key={i} className={`gr${tab==="chat"&&i===0?" act":""}`} onClick={()=>setTab("chat")}>
              <div className="g-av">{g.icon}</div>
              <div><div className="g-n">{g.name}</div><div className="g-c">{g.count} {t.groupMembers}</div></div>
            </div>
          ))}
          <div className={`prof-row${tab==="profile"?" act":""}`} onClick={()=>setTab("profile")}>
            <div className="pr-av">R</div>
            <div><div className="pr-n">Ramesh K.</div><div className="pr-t">{t.profile}</div></div>
          </div>
        </div>
        <div className="comm-main">
          {tab==="chat"?(
            <div className="comm-chat">
              <div className="cc-head">
                <div className="g-av" style={{background:"var(--forest)"}}>🌾</div>
                <div><div className="cc-name">{t.groupName}</div><div className="cc-status">● {t.online} · 1,247 {t.groupMembers}</div></div>
              </div>
              <div className="comm-msgs">
                {msgs.map((m,i)=>(
                  <div key={i} className={`mr${m.mine?" mine":""}`}>
                    {!m.mine&&<div className="m-av">{m.avatar}</div>}
                    <div className="m-body">
                      {!m.mine&&<div className="m-u">{m.user}</div>}
                      <div className="m-t">{m.text}</div>
                      <div className="m-time">{m.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={endRef}/>
              </div>
              <div className="comm-bar">
                <input className="comm-in" placeholder={t.typeMessage} value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}/>
                <button className="comm-send" onClick={send}>↑</button>
              </div>
            </div>
          ):(
            <div className="prof-panel">
              <div className="ph">
                <div className="p-big-av">R</div>
                <div><div className="p-name">Ramesh Kumar</div><div className="p-sub">Farmer · Joined Jan 2024</div></div>
                <button className="edit-btn">{t.editProfile}</button>
              </div>
              <div className="p-stats">
                <div className="ps"><div className="ps-n">48</div><div className="ps-l">{t.myPosts}</div></div>
                <div className="ps"><div className="ps-n">3</div><div className="ps-l">{t.joinedGroups}</div></div>
                <div className="ps"><div className="ps-n">124</div><div className="ps-l">Replies</div></div>
              </div>
              <div className="p-info">
                <div className="pi"><div className="pi-ico">📍</div><div><div className="pi-l">{t.location}</div><div className="pi-v">Howrah, West Bengal</div></div></div>
                <div className="pi"><div className="pi-ico">🌾</div><div><div className="pi-l">{t.cropType}</div><div className="pi-v">Tomato, Potato, Rice</div></div></div>
                <div className="pi"><div className="pi-ico">📅</div><div><div className="pi-l">{t.memberSince}</div><div className="pi-v">January 2024</div></div></div>
              </div>
              <div>
                <div className="p-sec">{t.myPosts}</div>
                {[
                  {text:"Has anyone tried neem oil for powdery mildew on cucumbers? Got great results last week!",time:"2 days ago"},
                  {text:"My rice crop looks pale — could be iron deficiency. Will test the soil tomorrow.",time:"5 days ago"},
                  {text:"Early blight on my tomatoes again this season. Going with copper fungicide as advised.",time:"1 week ago"},
                ].map((p,i)=>(
                  <div key={i} className="post-card">{p.text}<div className="post-time">{p.time}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}