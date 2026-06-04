'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Document = {
  id: number
  title: string
  description: string
  hint: string
  category: string
  type: string
}

type Status = {
  document_id: number
  status: string
  notes: string
  updated_by: string
}

const DEFAULT_LETTERS = {
  dst: `Date: [DD Month 2026]

To,
Sh. Praveen Roy,
Scientist 'G' & Head,
Technology Translation & Innovation Division,
Department of Science & Technology,
Technology Bhawan, New Mehrauli Road,
New Delhi - 110 016

Subject: Application for PRAYAS Centre (PC) under NIDHI PRAYAS 2.0

Respected Sir/Ma'am,

We, T-Works (Telangana State Technology Services Limited), India's largest prototyping centre, submit our application for establishment of a PRAYAS Centre (PC) under the NIDHI PRAYAS 2.0 Programme.

T-Works is a Section 8 non-profit organisation promoted by the Government of Telangana under the ITE&C Department, operating a 78,000 sq.ft. hardware prototyping facility in Hyderabad with 25+ advanced labs.

All documents as per the prescribed checklist have been uploaded on the portal. We consent to the Terms & Conditions of the NIDHI PRAYAS 2.0 Programme.

Yours faithfully,

[Name of CEO, T-Works]
Chief Executive Officer
T-Works, Hyderabad
[Phone] | [Email]`,

  pmu: `Date: [DD Month 2026]

To,
NIDHI PRAYAS PMU,
Society for Innovation and Entrepreneurship (SINE),
5th Floor, RBTIC Building, IIT Bombay,
Powai, Mumbai - 400 076
Email: nidhiprayas@sineiitb.org

Subject: Application for PRAYAS Centre (PC) - T-Works, Hyderabad

Dear PMU Team,

Please find our online application for PRAYAS Centre (PC) under NIDHI PRAYAS 2.0.

Organisation: T-Works (Telangana State Technology Services Limited)
Registration: Section 8 Company | Host: Govt. of Telangana, ITE&C Dept.
Address: Hyderabad, Telangana
Portal Reference ID: [Portal-generated ID]

We confirm all 26 documents are uploaded and we consent to all Terms & Conditions.

Yours sincerely,

[Name of CEO]
Chief Executive Officer, T-Works
[Phone] | [Email]`,

  endorsement: `Date: [DD Month 2026]

To,
Sh. Praveen Roy,
Scientist 'G' & Head,
Technology Translation & Innovation Division,
Department of Science & Technology,
Technology Bhawan, New Mehrauli Road,
New Delhi - 110 016

Subject: Endorsement of T-Works Application for PRAYAS Centre under NIDHI PRAYAS 2.0

Respected Sir/Ma'am,

I, [Name], Secretary, ITE&C Department, Government of Telangana, formally endorse the application by T-Works for PRAYAS Centre (PC) under NIDHI PRAYAS 2.0.

T-Works is a Section 8 non-profit promoted by Govt. of Telangana, operating India's largest prototyping centre (78,000 sq.ft., 25+ labs) in Hyderabad.

We commit to:
1. Providing dedicated space (min. 3,000 sq.ft.) for the DST NIDHI Maker Bhavan
2. Full access to T-Works labs for all PRAYAS innovators
3. Institutional support for NIDHI PRAYAS 2.0 implementation

Yours faithfully,

[Name]
Secretary, ITE&C Department
Government of Telangana
[Official Stamp]`
}

export default function Home() {
  const [docs, setDocs] = useState<Document[]>([])
  const [statuses, setStatuses] = useState<Record<number, Status>>({})
  const [userName, setUserName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'checklist' | 'letters' | 'admin'>('checklist')
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDoc, setNewDoc] = useState({ title: '', description: '', hint: '', category: 'Legal Identity', type: 'required' })
  const [letters, setLetters] = useState({ dst: DEFAULT_LETTERS.dst, pmu: DEFAULT_LETTERS.pmu, endorsement: DEFAULT_LETTERS.endorsement })
  const [editingLetter, setEditingLetter] = useState<'dst' | 'pmu' | 'endorsement' | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const categories = ['All', 'Legal Identity', 'Leadership', 'Recognition', 'Equipment', 'Infrastructure', 'Track Record', 'Pipeline', 'Financial', 'Letters']
  const categoryOptions = ['Legal Identity', 'Leadership', 'Recognition', 'Equipment', 'Infrastructure', 'Track Record', 'Pipeline', 'Financial', 'Letters']

  useEffect(() => {
    fetchData()
    const saved = localStorage.getItem('prayas_username')
    if (saved) { setUserName(saved); setNameSet(true) }
    const savedLetters = localStorage.getItem('prayas_letters')
    if (savedLetters) setLetters(JSON.parse(savedLetters))
  }, [])

  async function fetchData() {
    const { data: docsData } = await supabase.from('documents').select('*').order('id')
    const { data: statusData } = await supabase.from('checklist_status').select('*')
    if (docsData) setDocs(docsData)
    if (statusData) {
      const map: Record<number, Status> = {}
      statusData.forEach((s: Status) => { map[s.document_id] = s })
      setStatuses(map)
    }
    setLoading(false)
  }

  async function toggleStatus(docId: number) {
    if (!nameSet) return alert('Please enter your name first')
    const current = statuses[docId]?.status
    const newStatus = current === 'done' ? 'pending' : 'done'
    await supabase.from('checklist_status').upsert({
      document_id: docId, status: newStatus,
      updated_by: userName, updated_at: new Date().toISOString()
    }, { onConflict: 'document_id' })
    setStatuses(prev => ({
      ...prev,
      [docId]: { ...prev[docId], document_id: docId, status: newStatus, updated_by: userName, notes: prev[docId]?.notes || '' }
    }))
  }

  async function saveNote(docId: number, note: string) {
    await supabase.from('checklist_status').upsert({
      document_id: docId, notes: note, updated_by: userName,
      updated_at: new Date().toISOString(), status: statuses[docId]?.status || 'pending'
    }, { onConflict: 'document_id' })
  }

  async function saveEditDoc() {
    if (!editingDoc) return
    await supabase.from('documents').update({
      title: editingDoc.title, description: editingDoc.description,
      hint: editingDoc.hint, category: editingDoc.category, type: editingDoc.type
    }).eq('id', editingDoc.id)
    setDocs(prev => prev.map(d => d.id === editingDoc.id ? editingDoc : d))
    setEditingDoc(null)
  }

  async function deleteDoc(id: number) {
    if (!confirm('Delete this document?')) return
    await supabase.from('checklist_status').delete().eq('document_id', id)
    await supabase.from('documents').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  async function addDoc() {
    if (!newDoc.title.trim()) return alert('Title is required')
    const maxId = docs.length > 0 ? Math.max(...docs.map(d => d.id)) : 0
    const { data } = await supabase.from('documents').insert({ ...newDoc, id: maxId + 1 }).select()
    if (data) {
      setDocs(prev => [...prev, data[0]])
      setShowAddForm(false)
      setNewDoc({ title: '', description: '', hint: '', category: 'Legal Identity', type: 'required' })
    }
  }

  function saveLetter(key: 'dst' | 'pmu' | 'endorsement', value: string) {
    const updated = { ...letters, [key]: value }
    setLetters(updated)
    localStorage.setItem('prayas_letters', JSON.stringify(updated))
    setEditingLetter(null)
  }

  function copyText(key: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const filtered = filter === 'All' ? docs : docs.filter(d => d.category === filter)
  const doneCount = Object.values(statuses).filter(s => s.status === 'done').length
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, marginBottom: 8 }
  const btnStyle = (color: string): React.CSSProperties => ({ padding: '6px 14px', borderRadius: 6, border: 'none', background: color, color: '#fff', fontSize: 12, cursor: 'pointer', marginRight: 6 })

  if (!nameSet) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>T-Works PRAYAS Checklist</h1>
        <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>Enter your name to track progress as a team</p>
        <input placeholder="Your name (e.g. Mugdha)" value={userName}
          onChange={e => setUserName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && userName.trim()) { localStorage.setItem('prayas_username', userName); setNameSet(true) } }}
          style={{ ...inputStyle, marginBottom: 12 }} />
        <button onClick={() => { if (userName.trim()) { localStorage.setItem('prayas_username', userName); setNameSet(true) } }}
          style={{ width: '100%', padding: '10px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
          Start
        </button>
      </div>
    </div>
  )

  return (
    <main style={{ maxWidth: 750, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>NIDHI PRAYAS 2.0 - T-Works</h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
          Logged in as <strong>{userName}</strong> &nbsp;|&nbsp;
          <span style={{ color: '#185FA5', cursor: 'pointer' }} onClick={() => { localStorage.removeItem('prayas_username'); setNameSet(false); setUserName('') }}>switch user</span>
        </p>
        <div style={{ margin: '12px 0', background: '#f5f5f5', borderRadius: 20, height: 7, overflow: 'hidden' }}>
          <div style={{ height: 7, background: '#185FA5', borderRadius: 20, width: `${Math.round(doneCount / Math.max(docs.length, 1) * 100)}%`, transition: 'width .3s' }} />
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>{doneCount} of {docs.length} documents ready</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
        {(['checklist', 'letters', 'admin'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', borderColor: activeTab === tab ? '#185FA5' : '#ddd', background: activeTab === tab ? '#185FA5' : 'white', color: activeTab === tab ? 'white' : '#666', fontSize: 13, cursor: 'pointer' }}>
            {tab === 'checklist' ? 'Checklist' : tab === 'letters' ? 'Letters' : 'Admin'}
          </button>
        ))}
      </div>

      {activeTab === 'checklist' && (
        <>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                style={{ padding: '4px 11px', borderRadius: 20, border: '1px solid', borderColor: filter === c ? '#185FA5' : '#ddd', background: filter === c ? '#185FA5' : 'white', color: filter === c ? 'white' : '#666', fontSize: 12, cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>
          {loading ? <p style={{ color: '#666', fontSize: 14 }}>Loading...</p> : filtered.map(doc => {
            const s = statuses[doc.id]
            const done = s?.status === 'done'
            return (
              <div key={doc.id} style={{ border: '1px solid', borderColor: done ? '#B5D4F4' : '#e5e5e5', borderRadius: 12, marginBottom: 8, background: done ? '#f5f9fe' : 'white', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px' }}>
                  <div onClick={() => toggleStatus(doc.id)} style={{ width: 22, height: 22, minWidth: 22, borderRadius: 11, border: '2px solid', borderColor: done ? '#185FA5' : '#ddd', background: done ? '#185FA5' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, cursor: 'pointer' }}>
                    {done && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: done ? '#185FA5' : '#111' }}>
                      {doc.id}. {doc.title}
                      <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 7px', borderRadius: 8, background: doc.type === 'required' ? '#FCEBEB' : doc.type === 'conditional' ? '#F1EFE8' : '#EAF3DE', color: doc.type === 'required' ? '#A32D2D' : doc.type === 'conditional' ? '#5F5E5A' : '#3B6D11', fontWeight: 500 }}>
                        {doc.type}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{doc.description}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{doc.hint}</div>
                    {s?.updated_by && <div style={{ fontSize: 11, color: '#185FA5', marginTop: 4 }}>Last updated by {s.updated_by}</div>}
                  </div>
                </div>
                <div style={{ padding: '0 14px 12px 48px' }}>
                  <input placeholder="Add a note..." defaultValue={s?.notes || ''}
                    onBlur={e => saveNote(doc.id, e.target.value)}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #e5e5e5', borderRadius: 6, fontSize: 12, color: '#333', background: '#fafafa' }} />
                </div>
              </div>
            )
          })}
        </>
      )}

      {activeTab === 'letters' && (
        <div>
          {[
            { key: 'dst' as const, title: 'Letter 23 - Covering letter to DST', to: 'From: T-Works CEO to Sh. Praveen Roy, DST New Delhi' },
            { key: 'pmu' as const, title: 'Letter 24 - Covering letter to PMU', to: 'From: T-Works CEO to SINE IIT Bombay' },
            { key: 'endorsement' as const, title: 'Letter 25 - Endorsement letter', to: 'From: Secretary ITE&C, Govt. of Telangana to DST' }
          ].map(({ key, title, to }) => (
            <div key={key} style={{ border: '1px solid #e5e5e5', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{to}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setEditingLetter(editingLetter === key ? null : key)} style={btnStyle('#185FA5')}>
                    {editingLetter === key ? 'Cancel' : 'Edit'}
                  </button>
                  <button onClick={() => copyText(key, letters[key])} style={btnStyle(copied === key ? '#0F6E56' : '#555')}>
                    {copied === key ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              {editingLetter === key ? (
                <div style={{ padding: 16 }}>
                  <textarea defaultValue={letters[key]} id={`letter-${key}`}
                    style={{ width: '100%', minHeight: 300, padding: 12, border: '1px solid #ddd', borderRadius: 8, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.7, resize: 'vertical' }} />
                  <button onClick={() => { const el = document.getElementById(`letter-${key}`) as HTMLTextAreaElement; saveLetter(key, el.value) }} style={{ ...btnStyle('#185FA5'), marginTop: 8 }}>
                    Save Letter
                  </button>
                </div>
              ) : (
                <pre style={{ padding: 16, fontSize: 12, fontFamily: 'monospace', lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#333', background: '#fafafa', margin: 0 }}>
                  {letters[key]}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'admin' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500 }}>Manage Documents</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} style={btnStyle('#185FA5')}>
              {showAddForm ? 'Cancel' : '+ Add Document'}
            </button>
          </div>

          {showAddForm && (
            <div style={{ border: '1px solid #B5D4F4', borderRadius: 12, padding: 16, marginBottom: 16, background: '#f5f9fe' }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>New Document</h3>
              <input placeholder="Title *" value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} style={inputStyle} />
              <input placeholder="Description" value={newDoc.description} onChange={e => setNewDoc({ ...newDoc, description: e.target.value })} style={inputStyle} />
              <input placeholder="Hint / where to get it" value={newDoc.hint} onChange={e => setNewDoc({ ...newDoc, hint: e.target.value })} style={inputStyle} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={newDoc.category} onChange={e => setNewDoc({ ...newDoc, category: e.target.value })} style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
                  {categoryOptions.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={newDoc.type} onChange={e => setNewDoc({ ...newDoc, type: e.target.value })} style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
                  <option value="required">required</option>
                  <option value="template">template</option>
                  <option value="conditional">conditional</option>
                </select>
              </div>
              <button onClick={addDoc} style={btnStyle('#185FA5')}>Add Document</button>
            </div>
          )}

          {docs.map(doc => (
            <div key={doc.id} style={{ border: '1px solid #e5e5e5', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
              {editingDoc?.id === doc.id ? (
                <div style={{ padding: 14 }}>
                  <input value={editingDoc.title} onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })} style={inputStyle} placeholder="Title" />
                  <input value={editingDoc.description} onChange={e => setEditingDoc({ ...editingDoc, description: e.target.value })} style={inputStyle} placeholder="Description" />
                  <input value={editingDoc.hint} onChange={e => setEditingDoc({ ...editingDoc, hint: e.target.value })} style={inputStyle} placeholder="Hint" />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select value={editingDoc.category} onChange={e => setEditingDoc({ ...editingDoc, category: e.target.value })} style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
                      {categoryOptions.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select value={editingDoc.type} onChange={e => setEditingDoc({ ...editingDoc, type: e.target.value })} style={{ flex: 1, padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }}>
                      <option value="required">required</option>
                      <option value="template">template</option>
                      <option value="conditional">conditional</option>
                    </select>
                  </div>
                  <button onClick={saveEditDoc} style={btnStyle('#185FA5')}>Save</button>
                  <button onClick={() => setEditingDoc(null)} style={btnStyle('#888')}>Cancel</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{doc.id}. {doc.title}</span>
                    <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 6px', borderRadius: 8, background: doc.type === 'required' ? '#FCEBEB' : doc.type === 'conditional' ? '#F1EFE8' : '#EAF3DE', color: doc.type === 'required' ? '#A32D2D' : doc.type === 'conditional' ? '#5F5E5A' : '#3B6D11' }}>{doc.type}</span>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{doc.category}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditingDoc(doc)} style={btnStyle('#185FA5')}>Edit</button>
                    <button onClick={() => deleteDoc(doc.id)} style={btnStyle('#E24B4A')}>Delete</button>
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