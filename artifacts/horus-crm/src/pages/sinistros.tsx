import { useState } from "react";
import { Plus, Search, MoreHorizontal, ShieldAlert, FileText, CheckCircle, Clock } from "lucide-react";
import { 
  useListSinistros, 
  useUpdateSinistro,
  getListSinistrosQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackEvent } from "@/lib/analytics";

export function Sinistros() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: sinistros, isLoading } = useListSinistros({ status: statusFilter !== "all" ? statusFilter : undefined });
  const updateSinistro = useUpdateSinistro();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleUpdateStatus = async (id: string, novoStatus: any) => {
    try {
      await updateSinistro.mutateAsync({ id, data: { status: novoStatus } });
      queryClient.invalidateQueries({ queryKey: getListSinistrosQueryKey() });
      trackEvent("claim_status_changed", { status: novoStatus });
      toast({ title: "Status atualizado com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aberto':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><ShieldAlert className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'Em Análise':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'Aprovado':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'Pago':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'Negado':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200"><FileText className="w-3 h-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredData = sinistros?.filter(s => 
    !search || 
    s.clienteNome?.toLowerCase().includes(search.toLowerCase()) ||
    s.protocolo?.toLowerCase().includes(search.toLowerCase()) ||
    s.apoliceNumero?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sinistros</h2>
          <p className="text-muted-foreground">Acompanhamento e gestão de sinistros.</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Novo Sinistro
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por protocolo, cliente..."
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
            <SelectItem value="Aberto">Aberto</SelectItem>
            <SelectItem value="Em Análise">Em Análise</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
            <SelectItem value="Negado">Negado</SelectItem>
            <SelectItem value="Pago">Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo / Data</TableHead>
              <TableHead>Cliente / Apólice</TableHead>
              <TableHead>Ramo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Est.</TableHead>
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
                  <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Nenhum sinistro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData?.map((sinistro) => (
                <TableRow key={sinistro.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{sinistro.protocolo}</span>
                      <span className="text-xs text-muted-foreground">{sinistro.dataOcorrencia ? formatDate(sinistro.dataOcorrencia) : '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{sinistro.clienteNome}</span>
                      <span className="text-xs text-muted-foreground">Apólice: {sinistro.apoliceNumero}</span>
                    </div>
                  </TableCell>
                  <TableCell>{sinistro.apoliceRamo}</TableCell>
                  <TableCell>{getStatusBadge(sinistro.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(sinistro.valorEstimado)}
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
                        <DropdownMenuLabel>Atualizar Status</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(sinistro.id, "Em Análise")}>Para Em Análise</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(sinistro.id, "Aprovado")}>Para Aprovado</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(sinistro.id, "Pago")}>Para Pago</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(sinistro.id, "Negado")}>Para Negado</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem disabled>Ver Detalhes</DropdownMenuItem>
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
