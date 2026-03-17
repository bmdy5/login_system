import ChatPanel from '@/components/chat/ChatPanel';

export default function DashboardChatPage() {
  return (
    <section className="chat-page">
      <header className="chat-header">
        <h2>大模型对话</h2>
        <p>输入问题后，模型回复会通过流式输出实时显示。</p>
      </header>

      <ChatPanel />
    </section>
  );
}
