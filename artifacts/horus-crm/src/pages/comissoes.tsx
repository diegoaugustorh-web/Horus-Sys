import { useState } from "react";
import { Plus, Search, MoreHorizontal, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { 
  useListComissoes, 
  useUpdateComissao,
  getListComissoesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackEvent } from "@/lib/analytics";

export function Comissoes() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: comissoes, isLoading } = useListComissoes({ status: statusFilter !== "all" ? statusFilter : undefined });
  const updateComissao = useUpdateComissao();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUpdateStatus = async (id: string, novoStatus: "A Receber" | "Recebida" | "Atrasada") => {
    try {
      await updateComissao.mutateAsync({ id, data: { status: novoStatus } });
      queryClient.invalidateQueries({ queryKey: getListComissoesQueryKey() });
      trackEvent("commission_status_changed", { status: novoStatus });
      toast({ title: "Status atualizado com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Recebida':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'A Receber':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'Atrasada':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredData = comissoes?.filter(c => 
    !search || 
    c.clienteNome?.toLowerCase().includes(search.toLowerCase()) ||
    c.apoliceNumero?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Comissões</h2>
          <p className="text-muted-foreground">Controle de recebíveis de comissões por apólice.</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nova Comissão
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por cliente, apólice..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="A Receber">A Receber</SelectItem>
            <SelectItem value="Recebida">Recebida</SelectItem>
            <SelectItem value="Atrasada">Atrasada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Apólice / Seguradora</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Parcela</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Nenhuma comissão encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredData?.map((comissao) => (
                <TableRow key={comissao.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{comissao.apoliceNumero}</span>
                      <span className="text-xs text-muted-foreground">{comissao.seguradora}</span>
                    </div>
                  </TableCell>
                  <TableCell>{comissao.clienteNome}</TableCell>
                  <TableCell>{comissao.parcela} / {comissao.totalParcelas}</TableCell>
                  <TableCell>{comissao.vencimento ? formatDate(comissao.vencimento) : '-'}</TableCell>
                  <TableCell>{getStatusBadge(comissao.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(comissao.valor)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateStatus(comissao.id, "Recebida")}>
                          Marcar como Recebida
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(comissao.id, "Atrasada")}>
                          Marcar como Atrasada
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>Editar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
