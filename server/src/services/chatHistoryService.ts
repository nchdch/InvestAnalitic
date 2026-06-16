import { pool } from '../db/pool.js'

export interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
  preview: string | null
}

export interface ChatMessageRow {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const { rows } = await pool.query<Conversation>(
    `SELECT c.id, c.title, c.created_at, c.updated_at,
       (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS preview
     FROM chat_conversations c
     WHERE c.user_id = $1
     ORDER BY c.updated_at DESC
     LIMIT 100`,
    [userId],
  )
  return rows
}

export async function createConversation(userId: string, title: string): Promise<Conversation> {
  const { rows } = await pool.query<Conversation>(
    `INSERT INTO chat_conversations (user_id, title)
     VALUES ($1, $2)
     RETURNING id, title, created_at, updated_at, NULL::text AS preview`,
    [userId, title.slice(0, 100) || 'Новый чат'],
  )
  return rows[0]
}

/** Возвращает null, если беседа не принадлежит пользователю. */
export async function getConversationOwner(conversationId: string): Promise<string | null> {
  const { rows } = await pool.query<{ user_id: string }>(
    `SELECT user_id FROM chat_conversations WHERE id = $1`,
    [conversationId],
  )
  return rows[0]?.user_id ?? null
}

export async function getConversationMessages(conversationId: string, userId: string): Promise<ChatMessageRow[]> {
  const { rows } = await pool.query<ChatMessageRow>(
    `SELECT m.id, m.conversation_id, m.role, m.content, m.created_at
     FROM chat_messages m
     JOIN chat_conversations c ON c.id = m.conversation_id
     WHERE m.conversation_id = $1 AND c.user_id = $2
     ORDER BY m.created_at ASC`,
    [conversationId, userId],
  )
  return rows
}

export async function appendMessage(conversationId: string, role: string, content: string): Promise<void> {
  await pool.query(
    `INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, $2, $3)`,
    [conversationId, role, content],
  )
  await pool.query(
    `UPDATE chat_conversations SET updated_at = now() WHERE id = $1`,
    [conversationId],
  )
}

export async function deleteConversation(conversationId: string, userId: string): Promise<boolean> {
  const { rowCount } = await pool.query(
    `DELETE FROM chat_conversations WHERE id = $1 AND user_id = $2`,
    [conversationId, userId],
  )
  return (rowCount ?? 0) > 0
}
