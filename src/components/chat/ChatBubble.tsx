import { ReactNode } from 'react';

interface ChatBubbleProps {
  sender: 'bot' | 'user';
  children: ReactNode;
  showAvatar?: boolean;
  animate?: boolean;
}

const ChatBubble = ({ sender, children, showAvatar = true, animate = true }: ChatBubbleProps) => {
  const isBot = sender === 'bot';

  return (
    <div
      className={`flex items-end gap-2 mb-3 ${isBot ? 'justify-start' : 'justify-end'} ${animate ? 'animate-in slide-in-from-bottom-2 duration-300' : ''}`}
    >
      {isBot && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-[#007AFF] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          HH
        </div>
      )}
      {isBot && !showAvatar && <div className="w-8 flex-shrink-0" />}
      <div
        className={`max-w-[80%] px-4 py-2.5 text-[15px] leading-relaxed ${
          isBot
            ? 'bg-white text-gray-900 rounded-2xl rounded-bl-md shadow-sm'
            : 'bg-[#007AFF] text-white rounded-2xl rounded-br-md'
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default ChatBubble;
