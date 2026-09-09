import {useEffect,useState} from 'react'
import type {ActiveSession} from './active-sessions'
export function ActiveSessionFooter({sessions,locale}:{sessions:readonly ActiveSession[];locale:string}) {
  const [index,setIndex]=useState(0)
  const identity=sessions.map(s=>s.id).join('\n')
  useEffect(()=>{
    setIndex(0)
    if(sessions.length<2) return
    const timer=setInterval(()=>setIndex(value=>(value+1)%sessions.length),6000)
    return ()=>clearInterval(timer)
  },[identity,sessions.length])
  const current=sessions[index%sessions.length]
  const zh=locale!=='en'
  return <span className="vpo-activeSessions" data-vehicle-pet-active-sessions={sessions.length}>
    {current ? <><span>{current.pending?(zh?'等待处理':'Needs input'):(zh?'进行中':'Running')}{sessions.length>1?` · ${sessions.length}`:''}</span><span title={current.title}>{current.title || (zh?'未命名会话':'Untitled session')}</span></> : <span>{zh?'暂无活跃会话':'No active sessions'}</span>}
  </span>
}
