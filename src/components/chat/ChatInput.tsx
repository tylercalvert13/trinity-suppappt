import { useState, KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSend: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'currency' | 'tel' | 'zip';
  disabled?: boolean;
}

const ChatInput = ({ onSend, placeholder = 'Type a message...', type = 'text', disabled = false }: ChatInputProps) => {
  const [value, setValue] = useState('');

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInputType = () => {
    if (type === 'number' || type === 'currency') return 'number';
    if (type === 'tel') return 'tel';
    return 'text';
  };

  const getInputMode = () => {
    if (type === 'number' || type === 'currency' || type === 'zip') return 'numeric' as const;
    if (type === 'tel') return 'tel' as const;
    return 'text' as const;
  };

  return (
    <div className="sticky bottom-0 z-40 bg-[#f6f6f6] border-t border-gray-200 px-3 py-2 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2 max-w-2xl mx-auto">
        {type === 'currency' && (
          <span className="text-lg text-gray-500 font-medium pl-1">$</span>
        )}
        <input
          type={getInputType()}
          inputMode={getInputMode()}
          value={value}
          onChange={(e) => {
            let v = e.target.value;
            if (type === 'zip') v = v.replace(/\D/g, '').slice(0, 5);
            setValue(v);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-white rounded-full px-4 py-3 text-[15px] border border-gray-300 focus:outline-none focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]"
          min={type === 'number' || type === 'currency' ? '0' : undefined}
          step={type === 'currency' ? '0.01' : undefined}
          maxLength={type === 'zip' ? 5 : undefined}
          autoFocus
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="w-9 h-9 rounded-full bg-[#007AFF] text-white flex items-center justify-center flex-shrink-0 disabled:bg-gray-300 transition-colors active:scale-95"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
