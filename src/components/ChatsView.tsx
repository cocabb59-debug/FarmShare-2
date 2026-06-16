import React, { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { ChatRoom, ChatMessage } from "../types";
import { MessageSquare, Send, User, Tractor, Inbox } from "lucide-react";

export const ChatsView: React.FC = () => {
  const {
    currentUser,
    chatRooms,
    activeChatMessages,
    sendMessage,
    listenToMessages,
    loadingRooms,
    login,
  } = useApp();

  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set message listeners when activeRoom changes
  useEffect(() => {
    if (!selectedRoom) return;

    const unsub = listenToMessages(selectedRoom.id);
    return () => {
      if (unsub) unsub();
    };
  }, [selectedRoom]);

  // Clean scrolling to bottom when message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChatMessages]);

  if (!currentUser) {
    return (
      <div className="bg-slate-50 border border-slate-150 rounded-3xl py-16 text-center max-w-lg mx-auto my-8 p-6 text-slate-500 text-xs">
        <MessageSquare className="h-12 w-12 text-slate-300 mx-auto animate-pulse mb-3" />
        <h3 className="font-extrabold text-slate-700 text-sm">실시간 일대일 채팅을 지원합니다</h3>
        <p className="text-slate-400 mt-1">Google 계정으로 로그인하여 소유주들과 일정을 바로 조율하세요.</p>
        <button
          onClick={login}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl mt-4 cursor-pointer"
        >
          Google 로그인
        </button>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !inputText.trim()) return;

    try {
      await sendMessage(selectedRoom.id, inputText);
      setInputText("");
    } catch (err: any) {
      alert("전송 실패: " + err.message);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs flex h-[75vh]" id="chats-view-root">
      {/* 1. Left Channel list columns */}
      <div className="w-1/3 border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <h2 className="font-black text-slate-800 text-sm">대화방 목록</h2>
          <span className="text-[10px] font-bold bg-slate-200/60 text-slate-600 px-2.5 py-0.5 rounded-full">
            {chatRooms.length}개
          </span>
        </div>

        {/* Scroll list block */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2">
          {loadingRooms ? (
            <div className="text-center py-12 text-xs text-slate-400">대화방 수집 중...</div>
          ) : chatRooms.length > 0 ? (
            chatRooms.map((room) => {
              const isActive = selectedRoom?.id === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full text-left p-3.5 rounded-xl cursor-pointer transition-colors block ${
                    isActive ? "bg-emerald-50 text-emerald-800" : "hover:bg-slate-50/80 text-slate-600"
                  }`}
                  id={`room-btn-${room.id}`}
                >
                  <div className="flex items-start space-x-2">
                    <Tractor className="h-4.5 w-4.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-800 text-xs truncate">
                        {room.machineTitle}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 truncate">
                        {room.lastMessage}
                      </p>
                      <span className="text-[9px] text-slate-400 mt-0.5 inline-block">
                        {new Date(room.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <Inbox className="h-8 w-8 text-slate-350 mx-auto" />
              <p className="text-[10px] text-slate-400">활성화된 대화 내역이 가벼워 보입니다.</p>
              <p className="text-[9px] text-slate-400/80">장비 상세정보에서 '소유자와 대화'를 눌러 실시간 흥정을 시작해 보세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Messaging thread columns */}
      <div className="flex-1 flex flex-col h-full bg-white">
        {selectedRoom ? (
          <>
            {/* Thread Header details */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/20 shrink-0 flex items-center space-x-3 text-left">
              <Tractor className="h-5 w-5 text-emerald-500" />
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">{selectedRoom.machineTitle}</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  문의처: {selectedRoom.ownerId.slice(0, 8)} • 세션 개설
                </p>
              </div>
            </div>

            {/* Sub messages log container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-slate-50/25">
              {activeChatMessages.map((msg, index) => {
                const isMe = msg.senderId === currentUser.uid;
                return (
                  <div
                    key={index}
                    className={`flex items-start ${isMe ? "flex-row-reverse space-x-reverse" : "space-x-3"}`}
                  >
                    {/* Tiny User icon avatar */}
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                        isMe ? "bg-slate-700 text-white" : "bg-emerald-500 text-white"
                      } text-[9px] font-bold`}
                    >
                      {isMe ? "나" : "상"}
                    </div>

                    {/* Chat Bubble contents styled with proper width bounds */}
                    <div className="space-y-1 max-w-[70%]">
                      {!isMe && (
                        <p className="text-[9px] font-medium text-slate-400 text-left">
                          {msg.senderName}
                        </p>
                      )}
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-xs whitespace-pre-wrap text-left shadow-3xs ${
                          isMe
                            ? "bg-slate-800 text-white rounded-tr-none"
                            : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                        }`}
                      >
                        {msg.message}
                      </div>
                      <p className="text-[9px] text-slate-400 font-normal">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input message form bottom bar */}
            <form onSubmit={handleSendMessage} className="px-4 py-3 border-t border-slate-100 flex gap-2 bg-slate-50 shrink-0">
              <input
                type="text"
                id="message-text-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="답장을 작성하여 상대방에게 전송하세요..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <button
                type="submit"
                id="message-send-btn"
                disabled={!inputText.trim()}
                className={`px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                  !inputText.trim() ? "bg-slate-300" : ""
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <MessageSquare className="h-12 w-12 text-slate-200 mb-3 animate-bounce shadow-2xs" />
            <h3 className="font-extrabold text-slate-700 text-sm">대화 세션 내용이 비어있습니다.</h3>
            <p className="text-center text-[10px] text-slate-400 mt-1 max-w-sm leading-relaxed">
              왼쪽 대화목록을 누르거나 대여를 원하시는 농기계 세부페이지에서 대화신청 버튼을 누르시면 실시간 상담이 연결됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
