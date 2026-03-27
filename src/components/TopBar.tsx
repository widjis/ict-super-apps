import { Bell, ArrowLeft } from 'lucide-react';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function TopBar({ title = "Good morning, Operator", showBack = false, onBack }: TopBarProps) {
  return (
    <header className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6 py-4 w-full shadow-[0_8px_24px_rgba(42,52,57,0.06)]">
      <div className="flex items-center gap-4">
        {showBack ? (
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-surface-container-high transition-colors rounded-full active:scale-95 duration-250">
            <ArrowLeft className="w-6 h-6 text-on-surface" />
          </button>
        ) : (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest ring-2 ring-primary-container">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeK9eVjMJVAoAtm19dDfMsbYhbf6rzyJXq9U38qxKKCy6tTvmFSQfrSXBzS1K7ygnda0WWgrHsg5Q78T6jtFmgK3n7fbHNFr-MWvfhuVRXLnF1D9CnZUlSMYDuz_xJLos6DCr372LOJCjuX3Ju6Q1mmbNXbUWvasNJogggJmKJYOqRm0-M0UgzU9P-QYngFZqGo2kRhV1XxNz7rD4R4L0Q-o5ExTn3vEBAqrM530tLcgbObTFDLHNQFF0pn2NyvpKsMMiiWBsPbxk" 
              alt="User profile" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h1 className={`font-headline font-bold text-2xl tracking-tight ${showBack ? 'text-primary' : 'text-on-surface'}`}>
          {title}
        </h1>
      </div>
      
      {showBack ? (
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest ring-2 ring-white shadow-sm">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeK9eVjMJVAoAtm19dDfMsbYhbf6rzyJXq9U38qxKKCy6tTvmFSQfrSXBzS1K7ygnda0WWgrHsg5Q78T6jtFmgK3n7fbHNFr-MWvfhuVRXLnF1D9CnZUlSMYDuz_xJLos6DCr372LOJCjuX3Ju6Q1mmbNXbUWvasNJogggJmKJYOqRm0-M0UgzU9P-QYngFZqGo2kRhV1XxNz7rD4R4L0Q-o5ExTn3vEBAqrM530tLcgbObTFDLHNQFF0pn2NyvpKsMMiiWBsPbxk" 
            alt="User profile" 
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface-container-high transition-colors active:scale-95 text-on-surface-variant">
          <Bell className="w-5 h-5" />
        </button>
      )}
    </header>
  );
}
