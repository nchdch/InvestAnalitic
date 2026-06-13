import React from 'react'

/** Лёгкий безопасный рендер Markdown в React-узлы: заголовки, абзацы, списки, таблицы, **жирный** и `код`. */

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[2] !== undefined) parts.push(<strong key={`${keyPrefix}-${i++}`}>{match[2]}</strong>)
    else if (match[3] !== undefined) parts.push(<code key={`${keyPrefix}-${i++}`}>{match[3]}</code>)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

const cellStyle: React.CSSProperties = { border: '1px solid var(--border-2)', padding: '6px 10px', textAlign: 'left' }
const headerCellStyle: React.CSSProperties = { ...cellStyle, fontWeight: 'var(--fw-semibold)' as React.CSSProperties['fontWeight'] }

function parseTableRow(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
}

function renderTable(lines: string[], key: number): React.ReactNode {
  const header = parseTableRow(lines[0])
  const rows = lines.slice(2).map(parseTableRow)
  return (
    <table key={key} style={{ borderCollapse: 'collapse', margin: '8px 0', fontSize: 'var(--text-sm)' }}>
      <thead>
        <tr>
          {header.map((h, i) => (
            <th key={i} style={headerCellStyle}>{renderInline(h, `th${key}-${i}`)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} style={cellStyle}>{renderInline(cell, `td${key}-${i}-${j}`)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    if (trimmed === '') { i++; continue }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = Math.min(heading[1].length + 2, 6)
      const Tag = `h${level}` as 'h3' | 'h4' | 'h5' | 'h6'
      blocks.push(<Tag key={key++}>{renderInline(heading[2], `h${key}`)}</Tag>)
      i++
      continue
    }

    if (trimmed.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      if (tableLines.length >= 2) blocks.push(renderTable(tableLines, key++))
      continue
    }

    if (/^[-*]\s/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''))
        i++
      }
      blocks.push(
        <ul key={key++} style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {items.map((item, idx) => <li key={idx}>{renderInline(item, `li${key}-${idx}`)}</li>)}
        </ul>,
      )
      continue
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push(
        <ol key={key++} style={{ margin: '4px 0', paddingLeft: '20px' }}>
          {items.map((item, idx) => <li key={idx}>{renderInline(item, `oli${key}-${idx}`)}</li>)}
        </ol>,
      )
      continue
    }

    const paragraphLines: string[] = []
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('|') &&
      !/^#{1,6}\s/.test(lines[i].trim()) &&
      !/^[-*]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i])
      i++
    }
    blocks.push(
      <p key={key++}>
        {paragraphLines.map((l, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {renderInline(l, `p${key}-${idx}`)}
          </React.Fragment>
        ))}
      </p>,
    )
  }

  return <>{blocks}</>
}
