interface ChatButtonGroupProps {
  options: string[];
  onSelect: (option: string) => void;
  disabled?: boolean;
  selected?: string | null;
}

const ChatButtonGroup = ({ options, onSelect, disabled = false, selected = null }: ChatButtonGroupProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-3 ml-10 animate-in slide-in-from-bottom-2 duration-300">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => !disabled && onSelect(option)}
          disabled={disabled}
          className={`px-5 py-3 rounded-full text-[15px] font-medium transition-all ${
            selected === option
              ? 'bg-[#007AFF] text-white'
              : disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-[#007AFF] border border-[#007AFF] hover:bg-[#007AFF] hover:text-white active:scale-95'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
};

export default ChatButtonGroup;
