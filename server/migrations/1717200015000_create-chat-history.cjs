exports.up = (pgm) => {
  pgm.createTable('chat_conversations', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: '"users"(id)', onDelete: 'CASCADE' },
    title: { type: 'text', notNull: true, default: "'Новый чат'" },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.createIndex('chat_conversations', 'user_id')

  pgm.createTable('chat_messages', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    conversation_id: {
      type: 'uuid', notNull: true,
      references: '"chat_conversations"(id)', onDelete: 'CASCADE',
    },
    role: { type: 'text', notNull: true },
    content: { type: 'text', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  })
  pgm.createIndex('chat_messages', 'conversation_id')
}

exports.down = (pgm) => {
  pgm.dropTable('chat_messages')
  pgm.dropTable('chat_conversations')
}
