import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Pencil, Play, Trash2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import type { Presentation } from '@/types/block';

export function PresentationList() {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPresentations();
  }, []);

  const fetchPresentations = async () => {
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Kunde inte hämta presentationer');
      console.error(error);
    } else {
      setPresentations(data || []);
    }
    setLoading(false);
  };

  const createPresentation = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('presentations')
      .insert({
        user_id: user.id,
        title: 'Ny presentation',
      })
      .select()
      .single();

    if (error) {
      toast.error('Kunde inte skapa presentation');
      console.error(error);
    } else if (data) {
      // Create initial background block
      await supabase.from('blocks').insert({
        presentation_id: data.id,
        type: 'background',
        position: 0,
        content: { type: 'color', value: '#ffffff' },
        is_waypoint: true,
        waypoint_title: 'Start',
      });

      navigate(`/editor/${data.id}`);
    }
  };

  const deletePresentation = async (id: string) => {
    const { error } = await supabase
      .from('presentations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Kunde inte ta bort presentation');
      console.error(error);
    } else {
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      toast.success('Presentation borttagen');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success('Du är nu utloggad');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">FlowDeck</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Mina presentationer</h2>
          <Button onClick={createPresentation}>
            <Plus className="h-4 w-4 mr-2" />
            Ny presentation
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))}
          </div>
        ) : presentations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Du har inga presentationer ännu
              </p>
              <Button onClick={createPresentation}>
                <Plus className="h-4 w-4 mr-2" />
                Skapa din första
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {presentations.map((presentation) => (
              <Card
                key={presentation.id}
                className="group cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/editor/${presentation.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-lg font-medium truncate flex-1">
                    {presentation.title}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/editor/${presentation.id}`);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Redigera
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/present/${presentation.id}`);
                        }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Presentera
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePresentation(presentation.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Ta bort
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Uppdaterad {formatDate(presentation.updated_at)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
