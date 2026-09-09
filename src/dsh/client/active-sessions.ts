/** Display-only metadata projection. Never used by speech or progression. */
export interface ActiveSession { id: string; title: string; pending: boolean }
interface SessionListMetadata {
  ids?: readonly string[]
  current?: string | undefined
  byId: Record<string, {title?: string; displayTitle?: string; running?: boolean; pendingInteraction?: string} | undefined>
}
export function activeSessionsFromList(list: SessionListMetadata): ActiveSession[] {
  const rows: ActiveSession[]=[]
  for(const id of list.ids ?? Object.keys(list.byId)) {
    const row=list.byId[id]
    if(!row || !(row.running===true || Boolean(row.pendingInteraction))) continue
    // eslint-disable-next-line no-control-regex -- remove control and bidi formatting from host titles
    const candidate=(row.title || row.displayTitle || '').replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,' ').trim()
    const title=candidate===id || /^(?:\/|[A-Za-z]:\\)/.test(candidate) ? '' : Array.from(candidate).slice(0,80).join('')
    rows.push({id,title,pending:Boolean(row.pendingInteraction)})
  }
  return rows.sort((a,b)=>a.id===list.current?-1:b.id===list.current?1:a.id.localeCompare(b.id))
}
