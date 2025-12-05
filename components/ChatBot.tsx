// components/ChatBot.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, X, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ----------------------------------------------------------------------
// ✅ 타입 정의 (Props)
// ----------------------------------------------------------------------

// [수정] any 타입을 대체할 구체적인 일정 인터페이스 정의
export interface DayItinerary {
  day: number;
  theme: string;
  schedule: string[];
}

interface ChatBotProps {
  cityName: string;
  currentItinerary: DayItinerary[]; // any[] 대신 구체적인 타입 사용
  onUpdateItinerary: (newItinerary: DayItinerary[]) => void;
}

interface Message {
  role: "user" | "ai";
  text: string;
}

export default function ChatBot({ cityName, currentItinerary, onUpdateItinerary }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 초기 메시지
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "ai", 
      text: `안녕하세요! ${cityName} 여행 일정은 마음에 드시나요? 수정하고 싶은 부분이 있다면 편하게 말씀해 주세요.\n(예: "2일 차는 쇼핑 위주로 바꿔줘", "너무 빡빡해, 여유롭게 수정해줘")` 
    }
  ]);

  // 스크롤 자동 이동용 Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // ----------------------------------------------------------------------
  // 🚀 메시지 전송 및 API 호출 핸들러
  // ----------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");
    
    // 1. 사용자 메시지 UI에 즉시 추가
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      // 2. API 호출 (일정 수정 요청)
      // 실제 API 경로는 'app/api/city/modify/route.ts' 입니다.
      const res = await fetch("/api/city/modify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cityName,
          currentItinerary,
          userRequest: userMsg,
        }),
      });

      if (!res.ok) {
        throw new Error("API call failed");
      }

      const data = await res.json();

      if (data.itinerary) {
        // 3. 성공 시: 부모 컴포넌트의 데이터 업데이트 & 성공 메시지 표시
        onUpdateItinerary(data.itinerary); 
        setMessages((prev) => [
          ...prev, 
          { role: "ai", text: "요청하신 대로 일정을 수정했습니다! 상단 일정표가 업데이트되었습니다. 더 수정할 부분이 있나요? 😊" }
        ]);
      } else {
        throw new Error("수정된 일정이 없습니다.");
      }
    } catch (error) {
      console.error("ChatBot Error:", error);
      setMessages((prev) => [
        ...prev, 
        { role: "ai", text: "죄송합니다. 일정을 수정하는 도중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요. 😥" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. 챗봇 토글 버튼 (화면 우측 하단 고정) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl"
        aria-label="AI 일정 수정 챗봇 열기"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
      </motion.button>

      {/* 2. 채팅창 패널 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[90vw] max-w-[380px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
          >
            {/* 헤더 */}
            <div className="bg-indigo-600 px-4 py-4 text-white">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">AI 여행 비서</h3>
                  <p className="text-[10px] opacity-80">실시간으로 일정을 수정해드립니다</p>
                </div>
              </div>
            </div>

            {/* 메시지 목록 영역 */}
            <div className="h-80 overflow-y-auto bg-gray-50 p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex max-w-[85%] items-start gap-2 ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* 아이콘 */}
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user" ? "bg-indigo-100 text-indigo-600" : "bg-purple-100 text-purple-600"
                    }`}>
                      {msg.role === "user" ? <User size={14} /> : <Bot size={14} />}
                    </div>

                    {/* 말풍선 */}
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white text-gray-700 border border-gray-100 rounded-tl-none"
                      }`}
                    >
                      {msg.text.split('\n').map((line, i) => (
                        <span key={i}>
                          {line}
                          {i < msg.text.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {/* 로딩 인디케이터 (AI가 생각 중일 때) */}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                      <Bot size={14} />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100 rounded-tl-none">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 delay-100"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400 delay-200"></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <form onSubmit={handleSubmit} className="border-t border-gray-100 bg-white p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="수정사항을 입력하세요..."
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  aria-label="전송"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}