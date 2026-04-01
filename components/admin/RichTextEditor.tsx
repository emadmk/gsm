'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Youtube from '@tiptap/extension-youtube'
import CharacterCount from '@tiptap/extension-character-count'
import Color from '@tiptap/extension-color'
import { TextStyle } from '@tiptap/extension-text-style'
import { useEffect, useCallback, useState, useRef } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  AlignRight,
  AlignCenter,
  AlignLeft,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Braces,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  PlayCircle as YoutubeIcon,
  Table as TableIcon,
  RemoveFormatting,
  Undo2,
  Redo2,
  Palette,
  Type,
} from 'lucide-react'

interface RichTextEditorProps {
  content?: string
  value?: string
  onChange: (html: string) => void
  placeholder?: string
}

const PRESET_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#991b1b', '#9a3412', '#854d0e', '#166534', '#115e59',
  '#1e40af', '#3730a3', '#5b21b6', '#9d174d', '#9f1239',
]

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded-md transition-all duration-150 relative
        ${
          isActive
            ? 'bg-primary-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  )
}

function ToolbarSeparator() {
  return <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
}

function ColorPicker({
  editor,
}: {
  editor: ReturnType<typeof useEditor>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!editor) return null

  const currentColor = editor.getAttributes('textStyle').color || '#000000'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="رنگ متن"
        className="p-1.5 rounded-md transition-all duration-150 text-gray-600 hover:bg-gray-200 hover:text-gray-900 cursor-pointer flex items-center gap-0.5"
      >
        <Palette className="w-4 h-4" />
        <div
          className="w-4 h-1 rounded-sm"
          style={{ backgroundColor: currentColor }}
        />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2 w-[180px]">
          <div className="grid grid-cols-5 gap-1">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  editor.chain().focus().setColor(color).run()
                  setOpen(false)
                }}
                className={`w-7 h-7 rounded border-2 transition-transform hover:scale-110 ${
                  currentColor === color
                    ? 'border-primary-500 scale-110'
                    : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetColor().run()
              setOpen(false)
            }}
            className="mt-2 w-full text-xs text-gray-500 hover:text-gray-700 py-1 text-center"
          >
            حذف رنگ
          </button>
        </div>
      )}
    </div>
  )
}

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const addImage = useCallback(() => {
    const url = window.prompt('آدرس تصویر را وارد کنید:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('آدرس لینک را وارد کنید:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run()
  }, [editor])

  const addYoutube = useCallback(() => {
    const url = window.prompt('آدرس ویدیوی یوتیوب را وارد کنید:')
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }, [editor])

  const insertTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }, [editor])

  return (
    <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
      {/* Row 1 */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="بازگردانی (Undo)"
        >
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="بازانجام (Redo)"
        >
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="بولد"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="ایتالیک"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="زیرخط"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="خط‌خورده"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive('heading', { level: 1 })}
          title="تیتر ۱"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive('heading', { level: 2 })}
          title="تیتر ۲"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive('heading', { level: 3 })}
          title="تیتر ۳"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          isActive={editor.isActive('heading', { level: 4 })}
          title="تیتر ۴"
        >
          <Heading4 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ColorPicker editor={editor} />
      </div>

      {/* Row 2 */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-gray-100">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="چین‌ش راست"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="چینش وسط"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="چینش چپ"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="چینش تراز"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="لیست نشانه‌دار"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="لیست شماره‌دار"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="نقل قول"
        >
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title="کد خطی"
        >
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="بلوک کد"
        >
          <Braces className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="خط افقی"
        >
          <Minus className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Row 3 */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        <ToolbarButton
          onClick={addLink}
          isActive={editor.isActive('link')}
          title="لینک"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="تصویر">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={addYoutube} title="ویدیوی یوتیوب">
          <YoutubeIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={insertTable} title="جدول ۳×۳">
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="پاک‌سازی قالب‌بندی"
        >
          <RemoveFormatting className="w-4 h-4" />
        </ToolbarButton>
      </div>
    </div>
  )
}

export default function RichTextEditor({
  content,
  value,
  onChange,
  placeholder = 'محتوای مطلب را وارد کنید...',
}: RichTextEditorProps) {
  const initialContent = content ?? value ?? ''

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl my-4 max-w-full h-auto mx-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-500 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'right',
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse w-full my-4',
        },
      }),
      TableRow,
      TableCell,
      TableHeader,
      Youtube.configure({
        HTMLAttributes: {
          class: 'w-full rounded-xl my-4',
        },
        width: 640,
        height: 360,
      }),
      CharacterCount,
      TextStyle,
      Color,
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'post-content prose prose-sm max-w-none min-h-[400px] p-4 focus:outline-none',
        dir: 'rtl',
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML())
    },
  })

  // Sync external content changes
  useEffect(() => {
    const incoming = content ?? value ?? ''
    if (editor && incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [content, value]) // eslint-disable-line react-hooks/exhaustive-deps

  const wordCount =
    editor?.storage.characterCount?.words?.() ?? 0
  const charCount =
    editor?.storage.characterCount?.characters?.() ?? 0

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {editor && <Toolbar editor={editor} />}
      <div className="relative">
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        <div className="flex gap-4">
          <span>{wordCount.toLocaleString('fa-IR')} کلمه</span>
          <span>{charCount.toLocaleString('fa-IR')} کاراکتر</span>
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: right;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .ProseMirror th,
        .ProseMirror td {
          border: 1px solid #d1d5db;
          padding: 0.5rem 0.75rem;
          text-align: right;
          min-width: 80px;
        }
        .ProseMirror th {
          background-color: #f3f4f6;
          font-weight: 600;
        }
        .ProseMirror .selectedCell {
          background-color: rgba(25, 123, 255, 0.1);
        }
        .ProseMirror iframe {
          width: 100%;
          border-radius: 0.75rem;
          margin: 1rem 0;
          aspect-ratio: 16 / 9;
        }
        .ProseMirror img {
          cursor: pointer;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 2px solid rgb(25, 123, 255);
          border-radius: 0.75rem;
        }
      `}</style>
    </div>
  )
}
