import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Play, Save, Check, Loader2 } from 'lucide-react';

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

  const handleTitleSave = () => {
    onTitleChange(editTitle);
    setIsEditing(false);
  };

  return (
    <header className="h-14 border-b bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4">
      {/* Back button */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      {/* Title */}
      {isEditing ? (
        <div className="flex items-center gap-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="h-8 w-64"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            onBlur={handleTitleSave}
          />
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleTitleSave}>
            <Check className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          className="font-medium hover:text-primary transition-colors"
          onClick={() => {
            setEditTitle(title);
            setIsEditing(true);
          }}
        >
          {title}
        </button>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Spara
        </Button>
        <Button 
          size="sm" 
          className="gap-2"
          onClick={() => navigate(`/present/${presentationId}`)}
        >
          <Play className="h-4 w-4" />
          Presentera
        </Button>
      </div>
    </header>
  );
}
