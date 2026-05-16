import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "../components/Toast";
import { useIsMobile } from "../hooks/useIsMobile";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, List, ListOrdered, Quote, ImageIcon, Minus, Undo, Redo, Code } from "lucide-react";
import api from "../api/client";

function MenuBar({ editor }) {
  if (!editor) return null;

  const btnStyle = (active) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    background: active ? "#dbeafe" : "none",
    color: active ? "#1a4a8a" : "#555",
    border: "none",
    cursor: "pointer",
  });

  const sep = (
    <div style={{ width: 1, height: 22, background: "#d4d4d4", margin: "0 4px", alignSelf: "center" }} />
  );

  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: 2,
      padding: "8px 12px",
      borderBottom: "1px solid #d4d4d4",
      background: "#fff",
      position: "sticky",
      top: 0,
      zIndex: 10,
    }}>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} style={btnStyle(editor.isActive("heading", { level: 1 }))} title="Böyük başlıq"><Heading1 size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btnStyle(editor.isActive("heading", { level: 2 }))} title="Orta başlıq"><Heading2 size={18} /></button>
      {sep}
      <button onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive("bold"))} title="Qalın"><Bold size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive("italic"))} title="Kursiv"><Italic size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} style={btnStyle(editor.isActive("underline"))} title="Altxətt"><UnderlineIcon size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleCode().run()} style={btnStyle(editor.isActive("code"))} title="Kod"><Code size={18} /></button>
      {sep}
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={btnStyle(editor.isActive("bulletList"))} title="Siyahı"><List size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btnStyle(editor.isActive("orderedList"))} title="Nömrəli siyahı"><ListOrdered size={18} /></button>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btnStyle(editor.isActive("blockquote"))} title="Sitat"><Quote size={18} /></button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()} style={btnStyle(false)} title="Xətt"><Minus size={18} /></button>
      <button onClick={() => { const url = prompt("Şəkil URL:"); if (url) editor.chain().focus().setImage({ src: url }).run(); }} style={btnStyle(false)} title="Şəkil"><ImageIcon size={18} /></button>
      {sep}
      <button onClick={() => editor.chain().focus().undo().run()} style={btnStyle(false)} title="Geri al"><Undo size={18} /></button>
      <button onClick={() => editor.chain().focus().redo().run()} style={btnStyle(false)} title="İrəli al"><Redo size={18} /></button>
    </div>
  );
}

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image,
      Placeholder.configure({ placeholder: "Məqalənizi buradan yazmağa başlayın..." }),
    ],
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-6",
      },
    },
  });

  useEffect(() => {
    if (id && editor) {
      api.get(`/articles/${id}`).then((res) => {
        setTitle(res.data.title);
        setSubtitle(res.data.subtitle || "");
        setCoverImage(res.data.cover_image || "");
        editor.commands.setContent(res.data.content);
      }).catch(() => navigate("/feed"));
    }
  }, [id, editor]);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setCoverImage(res.data.url);
    } catch (err) { toast.error("Şəkil yüklənmədi"); }
    setUploading(false);
  };

  const handlePublish = async () => {
    if (!title.trim() || !editor?.getHTML()) return;
    setSaving(true);
    try {
      const data = { title: title.trim(), subtitle: subtitle.trim() || null, content: editor.getHTML(), cover_image: coverImage || null };
      if (id) {
        await api.put(`/articles/${id}`, data);
        navigate(`/article/${id}`);
      } else {
        const res = await api.post("/articles", data);
        navigate(`/article/${res.data.id}`);
      }
    } catch (err) { toast.error(err.response?.data?.detail || "Xəta baş verdi"); }
    setSaving(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f2f2f2" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "12px 10px" : "20px 12px" }}>
        <div style={{ background: "#fff", border: "1px solid #d4d4d4", padding: isMobile ? "16px 14px" : "24px 28px" }}>

          {/* Nav row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button
              onClick={() => navigate(-1)}
              style={{ fontSize: 13, color: "#666", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Geri
            </button>
            <button
              onClick={handlePublish}
              disabled={!title.trim() || saving}
              style={{
                padding: "8px 22px",
                fontSize: 13, fontWeight: 600,
                color: "#fff",
                background: "#1a4a8a",
                border: "none",
                cursor: !title.trim() || saving ? "not-allowed" : "pointer",
                opacity: !title.trim() || saving ? 0.45 : 1,
              }}
            >
              {saving ? "Yüklənir..." : id ? "Yenilə" : "Dərc et"}
            </button>
          </div>

          {/* Cover image */}
          {coverImage ? (
            <div style={{ position: "relative", marginBottom: 20, overflow: "hidden" }}>
              <img src={coverImage} alt="cover" style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }} />
              <button
                onClick={() => setCoverImage("")}
                style={{
                  position: "absolute", top: 10, right: 10,
                  padding: "4px 10px", fontSize: 12,
                  background: "rgba(0,0,0,0.55)", color: "#fff",
                  border: "none", cursor: "pointer",
                }}
              >
                Sil
              </button>
            </div>
          ) : (
            <label style={{
              display: "flex", alignItems: "center", gap: 6,
              marginBottom: 20, cursor: "pointer",
              fontSize: 13, color: "#999",
            }}>
              <ImageIcon size={16} /> Üz qabığı şəkli əlavə et
              <input type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: "none" }} />
              {uploading && <span style={{ fontSize: 12, color: "#999", marginLeft: 6 }}>Yüklənir...</span>}
            </label>
          )}

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Başlıq"
            style={{
              width: "100%", fontSize: 28, fontWeight: 700, color: "#1a1a1a",
              background: "none", border: "none", outline: "none",
              marginBottom: 8, fontFamily: "Georgia, 'Times New Roman', serif",
              boxSizing: "border-box",
            }}
          />
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Alt başlıq (istəyə bağlı)"
            style={{
              width: "100%", fontSize: 17, color: "#666",
              background: "none", border: "none", outline: "none",
              marginBottom: 20, fontFamily: "Georgia, 'Times New Roman', serif",
              boxSizing: "border-box",
            }}
          />

          {/* Editor */}
          <div style={{ border: "1px solid #d4d4d4", overflow: "hidden" }}>
            <MenuBar editor={editor} />
            <div className="article-editor" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              <EditorContent editor={editor} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
