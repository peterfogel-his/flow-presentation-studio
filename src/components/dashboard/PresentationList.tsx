import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Presentation, MoreHorizontal, Trash2, Edit, Play } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { Presentation as PresentationType } from '@/types/presentation';

export function PresentationList() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState<PresentationType[]>([]);
  const [loading, setLoading] = useState(true);

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
    } else {
      setPresentations(data || []);
    }
    setLoading(false);
  };

  const createPresentation = async () => {
    const { data, error } = await supabase
      .from('presentations')
      .insert({
        user_id: user?.id,
        title: 'Ny presentation',
      })
      .select()
      .single();

    if (error) {
      toast.error('Kunde inte skapa presentation');
    } else if (data) {
      // Create initial slide
      await supabase.from('slides').insert({
        presentation_id: data.id,
        position: 0,
        title: 'Första stoppet',
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
      toast.error('Kunde inte ta bort presentationen');
    } else {
      setPresentations(presentations.filter((p) => p.id !== id));
      toast.success('Presentation borttagen');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Presentation className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold">FlowDeck</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              Logga ut
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold">Mina presentationer</h2>
            <p className="text-muted-foreground mt-1">
              Skapa och hantera dina flow-presentationer
            </p>
          </div>
          <Button onClick={createPresentation} className="gap-2">
            <Plus className="h-4 w-4" />
            Ny presentation
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : presentations.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Presentation className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Inga presentationer ännu</h3>
            <p className="text-muted-foreground mb-4">
              Skapa din första flow-presentation och börja imponera!
            </p>
            <Button onClick={createPresentation} className="gap-2">
              <Plus className="h-4 w-4" />
              Skapa presentation
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentations.map((presentation) => (
              <Card 
                key={presentation.id} 
                className="group hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/editor/${presentation.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-medium truncate">
                      {presentation.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Uppdaterad {formatDate(presentation.updated_at)}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/editor/${presentation.id}`);
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Redigera
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/present/${presentation.id}`);
                      }}>
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
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <Presentation className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
