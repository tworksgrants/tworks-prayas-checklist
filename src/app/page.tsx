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

export default function Home() {
  const [docs, setDocs] = useState<Document[]>([])
  const [statuses, setStatuses] = useState<Record<number, Status>>({})
  const [userName, setUserName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  const categories = [
    'All', 'Legal Identity', 'Leadership', 'Recognition',
    'Equipment', 'Infrastructure', 'Track Record', 'Pipeline', 'Financial', 'Letters'
  ]

  useEffect(() => {
    fetchData()
    const saved = localStorage.getItem('prayas_username')
    if (saved) {
      setUserName(saved)
      setNameSet(true)
    }
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
      document_id: docId,
      status: newStatus,
      updated_by: userName,
      updated_at: new Date().toISOString()
    }, { onConflict: 'document_id' })
    setStatuses(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        document_id: docId,
        status: newStatus,
        updated_by: userName,
        notes: prev[docId]?.notes || ''
      }
    }))
  }

  async function saveNote(docId: number, note: string) {
    await supabase.from('checklist_status').upsert({
      document_id: docId,
      notes: note,
      updated_by: userName,
      updated_at: new Date().toISOString(),
      status: statuses[docId]?.status || 'pending'
    }, { onConflict: 'document_id' })
  }

  const filtered = filter === 'All' ? docs : docs.filter(d => d.category === filter)
  const doneCount = Object.values(statuses).filter(s => s.status === 'done').length

  if (!nameSet) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>T-Works PRAYAS Checklist</h1>
          <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>Enter your name to track progress as a team</p>
          <input
            placeholder="Your name (e.g. Mugdha)"
            value={userName}
            onChange={e => setUserName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && userName.trim()) {
                localStorage.setItem('prayas_username', userName)
                setNameSet(true)
              }
            }}
            style={{ width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 12 }}
          />
          <button
            onClick={() => {
              if (userName.trim()) {
                localStorage.setItem('prayas_username', userName)
                setNameSet(true)
              }
            }}
            style={{ width: '100%', padding: '10px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}
          >
            Start
          </button>
        </div>
      </div>
    )
  }

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 500 }}>NIDHI PRAYAS 2.0 — T-Works Checklist</h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
          Logged in as <strong>{userName}</strong> ·{' '}
          <span
            style={{ color: '#185FA5', cursor: 'pointer' }}
            onClick={() => {
              localStorage.removeItem('prayas_username')
              setNameSet(false)
              setUserName('')
            }}
          >
            switch user
          </span>
        </p>
        <div style={{ margin: '16px 0', background: '#f5f5f5', borderRadius: 20, height: 8, overflow: 'hidden' }}>
          <div style={{ height: 8, background: '#185FA5', borderRadius: 20, width: `${Math.round(doneCount / 26 * 100)}%`, transition: 'width .3s' }} />
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>{doneCount} of 26 documents ready</p>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            style={{
              padding: '5px 12px',
              borderRadius: 20,
              border: '1px solid',
              borderColor: filter === c ? '#185FA5' : '#ddd',
              background: filter === c ? '#185FA5' : 'white',
              color: filter === c ? 'white' : '#666',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#666', fontSize: 14 }}>Loading...</p>
      ) : (
        filtered.map(doc => {
          const s = statuses[doc.id]
          const done = s?.status === 'done'
          return (
            <div
              key={doc.id}
              style={{
                border: '1px solid',
                borderColor: done ? '#B5D4F4' : '#e5e5e5',
                borderRadius: 12,
                marginBottom: 8,
                background: done ? '#f5f9fe' : 'white',
                overflow: 'hidden'
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', cursor: 'pointer' }}
                onClick={() => toggleStatus(doc.id)}
              >
                <div style={{
                  width: 22, height: 22, minWidth: 22, borderRadius: 11,
                  border: '2px solid', borderColor: done ? '#185FA5' : '#ddd',
                  background: done ? '#185FA5' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2
                }}>
                  {done && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: done ? '#185FA5' : '#111' }}>
                    {doc.id}. {doc.title}
                    <span style={{
                      marginLeft: 8, fontSize: 10, padding: '2px 7px', borderRadius: 8,
                      background: doc.type === 'required' ? '#FCEBEB' : doc.type === 'conditional' ? '#F1EFE8' : '#EAF3DE',
                      color: doc.type === 'required' ? '#A32D2D' : doc.type === 'conditional' ? '#5F5E5A' : '#3B6D11',
                      fontWeight: 500
                    }}>
                      {doc.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{doc.description}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{doc.hint}</div>
                  {s?.updated_by && (
                    <div style={{ fontSize: 11, color: '#185FA5', marginTop: 4 }}>Last updated by {s.updated_by}</div>
                  )}
                </div>
              </div>
              <div style={{ padding: '0 14px 12px 48px' }}>
                <input
                  placeholder="Add a note (e.g. collected, pending from finance)..."
                  defaultValue={s?.notes || ''}
                  onBlur={e => saveNote(doc.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  style={{ width: '100%', padding: '6px 10px', border: '1px solid #e5e5e5', borderRadius: 6, fontSize: 12, color: '#333', background: '#fafafa' }}
                />
              </div>
            </div>
          )
        })
      )}
    </main>
  )
}
