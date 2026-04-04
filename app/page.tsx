import AvatarScene from '@/components/Avatar';
import Chat from '@/components/Chat';

export default function Home() {
  return (
    <main className="main-container">
      {/* 3D Avatar Background */}
      <AvatarScene />

      {/* UI Overlay */}
      <div className="ui-layer">
        <div className="title-card">
          <span className="badge">Vision 2026</span>
          <h1>Kalam AI</h1>
          <p>Inspiring the minds of tomorrow through the wisdom of today.</p>
        </div>

        {/* Chat Interface */}
        <Chat />
      </div>
    </main>
  );
}
