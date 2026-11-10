import { useState } from "react";
import { Plus } from "lucide-react";
import { 
  useListOportunidades, 
  useUpdateOportunidade,
  getListOportunidadesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/analytics";

const COLUMNS = ["Lead", "Cotação", "Proposta", "Negociação", "Ganho", "Perdido"] as const;

export function Pipeline() {
  const { data: oportunidades, isLoading } = useListOportunidades();
  const updateOportunidade = useUpdateOportunidade();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [draggedId, setDraggedId] = useState<string | null>(null);

  const getItemsByColumn = (col: string) => {
    return oportunidades?.filter(o => o.estagio === col) || [];
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    // We need to set some data to make Firefox work
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    setDraggedId(null);

    if (!id) return;

    const item = oportunidades?.find(o => o.id === id);
    if (!item) return;

    if (item.estagio !== targetColumn) {
      // Optimistic update
      queryClient.setQueryData(getListOportunidadesQueryKey(), (old: any) => {
        if (!old) return old;
        return old.map((o: any) => o.id === id ? { ...o, estagio: targetColumn } : o);
      });

      try {
        await updateOportunidade.mutateAsync({ 
          id, 
          data: { estagio: targetColumn as any } 
        });
        trackEvent("opportunity_stage_changed", {
          from_stage: item.estagio,
          to_stage: targetColumn,
        });
        toast({ title: `Movido para ${targetColumn}` });
      } catch (error) {
        // Revert on error
        queryClient.invalidateQueries({ queryKey: getListOportunidadesQueryKey() });
        toast({ title: "Erro ao mover oportunidade", variant: "destructive" });
      }
    }
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pipeline de Vendas</h2>
          <p className="text-muted-foreground">Acompanhe e movimente suas oportunidades.</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nova Oportunidade
        </Button>
      </div>

      {isLoading ? (
        <div className="flex gap-4 h-full overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col} className="w-72 shrink-0 bg-muted/30 rounded-lg p-3">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <Skeleton className="h-24 w-full mb-2" />
              <Skeleton className="h-24 w-full mb-2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 h-full overflow-x-auto pb-4 items-start">
          {COLUMNS.map((col) => {
            const items = getItemsByColumn(col);
            return (
              <div 
                key={col} 
                className="w-[300px] shrink-0 flex flex-col bg-muted/40 rounded-lg border border-border"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col)}
              >
                <div className="p-3 border-b border-border font-semibold flex justify-between items-center bg-muted/60 rounded-t-lg">
                  {col}
                  <Badge variant="secondary" className="rounded-full w-6 h-6 p-0 flex items-center justify-center">
                    {items.length}
                  </Badge>
                </div>
                <div className="p-3 flex-1 overflow-y-auto min-h-[150px]">
                  {items.map(item => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      className={`bg-card border border-border p-3 rounded-md shadow-sm mb-2 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${draggedId === item.id ? 'opacity-50' : 'opacity-100'}`}
                    >
                      <div className="font-medium text-sm mb-1">{item.cliente}</div>
                      <div className="text-xs text-muted-foreground mb-2">{item.ramo}</div>
                      <div className="font-semibold text-primary text-sm">{formatCurrency(item.valorEstimado)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
