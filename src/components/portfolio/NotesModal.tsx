import React, { useState, useEffect, useCallback } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Button } from '../index'
import { injectOnce } from '../_internal/style'
import { getNotes, createNote, deleteNote } from '../../api/client'
import { MODAL_CSS } from './modalShared'
import type { PositionNote } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  positionId: string
  ticker: string
  name?: string
}

export function NotesModal({ open, onClose, positionId, ticker, name }: Props) {
  injectOnce('ia-modal', MODAL_CSS)

  const [notes, setNotes] = useState<PositionNote[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    getNotes(positionId)
      .then((list) => setNotes([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false))
  }, [positionId])

  useEffect(() => {
    if (!open) return
    setDraft('')
    load()
  }, [open, load])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    setSaving(true)
    setError('')
    try {
      const note = await createNote(positionId, draft.trim())
      setNotes((list) => [note, ...list])
      setDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setError('')
    try {
      await deleteNote(id)
      setNotes((list) => list.filter((n) => n.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeletingId(null)
    }
  }

  if (!open) return null

  return (
    <div className="ia-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="ia-modal" role="dialog" aria-modal="true" aria-label="Заметки">
        <div className="ia-modal__head">
          <span className="ia-modal__title">Заметки {ticker}{name ? ` · ${name}` : ''}</span>
          <button className="ia-modal-close" onClick={onClose} aria-label="Закрыть"><X size={18} /></button>
        </div>

        <div className="ia-modal__body">
          {error && <div className="ia-modal-error">{error}</div>}

          <form className="ia-notes-add" onSubmit={handleAdd}>
            <textarea
              placeholder="Например: держать до див. отсечки 12.08, докупить на просадке"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="ia-notes-add__foot">
              <Button type="submit" size="sm" loading={saving} disabled={!draft.trim()}>
                Добавить заметку
              </Button>
            </div>
          </form>

          <hr className="ia-modal-divider" />

          {loading ? (
            <div className="ia-notes-loading">Загрузка…</div>
          ) : notes.length === 0 ? (
            <div className="ia-notes-empty">Заметок пока нет</div>
          ) : (
            <div className="ia-notes-list">
              {notes.map((n) => (
                <div className="ia-note-item" key={n.id}>
                  <div className="ia-note-item__head">
                    <span className="ia-note-item__date">{new Date(n.createdAt).toLocaleString('ru-RU')}</span>
                    <button
                      type="button"
                      className="ia-table-icon-btn"
                      onClick={() => handleDelete(n.id)}
                      disabled={deletingId === n.id}
                      aria-label="Удалить заметку"
                      title="Удалить заметку"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="ia-note-item__body">{n.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ia-modal__foot">
          <Button type="button" variant="ghost" onClick={onClose}>Закрыть</Button>
        </div>
      </div>
    </div>
  )
}
