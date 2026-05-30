import { useEffect, ReactNode } from 'react';
import { X, Loader2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  submitColor?: 'blue' | 'red' | 'green';
  loading?: boolean;
}

const colorMap = {
  blue: 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50',
  red: 'bg-red-600 hover:bg-red-700 disabled:bg-red-600/50',
  green: 'bg-green-600 hover:bg-green-700 disabled:bg-green-600/50',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  onSubmit,
  submitLabel = 'Confirm',
  submitColor = 'blue',
  loading = false,
}: ModalProps) {
  // Close on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const renderFooter = () => {
    if (footer) return footer;
    if (onSubmit) {
      return (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-800"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${colorMap[submitColor]}`}
            disabled={loading}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl relative overflow-y-auto max-h-[90vh] animate-slide-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {onSubmit ? (
          <form onSubmit={onSubmit} className="flex-1 flex flex-col gap-4">
            <div className="flex-1 overflow-y-auto pr-1">{children}</div>
            {renderFooter()}
          </form>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 overflow-y-auto pr-1">{children}</div>
            {renderFooter()}
          </div>
        )}
      </div>
    </div>
  );
}
