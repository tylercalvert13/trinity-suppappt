const ChatHeader = () => {
  return (
    <div className="sticky top-0 z-50 bg-[#f6f6f6] border-b border-gray-200 px-4 py-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        HH
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-base">Trinity Health & Wealth</p>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-500">Online now</span>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
