import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Check, Loader2, Play } from 'lucide-react';

interface EditorHeaderProps {
  title: string;
  presentationId: string;
  saving: boolean;
  onTitleChange: (title: string) => void;
  onSave: () => void;
}

export function EditorHeader({
  title,
  presentationId,
  saving,
  onTitleChange,
  onSave,
}: EditorHeaderProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  const handleTitleSubmit = () => {
    if (editTitle.trim()) {
      onTitleChange(editTitle.trim());
    } else {
      setEditTitle(title);
    }
    setIsEditing(false);
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        title="Tillbaka till dashboard"
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        {isEditing ? (
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setEditTitle(title);
                setIsEditing(false);
              }
            }}
            className="max-w-xs h-8 text-lg font-medium"
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setEditTitle(title);
              setIsEditing(true);
            }}
            className="text-lg font-medium hover:text-primary transition-colors"
          >
            {title}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Spara
        </Button>

        <Button size="sm" onClick={() => navigate(`/present/${presentationId}`)}>
          <Play className="h-4 w-4 mr-2" />
          Presentera
        </Button>
      </div>
    </header>
  );
}
