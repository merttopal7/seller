"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Image as TiptapImage } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { useEffect, useCallback, useState } from "react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Link2Off,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Minus,
  Type,
  Image as ImageIcon,
  Table2,
} from "lucide-react";

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      className={`h-8 px-2 flex items-center justify-center rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none ${
        active
          ? "bg-primary text-primary-foreground shadow-xs font-semibold scale-105"
          : "hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95"
      }`}
    >
      {children}
    </button>
  );
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder, className, error }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({
        placeholder: placeholder || "Write a detailed description...",
      }),
      TiptapImage.configure({
        allowBase64: true,
        HTMLAttributes: { class: "max-w-full h-auto rounded-lg my-4 shadow-xs border border-border" },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "w-full border-collapse my-4 border border-border" },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: { class: "border border-border bg-muted/30 px-3 py-2 text-left font-semibold text-xs" },
      }),
      TableCell.configure({
        HTMLAttributes: { class: "border border-border px-3 py-2 text-xs" },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rich-editor-content focus:outline-hidden min-h-[180px] max-h-[400px] overflow-y-auto px-5 py-4 prose prose-sm dark:prose-invert max-w-none",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange?.(html === "<p></p>" ? "" : html);
    },
  });

  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkInputOpen, setIsLinkInputOpen] = useState(false);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const incoming = value || "";
    if (current !== incoming && incoming !== "") {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  const openLinkInput = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    setLinkUrl(prev ?? "https://");
    setIsLinkInputOpen(true);
  }, [editor]);

  const saveCustomLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl.trim() === "" || linkUrl.trim() === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
    }
    setIsLinkInputOpen(false);
  }, [editor, linkUrl]);

  const [imageUrl, setImageUrl] = useState("");
  const [isImageInputOpen, setIsImageInputOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const insertImageFromUrl = useCallback(() => {
    if (!editor) return;
    if (imageUrl.trim() !== "" && imageUrl.trim() !== "https://") {
      editor.chain().focus().setImage({ src: imageUrl.trim() }).run();
    }
    setImageUrl("");
    setIsImageInputOpen(false);
  }, [editor, imageUrl]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editor) return;
    setIsUploadingImage(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      editor.chain().focus().setImage({ src: data.url }).run();
      setIsImageInputOpen(false);
    } catch {
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!editor) return null;

  const textLength = editor.getText().length;
  const wordCount = editor.getText().trim().split(/\s+/).filter(Boolean).length;

  return (
    <div
      className={`border rounded-2xl overflow-hidden bg-card transition-all duration-300 shadow-xs flex flex-col ${
        error 
          ? "border-destructive ring-2 ring-destructive/10" 
          : "border-border focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10"
      } ${className ?? ""}`}
    >
      {/* Segmented Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-border bg-muted/20 sticky top-0 z-10 backdrop-blur-xs select-none">
        
        {/* Undo/Redo Palette */}
        <div className="flex items-center gap-1 bg-background/50 border rounded-xl p-1 shadow-2xs">
          <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Text Formats & Headings Palette */}
        <div className="flex items-center gap-1 bg-background/50 border rounded-xl p-1 shadow-2xs">
          <ToolbarButton
            title="Normal Text"
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive("paragraph")}
          >
            <Type className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Styling Palette */}
        <div className="flex items-center gap-1 bg-background/50 border rounded-xl p-1 shadow-2xs">
          <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
            <Bold className="h-3.5 w-3.5 font-bold" />
          </ToolbarButton>
          <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
            <Strikethrough className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Lists & Layout Palette */}
        <div className="flex items-center gap-1 bg-background/50 border rounded-xl p-1 shadow-2xs">
          <ToolbarButton title="Bullet List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Numbered List" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Blockquote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Alignment Palette */}
        <div className="flex items-center gap-1 bg-background/50 border rounded-xl p-1 shadow-2xs">
          <ToolbarButton title="Align Left" onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align Center" onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align Right" onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Media & Table Palette */}
        <div className="flex items-center gap-1 bg-background/50 border rounded-xl p-1 shadow-2xs">
          <ToolbarButton
            title="Insert Image"
            onClick={() => setIsImageInputOpen((prev) => !prev)}
            active={isImageInputOpen}
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            title="Insert Table (3x3)"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            active={editor.isActive("table")}
          >
            <Table2 className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Link Palette */}
        <div className="flex items-center gap-1 bg-background/50 border rounded-xl p-1 shadow-2xs ml-auto sm:ml-0">
          <ToolbarButton title="Add Link" onClick={openLinkInput} active={editor.isActive("link")}>
            <Link2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Remove Link" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive("link")}>
            <Link2Off className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

      </div>

      {/* Custom Link Input Bar (Eliminating native JS prompt completely) */}
      {isLinkInputOpen && (
        <div className="flex items-center gap-2 p-2 border-b border-border bg-primary/5 animate-in slide-in-from-top-1 duration-200">
          <span className="text-xs font-semibold text-primary pl-2 flex items-center gap-1 shrink-0 select-none">
            <Link2 className="h-3.5 w-3.5" /> Link:
          </span>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveCustomLink();
              } else if (e.key === "Escape") {
                setIsLinkInputOpen(false);
              }
            }}
            placeholder="https://example.com"
            className="flex-1 h-8 px-3 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
            autoFocus
          />
          <button
            type="button"
            onClick={saveCustomLink}
            className="h-8 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all select-none cursor-pointer"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setIsLinkInputOpen(false)}
            className="h-8 px-3 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors select-none cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Custom Image Insertion Bar */}
      {isImageInputOpen && (
        <div className="flex flex-col sm:flex-row items-center gap-2 p-2 border-b border-border bg-primary/5 animate-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-2 flex-1 w-full">
            <span className="text-xs font-semibold text-primary pl-2 flex items-center gap-1 shrink-0 select-none">
              <ImageIcon className="h-3.5 w-3.5" /> Image URL:
            </span>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertImageFromUrl();
                } else if (e.key === "Escape") {
                  setIsImageInputOpen(false);
                }
              }}
              placeholder="https://example.com/image.jpg"
              className="flex-1 h-8 px-3 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={insertImageFromUrl}
              className="h-8 px-3 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              Add Link
            </button>
            <label className="h-8 px-3 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-border">
              {isUploadingImage ? "Uploading..." : "Upload File"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingImage}
                onChange={handleImageUpload}
              />
            </label>
            <button
              type="button"
              onClick={() => setIsImageInputOpen(false)}
              className="h-8 px-3 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Table Actions Bar */}
      {editor.isActive("table") && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-border bg-emerald-500/5 animate-in slide-in-from-top-1 duration-200 select-none">
          <span className="text-xs font-semibold text-emerald-600 pl-2 flex items-center gap-1 shrink-0">
            <Table2 className="h-3.5 w-3.5" /> Table Controls:
          </span>
          <div className="flex flex-wrap items-center gap-1 bg-background/50 border border-emerald-500/20 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="h-7 px-2 hover:bg-muted text-xs text-foreground rounded-lg transition-all cursor-pointer font-medium"
              title="Add Row Above"
            >
              Row ↑
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="h-7 px-2 hover:bg-muted text-xs text-foreground rounded-lg transition-all cursor-pointer font-medium"
              title="Add Row Below"
            >
              Row ↓
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="h-7 px-2 hover:bg-muted text-xs text-foreground rounded-lg transition-all cursor-pointer font-medium"
              title="Add Column Left"
            >
              Col ←
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="h-7 px-2 hover:bg-muted text-xs text-foreground rounded-lg transition-all cursor-pointer font-medium"
              title="Add Column Right"
            >
              Col →
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-background/50 border border-emerald-500/20 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              className="h-7 px-2 hover:bg-muted text-xs text-foreground rounded-lg transition-all cursor-pointer font-medium"
              title="Toggle Header Row"
            >
              Header Row
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-background/50 border border-emerald-500/20 rounded-xl p-1 shadow-2xs ml-auto">
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="h-7 px-2 hover:bg-red-50 hover:text-red-600 text-xs rounded-lg transition-all cursor-pointer font-medium"
              title="Delete Selected Row"
            >
              Del Row
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="h-7 px-2 hover:bg-red-50 hover:text-red-600 text-xs rounded-lg transition-all cursor-pointer font-medium"
              title="Delete Selected Column"
            >
              Del Col
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
              title="Delete Entire Table"
            >
              Delete Table
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="bg-background flex-1">
        <EditorContent editor={editor} />
      </div>

      {/* Premium Footer Bar (Word & Character Counter) */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/10 text-xs text-muted-foreground select-none">
        <div className="flex items-center gap-3">
          <span><strong>{wordCount}</strong> words</span>
          <span className="w-1 h-1 bg-border rounded-full" />
          <span><strong>{textLength}</strong> characters</span>
        </div>
        <div>
          {textLength > 9000 ? (
            <span className="text-destructive font-semibold">Approaching limit (Max 10,000)</span>
          ) : (
            <span>Max 10,000 characters</span>
          )}
        </div>
      </div>
    </div>
  );
}
