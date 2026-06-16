import { useState } from "react";
import { Plus, Search, MoreHorizontal, Calendar as CalendarIcon, Link as LinkIcon, Trash2 } from "lucide-react";
import { 
  useListReunioes, 
  useDeleteReuniao,
  getListReunioesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/utils";

export function Reunioes() {
  const [search, setSearch] = useState("");
  const { data: reunioes, isLoading } = useListReunioes();
  const deleteReuniao = useDeleteReuniao();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar/excluir esta reunião?")) return;
    
    try {
      await deleteReuniao.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListReunioesQueryKey() });
      toast({ title: "Reunião excluída com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao excluir reunião", variant: "destructive" });
    }
  };

  const filteredData = reunioes?.filter(r => 
    !search || 
    r.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    r.clienteNome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Reuniões</h2>
          <p className="text-muted-foreground">Agenda de compromissos com clientes.</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Agendar Reunião
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar reuniões..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-border rounded-lg p-4 bg-card shadow-sm space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full mt-2" />
            </div>
          ))
        ) : filteredData?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground border border-border border-dashed rounded-lg">
            Nenhuma reunião agendada.
          </div>
        ) : (
          filteredData?.map((reuniao) => (
            <div key={reuniao.id} className="flex flex-col border border-border rounded-lg p-4 bg-card shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg line-clamp-1">{reuniao.titulo}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 -mr-2 -mt-2">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled>Editar</DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => handleDelete(reuniao.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Cancelar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2 flex-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formatDateTime(reuniao.dataHora)}
                </div>
                
                <div className="flex items-center text-sm">
                  <span className="font-medium truncate">{reuniao.clienteNome || "Sem cliente vinculado"}</span>
                </div>
                
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{reuniao.tipo}</Badge>
                  <Badge variant="outline">{reuniao.modalidade}</Badge>
                </div>
              </div>

              {reuniao.linkReuniao && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full" asChild>
                    <a href={reuniao.linkReuniao} target="_blank" rel="noopener noreferrer">
                      <LinkIcon className="mr-2 h-4 w-4" />
                      Entrar na Reunião
                    </a>
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
