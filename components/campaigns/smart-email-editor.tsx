'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Undo2,
  Redo2,
} from 'lucide-react';

interface SmartEmailEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function SmartEmailEditor({
  content,
  onChange,
  placeholder = 'Start typing your email...',
}: SmartEmailEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return <div className="p-4 text-center text-neutral-500">Loading editor...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex gap-1 p-2 border-b bg-neutral-50 flex-wrap">
        <Button
          variant={editor.isActive('bold') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('italic') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px bg-neutral-200" />

        <Button
          variant={editor.isActive('bulletList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={editor.isActive('orderedList') ? 'default' : 'outline'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px bg-neutral-200" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) {
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            }
          }}
        >
          <Link2 className="h-4 w-4" />
        </Button>

        <div className="w-px bg-neutral-200" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="flex-1 overflow-auto p-4"
        style={{
          border: '1px solid #e5e7eb',
          borderTop: 'none',
          minHeight: '300px',
        }}
      />
    </div>
  );
}
