import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Download,
  Upload,
  ClipboardPaste,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { ClassRoom, Student } from '../types';
import { exportStudentsToCSV } from '../utils/storage';
import { parseExcelOrCsvFile, parseExcelOrTextPasted } from '../utils/excel';

interface ClassManagementModalProps {
  isOpen: boolean;
  classes: ClassRoom[];
  activeClassId: string;
  onClose: () => void;
  onSelectClass: (classId: string) => void;
  onCreateClass: (name: string) => void;
  onRenameClass: (classId: string, newName: string) => void;
  onDeleteClass: (classId: string) => void;
  onAddStudent: (classId: string, name: string) => void;
  onEditStudent: (classId: string, studentId: string, newName: string) => void;
  onDeleteStudent: (classId: string, studentId: string) => void;
  onBulkAddStudents: (classId: string, names: string[]) => void;
}

export const ClassManagementModal: React.FC<ClassManagementModalProps> = ({
  isOpen,
  classes,
  activeClassId,
  onClose,
  onSelectClass,
  onCreateClass,
  onRenameClass,
  onDeleteClass,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
  onBulkAddStudents,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(activeClassId);
  const [newClassName, setNewClassName] = useState('');
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editClassNameInput, setEditClassNameInput] = useState('');

  // Student management state
  const [newStudentName, setNewStudentName] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editStudentNameInput, setEditStudentNameInput] = useState('');

  // Bulk paste state
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // File upload state
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileNotification, setFileNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Delete confirmations
  const [deleteClassConfirmId, setDeleteClassConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tìm lớp đang chọn trong modal
  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  // Danh sách học sinh nhận diện trước khi người dùng dán vào
  const recognizedPreviewNames = useMemo(() => {
    if (!pastedText.trim()) return [];
    return parseExcelOrTextPasted(pastedText);
  }, [pastedText]);

  if (!isOpen) return null;

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    onCreateClass(newClassName.trim());
    setNewClassName('');
    setIsCreatingClass(false);
  };

  const handleStartRenameClass = (cls: ClassRoom) => {
    setEditingClassId(cls.id);
    setEditClassNameInput(cls.name);
  };

  const handleSaveRenameClass = (classId: string) => {
    if (editClassNameInput.trim()) {
      onRenameClass(classId, editClassNameInput.trim());
    }
    setEditingClassId(null);
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !currentClass) return;
    onAddStudent(currentClass.id, newStudentName.trim());
    setNewStudentName('');
  };

  const handleSaveEditStudent = (studentId: string) => {
    if (editStudentNameInput.trim() && currentClass) {
      onEditStudent(currentClass.id, studentId, editStudentNameInput.trim());
    }
    setEditingStudentId(null);
  };

  const handleApplyPaste = () => {
    if (!pastedText.trim() || !currentClass) return;
    const names = recognizedPreviewNames;
    if (names.length > 0) {
      onBulkAddStudents(currentClass.id, names);
      setPastedText('');
      setShowPasteModal(false);
      setFileNotification({
        type: 'success',
        message: `Đã thêm thành công ${names.length} học sinh vào ${currentClass.name}!`,
      });
      setTimeout(() => setFileNotification(null), 4000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentClass) return;

    setIsProcessingFile(true);
    setFileNotification(null);

    try {
      const names = await parseExcelOrCsvFile(file);
      if (names.length > 0) {
        onBulkAddStudents(currentClass.id, names);
        setFileNotification({
          type: 'success',
          message: `Đã nhập thành công ${names.length} học sinh từ file "${file.name}"!`,
        });
      } else {
        setFileNotification({
          type: 'error',
          message: `Không tìm thấy cột tên học sinh hợp lệ trong file "${file.name}". Bạn có thể thử sao chép và dùng chức năng "Dán từ Excel".`,
        });
      }
    } catch (err) {
      console.error(err);
      setFileNotification({
        type: 'error',
        message: `Lỗi khi xử lý file "${file.name}". Vui lòng kiểm tra định dạng file Excel hoặc thử copy và dán trực tiếp.`,
      });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setFileNotification(null), 6000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative flex flex-col w-full max-w-4xl h-[90vh] max-h-[820px] overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Quản lý lớp học & Học sinh
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tạo lớp, nhập danh sách từ file Excel (.xlsx, .xls), CSV hoặc copy/paste trực tiếp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông báo kết quả tải file / dán danh sách */}
        {fileNotification && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              fileNotification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {fileNotification.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )}
              <span>{fileNotification.message}</span>
            </div>
            <button
              onClick={() => setFileNotification(null)}
              className="p-1 hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Content Area with Split Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Cột trái: Danh sách lớp học */}
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/30">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Danh sách lớp ({classes.length})
              </span>
              <button
                onClick={() => setIsCreatingClass(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm lớp</span>
              </button>
            </div>

            {/* Form tạo lớp mới */}
            {isCreatingClass && (
              <form
                onSubmit={handleCreateClassSubmit}
                className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/50"
              >
                <input
                  type="text"
                  placeholder="Ví dụ: Lớp 8A3..."
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingClass(false)}
                    className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Lưu
                  </button>
                </div>
              </form>
            )}

            {/* Danh sách các lớp */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {classes.map((cls) => {
                const isSelected = cls.id === (currentClass?.id || '');
                const isCurrentActive = cls.id === activeClassId;

                return (
                  <div
                    key={cls.id}
                    className={`group flex items-center justify-between p-2.5 rounded-xl text-sm transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {editingClassId === cls.id ? (
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <input
                          type="text"
                          value={editClassNameInput}
                          onChange={(e) => setEditClassNameInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRenameClass(cls.id)}
                          autoFocus
                          className="w-full px-2 py-1 text-xs rounded border border-blue-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                        <button
                          onClick={() => handleSaveRenameClass(cls.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="flex-1 cursor-pointer truncate"
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          onSelectClass(cls.id);
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{cls.name}</span>
                          {isCurrentActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded">
                              Đang chọn
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {cls.students.length} học sinh
                        </div>
                      </div>
                    )}

                    {/* Nút sửa/xóa lớp - Luôn hiển thị rõ ràng */}
                    {editingClassId !== cls.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRenameClass(cls);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Đổi tên lớp"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {classes.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteClassConfirmId(cls.id);
                            }}
                            className="p-1.5 text-rose-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors"
                            title="Xóa lớp này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cột phải: Quản lý học sinh của lớp đang chọn */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {currentClass ? (
              <>
                {/* Thanh công cụ lớp học */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/30 dark:bg-slate-900/40">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{currentClass.name}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {currentClass.students.length} học sinh
                        </span>
                      </h3>
                    </div>

                    {/* Nút Xóa lớp này ở thanh công cụ chính */}
                    {classes.length > 1 && (
                      <button
                        onClick={() => setDeleteClassConfirmId(currentClass.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg transition-colors"
                        title="Xóa lớp học đang chọn này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa lớp này</span>
                      </button>
                    )}
                  </div>

                  {/* Nhóm nút tác vụ: Dán Excel, Tải file Excel (.xlsx/.xls), Xuất CSV */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Nút 1: Dán từ Excel */}
                    <button
                      onClick={() => setShowPasteModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/70 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all shadow-xs"
                      title="Sao chép từ bảng Excel rồi dán nhanh vào đây"
                    >
                      <ClipboardPaste className="w-4 h-4" />
                      <span>Dán từ Excel</span>
                    </button>

                    {/* Nút 2: Tải file Excel (.xlsx, .xls) hoặc CSV */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessingFile}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all shadow-xs disabled:opacity-50"
                      title="Chọn file Excel (.xlsx, .xls) hoặc file CSV có sẵn trên máy tính"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>{isProcessingFile ? 'Đang đọc file...' : 'Tải file Excel / CSV'}</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx, .xls, .csv, .tsv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    {/* Nút 3: Xuất danh sách */}
                    <button
                      onClick={() => exportStudentsToCSV(currentClass.name, currentClass.students)}
                      disabled={currentClass.students.length === 0}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
                      title="Tải về danh sách học sinh ra file CSV (chuẩn tiếng Việt Excel)"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Xuất CSV</span>
                    </button>
                  </div>
                </div>

                {/* Form thêm từng học sinh */}
                <form
                  onSubmit={handleAddStudentSubmit}
                  className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Nhập họ và tên học sinh (VD: Nguyễn Văn An)..."
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newStudentName.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm</span>
                  </button>
                </form>

                {/* Danh sách học sinh */}
                <div className="flex-1 overflow-y-auto p-4">
                  {currentClass.students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-56 text-center text-slate-400 p-6">
                      <FileSpreadsheet className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                        Lớp {currentClass.name} chưa có học sinh
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Bạn có thể nhấn <strong>"Tải file Excel / CSV"</strong> để tải file danh sách từ máy, hoặc bấm <strong>"Dán từ Excel"</strong> để copy/paste nhanh.
                      </p>
                      <div className="flex gap-3 mt-5">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải file Excel (.xlsx)</span>
                        </button>
                        <button
                          onClick={() => setShowPasteModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          <ClipboardPaste className="w-3.5 h-3.5" />
                          <span>Dán từ Excel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentClass.students.map((student, idx) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 flex-1 mr-2 min-w-0">
                            <span className="w-8 shrink-0 text-xs font-bold text-slate-400">
                              #{idx + 1}
                            </span>
                            {editingStudentId === student.id ? (
                              <input
                                type="text"
                                value={editStudentNameInput}
                                onChange={(e) => setEditStudentNameInput(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === 'Enter' && handleSaveEditStudent(student.id)
                                }
                                autoFocus
                                className="w-full px-2 py-1 text-sm rounded border border-blue-400 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={student.name}>
                                {student.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {editingStudentId === student.id ? (
                              <button
                                onClick={() => handleSaveEditStudent(student.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                title="Lưu"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingStudentId(student.id);
                                  setEditStudentNameInput(student.name);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                                title="Sửa tên"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => onDeleteStudent(currentClass.id, student.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">Chưa chọn lớp nào</div>
            )}
          </div>
        </div>

        {/* Modal Dán danh sách từ Excel có Xem trước (Live Preview) */}
        {showPasteModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-xl p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <ClipboardPaste className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Dán danh sách từ Excel / Word
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tự động gộp cột [Họ đệm] + [Tên] và bỏ số thứ tự
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPasteModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Hướng dẫn ngắn gọn */}
              <div className="my-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  Trong file Excel, bạn hãy <strong>bôi đen cột Họ và Tên</strong> (hoặc cả bảng) rồi nhấn <strong>Ctrl + C</strong>, sau đó nhấn <strong>Ctrl + V</strong> dán vào ô bên dưới.
                </span>
              </div>

              {/* Ô nhập văn bản */}
              <div className="flex-1 min-h-[160px] flex flex-col mb-3">
                <textarea
                  rows={6}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Dán nội dung từ Excel vào đây...&#10;Ví dụ:&#10;1  Nguyễn Văn An&#10;2  Trần Thị Bình&#10;3  Lê Minh Châu..."
                  autoFocus
                  className="w-full flex-1 p-3 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
                />
              </div>

              {/* Vùng xem trước kết quả nhận diện (Live Preview) */}
              {pastedText.trim() && (
                <div className="mb-4 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 max-h-36 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                      ✓ Đã nhận diện được: {recognizedPreviewNames.length} học sinh
                    </span>
                  </div>

                  {recognizedPreviewNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {recognizedPreviewNames.slice(0, 15).map((name, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-blue-200 dark:border-blue-800 font-medium"
                        >
                          {name}
                        </span>
                      ))}
                      {recognizedPreviewNames.length > 15 && (
                        <span className="px-2 py-0.5 text-xs text-blue-600 dark:text-blue-400 font-medium">
                          + {recognizedPreviewNames.length - 15} em khác...
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      Chưa nhận diện được tên hợp lệ từ đoạn văn bản trên. Vui lòng kiểm tra lại.
                    </p>
                  )}
                </div>
              )}

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowPasteModal(false)}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleApplyPaste}
                  disabled={recognizedPreviewNames.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl shadow-md shadow-blue-600/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Thêm {recognizedPreviewNames.length > 0 ? `${recognizedPreviewNames.length} học sinh` : ''} vào lớp
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup xác nhận xóa lớp */}
        {deleteClassConfirmId && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 mx-auto mb-3">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Xác nhận xóa lớp học này?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Toàn bộ danh sách học sinh và lịch sử của lớp này sẽ bị xóa. Thao tác này không thể hoàn tác!
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteClassConfirmId(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    onDeleteClass(deleteClassConfirmId);
                    setDeleteClassConfirmId(null);
                  }}
                  className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
