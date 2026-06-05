'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Doc = { id: number; title: string; description: string; hint: string; category: string; type: string }
type Status = { document_id: number; status: string; notes: string; updated_by: string; assigned_to: string }

const LETTERS = {
  dst: `Date: [DD Month 2026]\n\nTo,\nSh. Praveen Roy,\nScientist 'G' & Head,\nTechnology Translation & Innovation Division,\nDepartment of Science & Technology,\nTechnology Bhawan, New Mehrauli Road,\nNew Delhi - 110 016\n\nSubject: Application for PRAYAS Centre (PC) under NIDHI PRAYAS 2.0\n\nRespected Sir/Ma'am,\n\nWe, T-Works (Telangana State Technology Services Limited), India's largest prototyping centre, submit our application for establishment of a PRAYAS Centre (PC) under the NIDHI PRAYAS 2.0 Programme.\n\nT-Works is a Section 8 non-profit organisation promoted by the Government of Telangana under the ITE&C Department, operating a 78,000 sq.ft. hardware prototyping facility in Hyderabad with 25+ advanced labs.\n\nAll documents as per the prescribed checklist have been uploaded on the portal. We consent to the Terms & Conditions of the NIDHI PRAYAS 2.0 Programme.\n\nYours faithfully,\n\n[Name of CEO, T-Works]\nChief Executive Officer\nT-Works, Hyderabad\n[Phone] | [Email]`,
  pmu: `Date: [DD Month 2026]\n\nTo,\nNIDHI PRAYAS PMU,\nSociety for Innovation and Entrepreneurship (SINE),\n5th Floor, RBTIC Building, IIT Bombay,\nPowai, Mumbai - 400 076\nEmail: nidhiprayas@sineiitb.org\n\nSubject: Application for PRAYAS Centre (PC) - T-Works, Hyderabad\n\nDear PMU Team,\n\nPlease find our online application for PRAYAS Centre (PC) under NIDHI PRAYAS 2.0.\n\nOrganisation: T-Works (Telangana State Technology Services Limited)\nRegistration: Section 8 Company | Host: Govt. of Telangana, ITE&C Dept.\nAddress: Hyderabad, Telangana\nPortal Reference ID: [Portal-generated ID]\n\nWe confirm all 26 documents are uploaded and we consent to all Terms & Conditions.\n\nYours sincerely,\n\n[Name of CEO]\nChief Executive Officer, T-Works\n[Phone] | [Email]`,
  endorsement: `Date: [DD Month 2026]\n\nTo,\nSh. Praveen Roy,\nScientist 'G' & Head,\nTechnology Translation & Innovation Division,\nDepartment of Science & Technology,\nTechnology Bhawan, New Mehrauli Road,\nNew Delhi - 110 016\n\nSubject: Endorsement of T-Works Application for PRAYAS Centre under NIDHI PRAYAS 2.0\n\nRespected Sir/Ma'am,\n\nI, [Name], Secretary, ITE&C Department, Government of Telangana, formally endorse the application by T-Works for PRAYAS Centre (PC) under NIDHI PRAYAS 2.0.\n\nT-Works is a Section 8 non-profit promoted by Govt. of Telangana, operating India's largest prototyping centre (78,000 sq.ft., 25+ labs) in Hyderabad.\n\nWe commit to:\n1. Providing dedicated space (min. 3,000 sq.ft.) for the DST NIDHI Maker Bhavan\n2. Full access to T-Works labs for all PRAYAS innovators\n3. Institutional support for NIDHI PRAYAS 2.0 implementation\n\nYours faithfully,\n\n[Name]\nSecretary, ITE&C Department\nGovernment of Telangana\n[Official Stamp]`
}

export default function Home() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [statuses, setStatuses] = useState<Record<number, Status>>({})
  const [userName, setUserName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'checklist' | 'team' | 'letters' | 'admin'>('checklist')
  const [editDoc, setEditDoc] = useState<Doc | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newDoc, setNewDoc] = useState({ title: '', description: '', hint: '', category: 'Legal Identity', type: 'required' })
  const [letters, setLetters] = useState(LETTERS)
  const [editLetter, setEditLetter] = useState<'dst' | 'pmu' | 'endorsement' | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const cats = ['All', 'Legal Identity', 'Leadership', 'Recognition', 'Equipment', 'Infrastructure', 'Track Record', 'Pipeline', 'Financial', 'Letters']
  const catOpts = ['Legal Identity', 'Leadership', 'Recognition', 'Equipment', 'Infrastructure', 'Track Record', 'Pipeline', 'Financial', 'Letters']

  useEffect(() => {
    fetchData()
    const s = localStorage.getItem('prayas_username')
    if (s) { setUserName(s); setNameSet(true) }
    const l = localStorage.getItem('prayas_letters')
    if (l) setLetters(JSON.parse(l))
  }, [])

  async function fetchData() {
    const { data: d } = await supabase.from('documents').select('*').order('id')
    const { data: s } = await supabase.from('checklist_status').select('*')
    if (d) setDocs(d)
    if (s) {
      const map: Record<number, Status> = {}
      s.forEach((x: Status) => { map[x.document_id] = x })
      setStatuses(map)
    }
    setLoading(false)
  }

  async function toggle(id: number) {
    if (!nameSet) return alert('Enter your name first')
    const cur = statuses[id]?.status
    const next = cur === 'done' ? 'pending' : 'done'
    await supabase.from('checklist_status').upsert({ document_id: id, status: next, updated_by: userName, updated_at: new Date().toISOString() }, { onConflict: 'document_id' })
    setStatuses(p => ({ ...p, [id]: { ...p[id], document_id: id, status: next, updated_by: userName, notes: p[id]?.notes || '', assigned_to: p[id]?.assigned_to || '' } }))
  }

  async function saveNote(id: number, note: string) {
    await supabase.from('checklist_status').upsert({ document_id: id, notes: note, updated_by: userName, updated_at: new Date().toISOString(), status: statuses[id]?.status || 'pending' }, { onConflict: 'document_id' })
  }

  async function assignDoc(id: number, person: string) {
    await supabase.from('checklist_status').upsert({ document_id: id, assigned_to: person, updated_by: userName, updated_at: new Date().toISOString(), status: statuses[id]?.status || 'pending' }, { onConflict: 'document_id' })
    setStatuses(p => ({ ...p, [id]: { ...p[id], document_id: id, assigned_to: person, notes: p[id]?.notes || '', status: p[id]?.status || 'pending', updated_by: userName } }))
  }

  async function saveEditDoc() {
    if (!editDoc) return
    await supabase.from('documents').update({ title: editDoc.title, description: editDoc.description, hint: editDoc.hint, category: editDoc.category, type: editDoc.type }).eq('id', editDoc.id)
    setDocs(p => p.map(d => d.id === editDoc.id ? editDoc : d))
    setEditDoc(null)
  }

  async function deleteDoc(id: number) {
    if (!confirm('Delete this document?')) return
    await supabase.from('checklist_status').delete().eq('document_id', id)
    await supabase.from('documents').delete().eq('id', id)
    setDocs(p => p.filter(d => d.id !== id))
  }

  async function addDoc() {
    if (!newDoc.title.trim()) return alert('Title required')
    const maxId = docs.length > 0 ? Math.max(...docs.map(d => d.id)) : 0
    const { data } = await supabase.from('documents').insert({ ...newDoc, id: maxId + 1 }).select()
    if (data) { setDocs(p => [...p, data[0]]); setShowAdd(false); setNewDoc({ title: '', description: '', hint: '', category: 'Legal Identity', type: 'required' }) }
  }

  function saveLetter(key: 'dst' | 'pmu' | 'endorsement', val: string) {
    const u = { ...letters, [key]: val }
    setLetters(u)
    localStorage.setItem('prayas_letters', JSON.stringify(u))
    setEditLetter(null)
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  // Team dashboard data
  const teamMembers = [...new Set(Object.values(statuses).map(s => s.updated_by).filter(Boolean))]
  const allAssigned = [...new Set(Object.values(statuses).map(s => s.assigned_to).filter(Boolean))]
  const allPeople = [...new Set([...teamMembers, ...allAssigned])]

  function getMemberStats(name: string) {
    const assigned = docs.filter(d => statuses[d.id]?.assigned_to === name)
    const done = assigned.filter(d => statuses[d.id]?.status === 'done')
    const updatedDocs = docs.filter(d => statuses[d.id]?.updated_by === name)
    return { assigned, done, updatedDocs }
  }

  const filtered = filter === 'All' ? docs : docs.filter(d => d.category === filter)
  const doneCount = Object.values(statuses).filter(s => s.status === 'done').length
  const inp: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, marginBottom: 8 }
  const btn = (c: string): React.CSSProperties => ({ padding: '6px 14px', borderRadius: 6, border: 'none', background: c, color: '#fff', fontSize: 12, cursor: 'pointer', marginRight: 6 })

  if (!nameSet) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>T-Works PRAYAS Checklist</h1>
        <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>Enter your name to track progress as a team</p>
        <input placeholder="Your name (e.g. Mugdha)" value={userName}
          onChange={e => setUserName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && userName.trim()) { localStorage.setItem('prayas_username', userName); setNameSet(true) } }}
          style={{ ...inp, marginBottom: 12, fontSize: 15, padding: '10px 14px' }} />
        <button onClick={() => { if (userName.trim()) { localStorage.setItem('prayas_username', userName); setNameSet(true) } }}
          style={{ width: '100%', padding: '11px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, cursor: 'pointer', fontWeight: 500 }}>
          Start →
        </button>
      </div>
    </div>
  )

  return (
    <main style={{ maxWidth: 780, margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* Header */}
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>NIDHI PRAYAS 2.0 — T-Works</h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 3 }}>
          👤 <strong>{userName}</strong> &nbsp;·&nbsp;
          <span style={{ color: '#185FA5', cursor: 'pointer' }} onClick={() => { localStorage.removeItem('prayas_username'); setNameSet(false); setUserName('') }}>switch user</span>
          &nbsp;·&nbsp; Deadline: <strong style={{ color: '#E24B4A' }}>19 Jun 2026</strong>
        </p>
        <div style={{ margin: '10px 0 4px', background: '#f0f0f0', borderRadius: 20, height: 8, overflow: 'hidden' }}>
          <div style={{ height: 8, background: doneCount === docs.length && docs.length > 0 ? '#0F6E56' : '#185FA5', borderRadius: 20, width: `${Math.round(doneCount / Math.max(docs.length, 1) * 100)}%`, transition: 'width .4s' }} />
        </div>
        <p style={{ fontSize: 12, color: '#666' }}>{doneCount} of {docs.length} documents ready · {Math.round(doneCount / Math.max(docs.length, 1) * 100)}% complete</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
        {[
          { key: 'checklist', label: '📋 Checklist' },
          { key: 'team', label: '👥 Team' },
          { key: 'letters', label: '✉️ Letters' },
          { key: 'admin', label: '⚙️ Admin' }
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid', borderColor: tab === key ? '#185FA5' : '#ddd', background: tab === key ? '#185FA5' : 'white', color: tab === key ? 'white' : '#555', fontSize: 13, cursor: 'pointer', fontWeight: tab === key ? 500 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {/* CHECKLIST */}
      {tab === 'checklist' && (
        <>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                style={{ padding: '4px 10px', borderRadius: 20, border: '1px solid', borderColor: filter === c ? '#185FA5' : '#ddd', background: filter === c ? '#185FA5' : 'white', color: filter === c ? 'white' : '#555', fontSize: 11, cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>
          {loading ? <p style={{ color: '#999', fontSize: 14 }}>Loading...</p> : filtered.map(doc => {
            const s = statuses[doc.id]
            const done = s?.status === 'done'
            return (
              <div key={doc.id} style={{ border: '1px solid', borderColor: done ? '#B5D4F4' : '#e8e8e8', borderRadius: 10, marginBottom: 7, background: done ? '#f5f9fe' : 'white', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 13px' }}>
                  <div onClick={() => toggle(doc.id)} style={{ width: 20, height: 20, minWidth: 20, borderRadius: 10, border: '2px solid', borderColor: done ? '#185FA5' : '#ccc', background: done ? '#185FA5' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, cursor: 'pointer' }}>
                    {done && <span style={{ color: 'white', fontSize: 11 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: done ? '#185FA5' : '#111' }}>
                      {doc.id}. {doc.title}
                      <span style={{ marginLeft: 7, fontSize: 10, padding: '2px 6px', borderRadius: 8, background: doc.type === 'required' ? '#FCEBEB' : doc.type === 'conditional' ? '#F1EFE8' : '#EAF3DE', color: doc.type === 'required' ? '#A32D2D' : doc.type === 'conditional' ? '#5F5E5A' : '#3B6D11', fontWeight: 500 }}>
                        {doc.type}
                      </span>
                      {s?.assigned_to && <span style={{ marginLeft: 7, fontSize: 10, padding: '2px 6px', borderRadius: 8, background: '#FEF3C7', color: '#92400E' }}>👤 {s.assigned_to}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{doc.description}</div>
                    <div style={{ fontSize: 10, color: '#999', marginTop: 1 }}>{doc.hint}</div>
                    {s?.updated_by && <div style={{ fontSize: 10, color: '#185FA5', marginTop: 3 }}>Last updated by {s.updated_by}</div>}
                  </div>
                </div>
                <div style={{ padding: '0 13px 10px 43px', display: 'flex', gap: 8 }}>
                  <input placeholder="Add a note..." defaultValue={s?.notes || ''}
                    onBlur={e => saveNote(doc.id, e.target.value)}
                    style={{ flex: 1, padding: '5px 9px', border: '1px solid #e8e8e8', borderRadius: 6, fontSize: 11, color: '#333', background: '#fafafa' }} />
                  <input placeholder="Assign to..." defaultValue={s?.assigned_to || ''}
                    onBlur={e => assignDoc(doc.id, e.target.value)}
                    style={{ width: 120, padding: '5px 9px', border: '1px solid #e8e8e8', borderRadius: 6, fontSize: 11, color: '#333', background: '#fafafa' }} />
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* TEAM DASHBOARD */}
      {tab === 'team' && (
        <div>
          {/* Overall stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Total Documents', val: docs.length, color: '#185FA5' },
              { label: 'Completed', val: doneCount, color: '#0F6E56' },
              { label: 'Pending', val: docs.length - doneCount, color: '#E24B4A' },
              { label: 'Team Members', val: allPeople.length, color: '#7C3AED' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: '#fafafa', border: '1px solid #eee', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 600, color }}>{val}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          {allPeople.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#999' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <p style={{ fontSize: 14 }}>No team members yet.</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Go to Checklist tab → type a name in the "Assign to..." box on any document.</p>
            </div>
          ) : (
            allPeople.map(person => {
              const { assigned, done, updatedDocs } = getMemberStats(person)
              const pct = assigned.length > 0 ? Math.round(done.length / assigned.length * 100) : 0
              return (
                <div key={person} style={{ border: '1px solid #e8e8e8', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', background: '#f8f9fa', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 18, background: '#185FA5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600 }}>
                        {person.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{person}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>{assigned.length} assigned · {done.length} done · {updatedDocs.length} updated</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 600, color: pct === 100 ? '#0F6E56' : '#185FA5' }}>{pct}%</div>
                      <div style={{ fontSize: 10, color: '#999' }}>complete</div>
                    </div>
                  </div>
                  {assigned.length > 0 && (
                    <div style={{ padding: '10px 16px' }}>
                      <div style={{ background: '#f0f0f0', borderRadius: 10, height: 5, marginBottom: 10, overflow: 'hidden' }}>
                        <div style={{ height: 5, background: pct === 100 ? '#0F6E56' : '#185FA5', borderRadius: 10, width: `${pct}%`, transition: 'width .3s' }} />
                      </div>
                      {assigned.map(doc => {
                        const s = statuses[doc.id]
                        const isDone = s?.status === 'done'
                        return (
                          <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid #f5f5f5' }}>
                            <div style={{ width: 16, height: 16, minWidth: 16, borderRadius: 8, border: '2px solid', borderColor: isDone ? '#185FA5' : '#ccc', background: isDone ? '#185FA5' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {isDone && <span style={{ color: 'white', fontSize: 9 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 12, color: isDone ? '#185FA5' : '#333', flex: 1 }}>{doc.id}. {doc.title}</span>
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: doc.type === 'required' ? '#FCEBEB' : '#EAF3DE', color: doc.type === 'required' ? '#A32D2D' : '#3B6D11' }}>{doc.type}</span>
                            {s?.notes && <span style={{ fontSize: 10, color: '#999', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📝 {s.notes}</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* LETTERS */}
      {tab === 'letters' && (
        <div>
          {[
            { key: 'dst' as const, title: 'Letter 23 — Covering letter to DST', to: 'From: T-Works CEO → Sh. Praveen Roy, DST New Delhi' },
            { key: 'pmu' as const, title: 'Letter 24 — Covering letter to PMU', to: 'From: T-Works CEO → SINE IIT Bombay' },
            { key: 'endorsement' as const, title: 'Letter 25 — Endorsement letter', to: 'From: Secretary ITE&C, Govt. of Telangana → DST' }
          ].map(({ key, title, to }) => (
            <div key={key} style={{ border: '1px solid #e8e8e8', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
              <div style={{ padding: '11px 15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{to}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditLetter(editLetter === key ? null : key)} style={btn('#185FA5')}>{editLetter === key ? 'Cancel' : '✏️ Edit'}</button>
                  <button onClick={() => copyText(key, letters[key])} style={btn(copied === key ? '#0F6E56' : '#555')}>{copied === key ? '✓ Copied' : '📋 Copy'}</button>
                </div>
              </div>
              {editLetter === key ? (
                <div style={{ padding: 14 }}>
                  <textarea defaultValue={letters[key]} id={`l-${key}`}
                    style={{ width: '100%', minHeight: 320, padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.7, resize: 'vertical' }} />
                  <button onClick={() => { const el = document.getElementById(`l-${key}`) as HTMLTextAreaElement; saveLetter(key, el.value) }} style={{ ...btn('#185FA5'), marginTop: 8 }}>Save Letter</button>
                </div>
              ) : (
                <pre style={{ padding: 14, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#333', background: '#fafafa', margin: 0 }}>{letters[key]}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADMIN */}
      {tab === 'admin' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 500 }}>Manage Documents</h2>
            <button onClick={() => setShowAdd(!showAdd)} style={btn('#185FA5')}>{showAdd ? 'Cancel' : '+ Add Document'}</button>
          </div>
          {showAdd && (
            <div style={{ border: '1px solid #B5D4F4', borderRadius: 10, padding: 14, marginBottom: 14, background: '#f5f9fe' }}>
              <input placeholder="Title *" value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} style={inp} />
              <input placeholder="Description" value={newDoc.description} onChange={e => setNewDoc({ ...newDoc, description: e.target.value })} style={inp} />
              <input placeholder="Hint / where to get it" value={newDoc.hint} onChange={e => setNewDoc({ ...newDoc, hint: e.target.value })} style={inp} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={newDoc.category} onChange={e => setNewDoc({ ...newDoc, category: e.target.value })} style={{ flex: 1, padding: '7px 9px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }}>
                  {catOpts.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={newDoc.type} onChange={e => setNewDoc({ ...newDoc, type: e.target.value })} style={{ flex: 1, padding: '7px 9px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }}>
                  <option value="required">required</option>
                  <option value="template">template</option>
                  <option value="conditional">conditional</option>
                </select>
              </div>
              <button onClick={addDoc} style={btn('#185FA5')}>Add Document</button>
            </div>
          )}
          {docs.map(doc => (
            <div key={doc.id} style={{ border: '1px solid #e8e8e8', borderRadius: 9, marginBottom: 7, overflow: 'hidden' }}>
              {editDoc?.id === doc.id ? (
                <div style={{ padding: 12 }}>
                  <input value={editDoc.title} onChange={e => setEditDoc({ ...editDoc, title: e.target.value })} style={inp} placeholder="Title" />
                  <input value={editDoc.description} onChange={e => setEditDoc({ ...editDoc, description: e.target.value })} style={inp} placeholder="Description" />
                  <input value={editDoc.hint} onChange={e => setEditDoc({ ...editDoc, hint: e.target.value })} style={inp} placeholder="Hint" />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select value={editDoc.category} onChange={e => setEditDoc({ ...editDoc, category: e.target.value })} style={{ flex: 1, padding: '7px 9px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }}>
                      {catOpts.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select value={editDoc.type} onChange={e => setEditDoc({ ...editDoc, type: e.target.value })} style={{ flex: 1, padding: '7px 9px', border: '1px solid #ddd', borderRadius: 6, fontSize: 12 }}>
                      <option value="required">required</option>
                      <option value="template">template</option>
                      <option value="conditional">conditional</option>
                    </select>
                  </div>
                  <button onClick={saveEditDoc} style={btn('#185FA5')}>Save</button>
                  <button onClick={() => setEditDoc(null)} style={btn('#888')}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 13px', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{doc.id}. {doc.title}</span>
                    <span style={{ marginLeft: 7, fontSize: 10, padding: '2px 6px', borderRadius: 8, background: doc.type === 'required' ? '#FCEBEB' : doc.type === 'conditional' ? '#F1EFE8' : '#EAF3DE', color: doc.type === 'required' ? '#A32D2D' : doc.type === 'conditional' ? '#5F5E5A' : '#3B6D11' }}>{doc.type}</span>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{doc.category}</div>
                  </div>
                  <div>
                    <button onClick={() => setEditDoc(doc)} style={btn('#185FA5')}>Edit</button>
                    <button onClick={() => deleteDoc(doc.id)} style={btn('#E24B4A')}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}