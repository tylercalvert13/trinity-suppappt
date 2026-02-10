const TypingIndicator = () => {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        HH
      </div>
      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
