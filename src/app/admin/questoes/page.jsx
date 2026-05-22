'use client'

import React, { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { Poppins } from 'next/font/google'
import { useRouter, useSearchParams } from 'next/navigation'
import { collection, addDoc, deleteDoc, doc, updateDoc, getDoc, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import Image from 'next/image'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import Superscript from '@tiptap/extension-superscript'
import Subscript from '@tiptap/extension-subscript'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'

const FONT_SIZES = ['8','9','10','11','12','14','16','18','20','22','24','26','28','36','42','48','72']
const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Times New Roman', value: '"Times New Roman",serif' },
  { label: 'Courier New', value: '"Courier New",monospace' },
  { label: 'Georgia', value: 'Georgia,serif' },
  { label: 'Verdana', value: 'Verdana,sans-serif' },
]
const TEXT_COLORS = ['#000000','#434343','#666666','#999999','#b7b7b7','#ffffff','#980000','#ff0000','#ff9900','#ffff00','#00ff00','#00ffff','#4a86e8','#0000ff','#9900ff','#ff00ff']
const HIGHLIGHT_COLORS = ['#ffff00','#00ff00','#00ffff','#ff9900','#ff00ff','#ff0000','#ffffff','#000000']

const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: { default: null, parseHTML: el => el.style.fontSize?.replace(/['"]+/g,''), renderHTML: attrs => attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {} },
    }
  },
  addCommands() {
    return {
      setFontSize: fs => ({ chain }) => chain().setMark('textStyle', { fontSize: fs }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    }
  },
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

function Tb({ onClick, active, title, children, disabled, small }) {
  return (
    <button type="button" onMouseDown={e => { e.preventDefault(); onClick?.() }}
      className={`rounded cursor-pointer transition-colors flex items-center justify-center ${small ? 'p-1' : 'p-1.5'} ${disabled ? 'opacity-30 cursor-not-allowed' : active ? 'bg-[#82181A] text-white' : 'text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'}`}
      title={title} disabled={disabled}
    >{children}</button>
  )
}
const Sep = () => <span className="w-px h-5 bg-neutral-300 mx-1 shrink-0" />

function ColorPicker({ label, colors, value, onChange, allowNone }) {
  const [open, setOpen] = useState(false)

  useOnClickOutside(open, () => setOpen(false))

  return (
    <div className="relative">
      <button type="button" onMouseDown={e => { e.preventDefault(); setOpen(!open) }}
        className="flex items-center gap-1 px-1.5 py-1 text-xs border border-neutral-300 rounded bg-white hover:bg-neutral-100 cursor-pointer"
        title={label}
      >
        <span className="flex flex-col items-center gap-px">
          <span className={`w-4 h-3 rounded-sm border ${value ? 'border-neutral-400' : 'border-neutral-300'}`} style={{ background: value || 'transparent' }} />
          <span className="w-4 h-[3px] rounded-sm" style={{ background: value || '#ccc' }} />
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-neutral-200 rounded-xl shadow-xl p-3 min-w-[196px]">
            {allowNone && (
              <button type="button" onMouseDown={e => { e.preventDefault(); onChange(null); setOpen(false) }}
                className="w-full text-left text-xs text-neutral-500 px-2 py-1.5 rounded hover:bg-neutral-100 mb-1 cursor-pointer"
              >Nenhum</button>
            )}
            <div className="grid grid-cols-8 gap-1.5">
              {colors.map(c => (
                <button key={c} type="button" onMouseDown={e => { e.preventDefault(); onChange(c); setOpen(false) }}
                  className={`w-6 h-6 rounded-md border-2 cursor-pointer hover:scale-110 transition-transform ${c === value ? 'border-neutral-900 scale-110' : 'border-neutral-200 hover:border-neutral-400'}`}
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function useOnClickOutside(active, handler) {
  const savedHandler = useRef(handler)
  savedHandler.current = handler
  useEffect(() => {
    if (!active) return
    const listener = (e) => { if (!e.defaultPrevented) savedHandler.current() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [active])
}

function MenuBar({ editor }) {
  if (!editor) return null

  const addLink = () => { const url = window.prompt('URL:'); if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run() }
  const addTable = () => {
    const cols = parseInt(window.prompt('Colunas:', '3')) || 3
    const rows = parseInt(window.prompt('Linhas:', '3')) || 3
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
  }

  const headingDepth = () => { for (let d = 1; d <= 6; d++) { if (editor.isActive('heading', { level: d })) return d } return 0 }
  const hDepth = headingDepth()
  const isTableActive = editor.isActive('table')
  const currentFontSize = editor.getAttributes('textStyle').fontSize || '16'
  const currentFontFamily = editor.getAttributes('textStyle').fontFamily || ''
  const textColor = editor.getAttributes('textStyle').color || '#000'

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-sm">
      {/* Row 1 — Text formatting */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-neutral-100">
        <Tb onClick={() => editor.chain().focus().undo().run()} title="Desfazer (Ctrl+Z)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </Tb>
        <Tb onClick={() => editor.chain().focus().redo().run()} title="Refazer (Ctrl+Shift+Z)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
        </Tb>
        <Sep />

        {/* Paragraph style */}
        <select value={hDepth} onChange={e => { const v = parseInt(e.target.value); v === 0 ? editor.chain().focus().setParagraph().run() : editor.chain().focus().toggleHeading({ level: v }).run() }}
          className="text-xs border border-neutral-300 rounded px-1.5 py-1 bg-white cursor-pointer outline-none focus:border-[#82181A]" title="Estilo de parágrafo">
          <option value={0}>Normal</option>
          <option value={2}>Título 2</option>
          <option value={3}>Título 3</option>
          <option value={4}>Título 4</option>
        </select>

        {/* Font size */}
        <select value={currentFontSize} onChange={e => editor.chain().focus().setFontSize(e.target.value).run()}
          className="text-xs border border-neutral-300 rounded px-1 py-1 bg-white cursor-pointer outline-none focus:border-[#82181A] w-14" title="Tamanho da fonte">
          {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Font family */}
        <select value={currentFontFamily} onChange={e => editor.chain().focus().setFontFamily(e.target.value).run()}
          className="text-xs border border-neutral-300 rounded px-1 py-1 bg-white cursor-pointer outline-none focus:border-[#82181A] max-w-28" title="Fonte">
          <option value="">Fonte</option>
          {FONT_FAMILIES.map(f => <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>)}
        </select>

        <Sep />

        <Tb onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrito (Ctrl+B)">
          <b className="text-sm font-bold">B</b>
        </Tb>
        <Tb onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Itálico (Ctrl+I)">
          <i className="text-sm italic">I</i>
        </Tb>
        <Tb onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Sublinhado (Ctrl+U)">
          <u className="text-sm underline">U</u>
        </Tb>
        <Tb onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado (Ctrl+Shift+S)">
          <s className="text-sm">S</s>
        </Tb>
        <Tb onClick={() => editor.chain().focus().toggleSuperscript().run()} active={editor.isActive('superscript')} title="Sobrescrito">
          <sup className="text-xs">x²</sup>
        </Tb>
        <Tb onClick={() => editor.chain().focus().toggleSubscript().run()} active={editor.isActive('subscript')} title="Subscrito">
          <sub className="text-xs">x₂</sub>
        </Tb>

        <Sep />

        <ColorPicker label="Cor do texto" colors={TEXT_COLORS} value={textColor} onChange={c => editor.chain().focus().setColor(c).run()} />
        <ColorPicker label="Cor de destaque" colors={HIGHLIGHT_COLORS} value={editor.getAttributes('highlight').color || ''} onChange={c => c ? editor.chain().focus().toggleHighlight({ color: c }).run() : editor.chain().focus().toggleHighlight().run()} allowNone />

        <Sep />

        <Tb onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Limpar formatação">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L11 21H7"/><path d="m11 3 6 6"/></svg>
        </Tb>
      </div>

      {/* Row 2 — Block / alignment / insert */}
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
        <Tb onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinhar à esquerda" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></svg>
        </Tb>
        <Tb onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centralizar" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="9" y1="18" x2="15" y2="18"/></svg>
        </Tb>
        <Tb onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinhar à direita" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="9" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/></svg>
        </Tb>
        <Tb onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </Tb>

        <Sep />

        <Tb onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista com marcadores" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
        </Tb>
        <Tb onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
        </Tb>
        <Tb onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Lista de tarefas" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        </Tb>

        <Sep />

        <Tb onClick={() => editor.chain().focus().sinkListItem('listItem').run()} disabled={!editor.can().sinkListItem('listItem')} title="Aumentar recuo (Tab)" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="8 8 12 12 8 16"/><line x1="16" y1="8" x2="16" y2="16"/></svg>
        </Tb>
        <Tb onClick={() => editor.chain().focus().liftListItem('listItem').run()} disabled={!editor.can().liftListItem('listItem')} title="Diminuir recuo (Shift+Tab)" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="16 8 12 12 8 16"/><line x1="8" y1="8" x2="8" y2="16"/></svg>
        </Tb>

        <Sep />

        <Tb onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citação" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
        </Tb>
        <Tb onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Bloco de código" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </Tb>
        <Tb onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha horizontal" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><line x1="3" y1="12" x2="21" y2="12"/></svg>
        </Tb>

        <Sep />

        <Tb onClick={addTable} active={isTableActive} title="Inserir tabela" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 3h18v18H3z"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
        </Tb>
        {isTableActive && (
          <>
            <Tb onClick={() => editor.chain().focus().addColumnBefore().run()} title="Adicionar coluna à esquerda" small>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="9" x2="8" y2="9"/><line x1="3" y1="15" x2="8" y2="15"/></svg>
            </Tb>
            <Tb onClick={() => editor.chain().focus().addColumnAfter().run()} title="Adicionar coluna à direita" small>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="16" y1="9" x2="21" y2="9"/><line x1="16" y1="15" x2="21" y2="15"/></svg>
            </Tb>
            <Tb onClick={() => editor.chain().focus().addRowBefore().run()} title="Adicionar linha acima" small>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="9" y1="3" x2="9" y2="8"/><line x1="15" y1="3" x2="15" y2="8"/></svg>
            </Tb>
            <Tb onClick={() => editor.chain().focus().addRowAfter().run()} title="Adicionar linha abaixo" small>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="9" y1="16" x2="9" y2="21"/><line x1="15" y1="16" x2="15" y2="21"/></svg>
            </Tb>
            <Tb onClick={() => editor.chain().focus().deleteColumn().run()} title="Excluir coluna" small>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="10" y1="3" x2="10" y2="8"/><line x1="14" y1="3" x2="14" y2="8"/></svg>
            </Tb>
            <Tb onClick={() => editor.chain().focus().deleteRow().run()} title="Excluir linha" small>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="10" x2="8" y2="10"/><line x1="3" y1="14" x2="8" y2="14"/></svg>
            </Tb>
            <Tb onClick={() => editor.chain().focus().deleteTable().run()} title="Excluir tabela" small>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 3h18v18H3z"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </Tb>
          </>
        )}

        <Sep />

        <Tb onClick={addLink} active={editor.isActive('link')} title="Inserir link (Ctrl+K)" small>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        </Tb>
        {editor.isActive('link') && (
          <Tb onClick={() => editor.chain().focus().unsetLink().run()} title="Remover link" small>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </Tb>
        )}
      </div>
    </div>
  )
}

function RichTextEditor({ value, onChange, placeholder, minH = '300px' }) {
  const editorRef = useRef(null)
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ placeholder: false, codeBlock: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LinkExtension.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || '' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      FontSize,
      Color,
      FontFamily,
      Superscript,
      Subscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => onChange?.(ed.getHTML()),
    editorProps: {
      attributes: { class: 'tiptap-editor focus:outline-none px-4 py-3', style: `min-height: ${minH}` },
      handleKeyDown: (view, event) => {
        const ed = editorRef.current
        if (!ed) return false
        if (event.key === 'Tab') {
          if (ed.isActive('listItem') || ed.isActive('bulletList') || ed.isActive('orderedList') || ed.isActive('taskList')) {
            if (event.shiftKey) { ed.chain().focus().liftListItem('listItem').run() } else { ed.chain().focus().sinkListItem('listItem').run() }
            return true
          }
          if (!event.shiftKey) { view.dispatch(view.state.tr.insertText('\u00A0\u00A0\u00A0\u00A0')); return true }
        }
        if (event.key === 'k' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); const url = window.prompt('URL:'); if (url) ed.chain().focus().setLink({ href: url, target: '_blank' }).run(); return true }
        if (event.key === 'S' && event.shiftKey && (event.ctrlKey || event.metaKey)) { event.preventDefault(); ed.chain().focus().toggleStrike().run(); return true }
        if (event.key === 'e' && event.shiftKey && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          const a = ['left','center','right','justify']; const c = ed.getAttributes('paragraph').textAlign || 'left'
          ed.chain().focus().setTextAlign(a[(a.indexOf(c) + 1) % a.length]).run(); return true
        }
        return false
      },
    },
  })
  editorRef.current = editor

  useEffect(() => {
    if (!editor) return
    const c = editor.getHTML()
    if (value !== c && value !== undefined && value !== null) editor.commands.setContent(value || '')
  }, [value])

  return (
    <div className="border border-neutral-300 rounded-lg overflow-hidden bg-white shadow-sm">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

function BlocoEditor({ blocos, setBlocos }) {
  const addBloco = () => {
    const novo = {
      id: Date.now(),
      titulo: '', subtitulo: '', blocos: [],
      origem: '', creditos: '', disponivelEm: '',
      glossario: [], palavrasChave: [],
    }
    setBlocos([...blocos, novo])
  }

  const upd = (i, campo, val) => {
    const b = [...blocos]; b[i][campo] = val; setBlocos(b)
  }

  const rem = (i) => setBlocos(blocos.filter((_, idx) => idx !== i))
  const mover = (i, dir) => {
    const nova = [...blocos]; const dest = i + dir
    if (dest < 0 || dest >= nova.length) return
    ;[nova[i], nova[dest]] = [nova[dest], nova[i]]
    setBlocos(nova)
  }

  const addGlossario = (i) => {
    const b = [...blocos]; b[i].glossario = [...(b[i].glossario || []), { termo: '', definicao: '' }]; setBlocos(b)
  }
  const updGlossario = (i, j, campo, val) => {
    const b = [...blocos]; b[i].glossario[j][campo] = val; setBlocos(b)
  }
  const remGlossario = (i, j) => {
    const b = [...blocos]; b[i].glossario = b[i].glossario.filter((_, idx) => idx !== j); setBlocos(b)
  }

  const addKW = (i) => {
    const b = [...blocos]; b[i].palavrasChave = [...(b[i].palavrasChave || []), '']; setBlocos(b)
  }
  const updKW = (i, j, val) => {
    const b = [...blocos]; b[i].palavrasChave[j] = val; setBlocos(b)
  }
  const remKW = (i, j) => {
    const b = [...blocos]; b[i].palavrasChave = b[i].palavrasChave.filter((_, idx) => idx !== j); setBlocos(b)
  }

  const addBlocoInterno = (i, tipo) => {
    const b = [...blocos]; b[i].blocos = [...(b[i].blocos || []), { tipo, conteudo: '', id: Date.now() }]; setBlocos(b)
  }
  const updBlocoInterno = (i, j, val) => {
    const b = [...blocos]; b[i].blocos[j].conteudo = val; setBlocos(b)
  }
  const remBlocoInterno = (i, j) => {
    const b = [...blocos]; b[i].blocos = b[i].blocos.filter((_, idx) => idx !== j); setBlocos(b)
  }
  const moverBlocoInterno = (i, j, dir) => {
    const b = [...blocos]; const dest = j + dir
    if (dest < 0 || dest >= (b[i].blocos || []).length) return
    ;[b[i].blocos[j], b[i].blocos[dest]] = [b[i].blocos[dest], b[i].blocos[j]]
    setBlocos(b)
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-neutral-700'>Documentos da Questão</p>
        <div className='flex flex-wrap gap-1'>
          <button type="button" onClick={() => addBloco()}
            className='text-xs bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded font-medium cursor-pointer transition-colors'>
            + Documento
          </button>
        </div>
      </div>

      {blocos.length === 0 && (
        <p className='text-xs text-neutral-400 italic'>Nenhum documento. Clique em + para adicionar.</p>
      )}

      <div className='space-y-3'>
        {blocos.map((b, i) => (
          <div key={b.id || i} className='border border-neutral-200 rounded-xl bg-white overflow-hidden'>
            <div className='flex items-center justify-between bg-neutral-50 px-4 py-2 border-b border-neutral-200'>
              <span className='text-xs font-semibold uppercase text-neutral-500'>Documento {i + 1} — {b.tipo}</span>
              <div className='flex gap-1'>
                <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} className='text-xs px-2 py-1 rounded hover:bg-neutral-200 disabled:opacity-30 cursor-pointer'>↑</button>
                <button type="button" onClick={() => mover(i, 1)} disabled={i === blocos.length - 1} className='text-xs px-2 py-1 rounded hover:bg-neutral-200 disabled:opacity-30 cursor-pointer'>↓</button>
                <button type="button" onClick={() => rem(i)} className='text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 cursor-pointer'>×</button>
              </div>
            </div>
            <div className='p-4 space-y-3'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <input type="text" placeholder="Título do documento" value={b.titulo} onChange={(e) => upd(i, 'titulo', e.target.value)}
                  className="rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />
                <input type="text" placeholder="Subtítulo / Tipo (ex: Fotografia, Romance)" value={b.subtitulo} onChange={(e) => upd(i, 'subtitulo', e.target.value)}
                  className="rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />
              </div>

              <div className='border border-dashed border-neutral-300 rounded-xl p-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <p className='text-xs font-semibold text-neutral-500 uppercase'>Conteúdo do Documento</p>
                  <div className='flex gap-1'>
                    {[['texto', 'Texto'], ['imagem', 'Imagem'], ['video', 'Vídeo'], ['pdf', 'PDF'], ['musica', 'Música']].map(([t, n]) => (
                      <button key={t} type="button" onClick={() => addBlocoInterno(i, t)}
                        className='text-xs bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded cursor-pointer transition-colors'>
                        + {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className='space-y-2'>
                  {(b.blocos || []).length === 0 && (
                    <p className='text-xs text-neutral-400 italic'>Nenhum bloco. Clique em + para adicionar conteúdo.</p>
                  )}
                  {(b.blocos || []).map((bloco, j) => (
                    <div key={bloco.id || j} className='border border-neutral-200 rounded-lg p-3 bg-neutral-50'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-[10px] font-semibold uppercase text-neutral-400'>{bloco.tipo}</span>
                        <div className='flex gap-1'>
                          <button type="button" onClick={() => moverBlocoInterno(i, j, -1)} disabled={j === 0} className='text-xs px-1.5 py-0.5 rounded hover:bg-neutral-200 disabled:opacity-30 cursor-pointer'>↑</button>
                          <button type="button" onClick={() => moverBlocoInterno(i, j, 1)} disabled={j === (b.blocos || []).length - 1} className='text-xs px-1.5 py-0.5 rounded hover:bg-neutral-200 disabled:opacity-30 cursor-pointer'>↓</button>
                          <button type="button" onClick={() => remBlocoInterno(i, j)} className='text-xs px-1.5 py-0.5 rounded text-red-600 hover:bg-red-50 cursor-pointer'>×</button>
                        </div>
                      </div>
                      {bloco.tipo === 'texto' && (
                        <RichTextEditor value={bloco.conteudo} onChange={(v) => updBlocoInterno(i, j, v)} placeholder="Digite o texto..." minH="100px" />
                      )}
                      {['imagem', 'video', 'pdf', 'musica'].includes(bloco.tipo) && (
                        <div className='space-y-2'>
                          <input type="text" placeholder={
                            bloco.tipo === 'imagem' ? 'URL da imagem' :
                            bloco.tipo === 'video' ? 'URL do YouTube' :
                            bloco.tipo === 'pdf' ? 'URL do PDF' : 'URL da música'
                          } value={bloco.conteudo} onChange={(e) => updBlocoInterno(i, j, e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 p-2 text-xs outline-none focus:border-[#82181A]" />
                          {bloco.conteudo && bloco.tipo === 'imagem' && (
                            <img src={bloco.conteudo} alt="" className='max-h-32 rounded object-contain bg-white' onError={(e) => e.target.style.display = 'none'} />
                          )}
                          {bloco.conteudo && bloco.tipo === 'video' && (
                            <div className='aspect-video rounded overflow-hidden bg-black max-h-32'>
                              <iframe src={bloco.conteudo.replace('watch?v=', 'embed/')} className='w-full h-full' allowFullScreen />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className='border-t border-neutral-200 pt-3 space-y-3'>
                <p className='text-xs font-semibold text-neutral-500 uppercase'>Metadados do Documento</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <input type="text" placeholder="Origem" value={b.origem} onChange={(e) => upd(i, 'origem', e.target.value)}
                    className="rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />
                  <input type="text" placeholder="Créditos" value={b.creditos} onChange={(e) => upd(i, 'creditos', e.target.value)}
                    className="rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />
                </div>
                <input type="text" placeholder="Disponível em (URL)" value={b.disponivelEm} onChange={(e) => upd(i, 'disponivelEm', e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 p-2.5 text-sm outline-none focus:border-[#82181A]" />

                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <p className='text-xs text-neutral-500'>Glossário</p>
                    <button type="button" onClick={() => addGlossario(i)} className='text-xs text-[#82181A] font-semibold hover:underline cursor-pointer'>+ termo</button>
                  </div>
                  {(b.glossario || []).map((g, j) => (
                    <div key={j} className='flex items-center gap-2 mb-1'>
                      <input type="text" placeholder="Termo" value={g.termo} onChange={(e) => updGlossario(i, j, 'termo', e.target.value)}
                        className="flex-1 rounded-lg border border-neutral-300 p-2 text-xs outline-none focus:border-[#82181A]" />
                      <input type="text" placeholder="Definição" value={g.definicao} onChange={(e) => updGlossario(i, j, 'definicao', e.target.value)}
                        className="flex-[2] rounded-lg border border-neutral-300 p-2 text-xs outline-none focus:border-[#82181A]" />
                      <button type="button" onClick={() => remGlossario(i, j)} className='text-xs text-red-600 cursor-pointer'>×</button>
                    </div>
                  ))}
                </div>

                <div>
                  <div className='flex items-center justify-between mb-1'>
                    <p className='text-xs text-neutral-500'>Palavras-chave</p>
                    <button type="button" onClick={() => addKW(i)} className='text-xs text-[#82181A] font-semibold hover:underline cursor-pointer'>+ palavra</button>
                  </div>
                  <div className='flex flex-wrap gap-1'>
                    {(b.palavrasChave || []).map((kw, j) => (
                      <div key={j} className='flex items-center gap-1 bg-[#82181A]/10 rounded-full px-3 py-1'>
                        <input type="text" value={kw} onChange={(e) => updKW(i, j, e.target.value)}
                          className='w-20 bg-transparent text-xs outline-none text-[#82181A]' />
                        <button type="button" onClick={() => remKW(i, j)} className='text-xs text-red-600 cursor-pointer'>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuestoesForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const faseId = searchParams.get('faseId')
  const edicaoId = searchParams.get('edicaoId')

  const [fase, setFase] = useState(null)
  const [questoes, setQuestoes] = useState([])
  const [edicaoNome, setEdicaoNome] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [autenticado, setAutenticado] = useState(false)

  const [numero, setNumero] = useState('')
  const [instrucao, setInstrucao] = useState('')
  const [comentario, setComentario] = useState('')
  const [alternativas, setAlternativas] = useState([
    { letra: 'A', texto: '', peso: 0 },
    { letra: 'B', texto: '', peso: 0 },
    { letra: 'C', texto: '', peso: 0 },
    { letra: 'D', texto: '', peso: 0 },
  ])
  const [documentos, setDocumentos] = useState([])
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [tarefaTitulo, setTarefaTitulo] = useState('')
  const [tarefaUrl, setTarefaUrl] = useState('')

  const limparForm = () => {
    setNumero(''); setInstrucao(''); setComentario('')
    setAlternativas([{ letra: 'A', texto: '', peso: 0 }, { letra: 'B', texto: '', peso: 0 }, { letra: 'C', texto: '', peso: 0 }, { letra: 'D', texto: '', peso: 0 }])
    setDocumentos([]); setEditandoId(null); setErro('')
  }

  useEffect(() => {
    const admin = localStorage.getItem('admin-authenticated')
    if (admin !== 'true') router.push('/admin')
    else setAutenticado(true)
  }, [router])

  useEffect(() => {
    if (!autenticado || !faseId) return
    const carregar = async () => {
      const fSnap = await getDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId))
      if (fSnap.exists()) {
        setFase({ id: fSnap.id, ...fSnap.data() })
        setTarefaTitulo(fSnap.data().tarefa?.titulo || '')
        setTarefaUrl(fSnap.data().tarefaUrl || '')
      }
      if (edicaoId) {
        const eSnap = await getDoc(doc(db, 'edicoes', edicaoId))
        if (eSnap.exists()) setEdicaoNome(eSnap.data().nome || '')
      }
      setCarregando(false)
    }
    carregar()
  }, [autenticado, faseId, edicaoId])

  const carregarQuestoes = useCallback(async () => {
    if (!faseId) return
    const q = query(collection(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes'), orderBy('numero', 'asc'))
    const snap = await getDocs(q)
    setQuestoes(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }, [faseId, edicaoId])

  useEffect(() => { carregarQuestoes() }, [carregarQuestoes])

  const handleSalvarTarefa = async () => {
    try {
      await updateDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId), {
        tarefa: { titulo: tarefaTitulo },
        tarefaUrl,
      })
    } catch {}
  }

  const handleCriarQuestao = async (e) => {
    e.preventDefault()
    setErro('')
    if (!numero || !instrucao.trim()) { setErro('Número e instrução são obrigatórios.'); return }
    if (alternativas.some((a) => !a.texto.trim())) { setErro('Todas as alternativas devem ter texto.'); return }
    setSalvando(true)
    const dados = {
      numero: parseInt(numero),
      instrucao: instrucao.trim(),
      comentario: comentario.trim(),
      alternativas,
      documentos,
      updatedAt: new Date().toISOString(),
    }
    try {
      if (editandoId) {
        await updateDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes', editandoId), dados)
      } else {
        await addDoc(collection(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes'), { ...dados, createdAt: new Date().toISOString() })
      }
      limparForm(); await carregarQuestoes()
    } catch { setErro('Erro ao salvar questão.') }
    finally { setSalvando(false) }
  }

  const handleEditarQuestao = (q) => {
    setNumero(String(q.numero))
    setInstrucao(q.instrucao || '')
    setComentario(q.comentario || '')
    setAlternativas(q.alternativas || [{ letra: 'A', texto: '', peso: 0 }, { letra: 'B', texto: '', peso: 0 }, { letra: 'C', texto: '', peso: 0 }, { letra: 'D', texto: '', peso: 0 }])
    setDocumentos(q.documentos || [])
    setEditandoId(q.id)
    setErro('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeletarQuestao = async (qId) => {
    if (editandoId === qId) limparForm()
    try { await deleteDoc(doc(db, 'edicoes', edicaoId, 'fases', faseId, 'questoes', qId)); await carregarQuestoes() } catch {}
  }

  if (!autenticado || carregando) {
    return <div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>
  }

  return (
    <div className={poppins.className}>
      <div className='w-full min-h-screen bg-[#f5f5f5] text-[#000]'>
        <header className='flex items-center justify-between px-6 py-4 bg-white shadow-sm'>
          <div className='flex items-center gap-4'>
            <Image src="/logo.svg" width={60} height={60} alt="Logo" />
            <div>
              <p className='text-sm text-neutral-500'>{edicaoNome}</p>
              <h1 className='text-lg font-bold text-[#82181A]'>Questões — {fase?.nome || ''}</h1>
            </div>
          </div>
          <button onClick={() => router.push('/admin/dashboard')} className='border border-[#82181A] text-[#82181A] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#82181A] hover:text-white transition-colors cursor-pointer'>Voltar</button>
        </header>

        <main className='max-w-5xl mx-auto px-4 py-8 space-y-8'>
          <div className='bg-white rounded-xl shadow-md p-6'>
            <h2 className='text-lg font-bold text-[#82181A] mb-4'>Tarefa da Fase</h2>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
              <input type="text" placeholder="Título da tarefa (ex: Questionário)" value={tarefaTitulo} onChange={(e) => setTarefaTitulo(e.target.value)}
                className="rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />
              <input type="text" placeholder="URL da página da tarefa (ex: /tarefa/fase1)" value={tarefaUrl} onChange={(e) => setTarefaUrl(e.target.value)}
                className="md:col-span-2 rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />
            </div>
            <button onClick={handleSalvarTarefa} className="bg-[#82181A] text-white text-sm font-semibold px-6 py-2 rounded-lg hover:bg-[#631214] transition-colors cursor-pointer">Salvar Tarefa</button>
          </div>

          <div className='bg-white rounded-xl shadow-md p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-bold text-[#82181A]'>{editandoId ? 'Editar Questão' : 'Nova Questão'}</h2>
              {editandoId && (
                <button type="button" onClick={limparForm} className='text-xs text-neutral-500 hover:text-[#82181A] font-semibold cursor-pointer'>
                  Cancelar edição
                </button>
              )}
            </div>
            <form onSubmit={handleCriarQuestao} className='space-y-4'>
              <input type="number" min="1" max="10" placeholder="Número (1-10)" value={numero} onChange={(e) => setNumero(e.target.value)} required
                className="w-full md:w-48 rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />

              <div>
                <p className='text-sm font-medium text-neutral-700 mb-1'>Instrução da Questão</p>
                <RichTextEditor value={instrucao} onChange={setInstrucao} placeholder="Digite a instrução da questão..." />
              </div>

              <div>
                <p className='text-sm font-medium text-neutral-700 mb-1'>Comentário (liberado após finalizar)</p>
                <RichTextEditor value={comentario} onChange={setComentario} placeholder="Comentário sobre a questão..." />
              </div>

              <div>
                <p className='text-sm font-medium text-neutral-700 mb-2'>Alternativas</p>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  {alternativas.map((alt, i) => (
                    <div key={alt.letra} className='flex items-center gap-2'>
                      <span className='font-bold text-sm w-5 text-[#82181A]'>{alt.letra}</span>
                      <input type="text" placeholder={`Texto ${alt.letra}`} value={alt.texto} onChange={(e) => {
                        const a = [...alternativas]; a[i].texto = e.target.value; setAlternativas(a)
                      }} required className="flex-1 rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />
                      <input type="number" step="0.1" placeholder="Peso" value={alt.peso} onChange={(e) => {
                        const a = [...alternativas]; a[i].peso = parseFloat(e.target.value) || 0; setAlternativas(a)
                      }} required className="w-20 rounded-lg border border-neutral-300 p-3 text-sm outline-none focus:border-[#82181A]" />
                    </div>
                  ))}
                </div>
              </div>

              <BlocoEditor blocos={documentos} setBlocos={setDocumentos} />

              {erro && <p className="text-red-600 text-sm">{erro}</p>}
              <div className='flex items-center gap-3'>
                <button type="submit" disabled={salvando} className="bg-[#82181A] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#631214] disabled:opacity-50 cursor-pointer">
                  {salvando ? 'Salvando...' : editandoId ? 'Atualizar Questão' : 'Criar Questão'}
                </button>
                {editandoId && (
                  <button type="button" onClick={limparForm} className='text-sm text-neutral-500 hover:text-[#82181A] font-semibold cursor-pointer'>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className='bg-white rounded-xl shadow-md p-6'>
            <h2 className='text-lg font-bold text-[#82181A] mb-4'>Questões ({questoes.length}/10)</h2>
            {questoes.length === 0 ? (
              <p className='text-neutral-500 text-sm'>Nenhuma questão cadastrada.</p>
            ) : (
              <div className='space-y-2'>
                {questoes.map((q) => (
                  <div key={q.id} className={`border rounded-lg p-4 flex items-center justify-between ${editandoId === q.id ? 'border-[#82181A] bg-[#82181A]/5' : 'border-neutral-200'}`}>
                    <div className='flex-1 min-w-0 mr-4'>
                      <p className='font-semibold text-sm'>Questão {q.numero}</p>
                      <p className='text-xs text-neutral-500 truncate'>{q.instrucao?.replace(/<[^>]*>/g, '').substring(0, 80)}...</p>
                    </div>
                    <div className='flex items-center gap-2 shrink-0'>
                      <button onClick={() => handleEditarQuestao(q)} className='text-[#82181A] text-xs font-semibold hover:underline cursor-pointer'>Editar</button>
                      <button onClick={() => handleDeletarQuestao(q.id)} className='text-red-600 text-xs font-semibold hover:underline cursor-pointer'>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className={`${poppins.className} w-full min-h-screen flex items-center justify-center`}><p className="text-[#82181A] text-lg">Carregando...</p></div>}>
      <QuestoesForm />
    </Suspense>
  )
}
