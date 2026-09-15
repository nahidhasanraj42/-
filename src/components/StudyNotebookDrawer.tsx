import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Trash2,
  Edit3,
  Save,
  Download,
  Plus,
  Search,
  Volume2,
  Copy,
  Check,
  Tag,
  Printer,
  FileText
} from 'lucide-react';
import { NotebookItem } from '../types';
import { speakText, triggerFileDownload } from '../utils/audioUtils';
import { useBackHandler } from '../utils/backNavigation';

interface StudyNotebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NotebookItem[];
  onUpdateNote: (note: NotebookItem) => void;
  onDeleteNote: (id: string) => void;
  onAddNote: (note: Omit<NotebookItem, 'id' | 'timestamp'>) => void;
  onClearAllNotes: () => void;
}

export const StudyNotebookDrawer: React.FC<StudyNotebookDrawerProps> = ({
  isOpen,
  onClose,
  notes,
  onUpdateNote,
  onDeleteNote,
  onAddNote,
  onClearAllNotes,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Note Modal / Form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<NotebookItem['category']>('vocabulary');

  // Handle device back button when adding note modal is open
  useBackHandler(
    () => {
      setIsAddingNew(false);
      return true;
    },
    70,
    isOpen && isAddingNew,
    'notebook-add-note-modal'
  );

  // Handle device back button when editing note
  useBackHandler(
    () => {
      setEditingId(null);
      return true;
    },
    65,
    isOpen && editingId !== null && !isAddingNew,
    'notebook-editing-note'
  );

  // Handle device back button to close drawer
  useBackHandler(
    () => {
      onClose();
      return true;
    },
    50,
    isOpen && !isAddingNew && editingId === null,
    'notebook-drawer'
  );

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'সকল নোট', count: notes.length },
    { id: 'vocabulary', label: '📖 শব্দার্থ ও ভোকাবুলারি', count: notes.filter((n) => n.category === 'vocabulary').length },
    { id: 'grammar', label: '📐 ব্যাকরণ ও রুলস', count: notes.filter((n) => n.category === 'grammar').length },
    { id: 'phrase', label: '💬 গুরুত্বপূর্ণ বাক্য', count: notes.filter((n) => n.category === 'phrase').length },
    { id: 'study_notes', label: '📝 ব্যক্তিগত নোট', count: notes.filter((n) => n.category === 'study_notes').length },
  ];

  const filteredNotes = notes.filter((item) => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.originalText && item.originalText.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleStartEdit = (note: NotebookItem) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSaveEdit = (note: NotebookItem) => {
    onUpdateNote({
      ...note,
      title: editTitle.trim() || note.title,
      content: editContent.trim() || note.content,
    });
    setEditingId(null);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    onAddNote({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
    });

    setNewTitle('');
    setNewContent('');
    setIsAddingNew(false);
  };

  const handleCopyNote = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download whole notebook as text file
  const handleDownloadNotebook = () => {
    if (notes.length === 0) return;

    let content = `# 📓 আমার স্টাডি নোটবুক (Multilingual AI Study Notebook)\n`;
    content += `তৈরির তারিখ: ${new Date().toLocaleDateString('bn-BD')}\n`;
    content += `মোট সংগৃহীত নোট: ${notes.length}টি\n`;
    content += `====================================================\n\n`;

    notes.forEach((note, index) => {
      content += `[${index + 1}] ${note.title} (${note.category.toUpperCase()})\n`;
      if (note.originalText) {
        content += `মূল টেক্সট: ${note.originalText}\n`;
      }
      content += `নোট/অনুবাদ: ${note.content}\n`;
      content += `তারিখ: ${new Date(note.timestamp).toLocaleString('bn-BD')}\n`;
      content += `----------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerFileDownload(blob, `আমার_স্টাডি_নোটবুক_${Date.now()}.txt`);
  };

  // Print notebook
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-bengali flex items-center gap-2">
                <span>আমার স্টাডি নোটবুক</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-700 text-emerald-100">
                  {notes.length}
                </span>
              </h2>
              <p className="text-xs text-emerald-200 font-bengali">
                পড়ার সময় যেকোনো লেখা সিলেক্ট করে সেভ করুন, এডিট করুন ও ডাউনলোড করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadNotebook}
              disabled={notes.length === 0}
              className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 hover:text-white transition-colors disabled:opacity-50"
              title="সম্পূর্ণ নোটবুক ডাউনলোড করুন (.txt)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={notes.length === 0}
              className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 hover:text-white transition-colors disabled:opacity-50"
              title="প্রিন্ট করুন"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search & Add Note */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নোটবুকের মধ্যে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন নোট লিখুন</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-2 border-b border-slate-100 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeCategory === cat.id
                  ? 'bg-emerald-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === cat.id ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Create New Note Drawer Form */}
        {isAddingNew && (
          <form onSubmit={handleCreateNote} className="p-4 bg-emerald-50/60 border-b border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 font-bengali">নতুন নোট বা শব্দার্থ যোগ করুন</span>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                বাতিল
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="নোটের শিরোনাম বা মূল শব্দ..."
                required
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="vocabulary">📖 শব্দার্থ ও ভোকাবুলারি</option>
                <option value="grammar">📐 ব্যাকরণ ও রুলস</option>
                <option value="phrase">💬 গুরুত্বপূর্ণ বাক্য</option>
                <option value="study_notes">📝 সাধারণ স্টাডি নোট</option>
              </select>
            </div>

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="ব্যাখ্যা, অর্থ বা বিস্তারিত নোট লিখুন..."
              rows={3}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>নোটবুকে সেভ করুন</span>
              </button>
            </div>
          </form>
        )}

        {/* Note List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
              <p className="text-sm font-semibold font-bengali text-slate-600">কোনো নোট পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 font-bengali">
                অ্যাপে যেকোনো লেখা সিলেক্ট করলেই ড্রপ মেনু আসবে, সেখান থেকে এক ক্লিকে নোটবুকে জমা রাখতে পারবেন।
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isEditing = editingId === note.id;

              return (
                <div
                  key={note.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:border-emerald-200 transition-all space-y-2.5"
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-bold rounded-lg border border-emerald-300 focus:outline-none"
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-300 focus:outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(note)}
                          className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>আপডেট</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {note.category === 'vocabulary' && 'শব্দার্থ'}
                            {note.category === 'grammar' && 'ব্যাকরণ'}
                            {note.category === 'phrase' && 'বাক্য'}
                            {note.category === 'study_notes' && 'নোট'}
                            {note.category === 'conversation' && 'কথোপকথন'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 font-bengali">
                            {note.title}
                          </h4>
                        </div>

                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(note.timestamp).toLocaleDateString('bn-BD', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      {note.originalText && (
                        <div className="p-2 rounded-xl bg-slate-50 text-xs text-slate-600 font-arabic border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                            মূল টেক্সট
                          </span>
                          {note.originalText}
                        </div>
                      )}

                      <p className="text-xs text-slate-700 font-bengali whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => speakText(note.content, 'bn')}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 flex items-center gap-1 text-xs"
                            title="উচ্চারণ শুনুন"
                          >
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>শুনুন</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyNote(`${note.title}\n${note.content}`, note.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center gap-1 text-xs"
                            title="কপি করুন"
                          >
                            {copiedId === note.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">কপি হয়েছে</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>কপি</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(note)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                            title="এডিট করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNote(note.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & Clear all */}
        {notes.length > 0 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span className="font-bengali">
              মোট নোট: <strong>{notes.length}</strong> টি (ব্রাউজারে সংরক্ষিত)
            </span>
            <button
              type="button"
              onClick={onClearAllNotes}
              className="text-xs text-red-600 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>সব মুছুন</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
