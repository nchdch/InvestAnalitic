/** Заметка пользователя по позиции — см. CLAUDE.md «контекстное меню → заметки». */
export interface PositionNote {
  id: string
  positionId: string
  body: string
  createdAt: string
  updatedAt: string
}
