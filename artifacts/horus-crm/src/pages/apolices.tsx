import { useState } from "react";
import { Link } from "wouter";
import { Plus, Search, MoreHorizontal, FileText, Trash2, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { 
  useListApolices, 
  useDeleteApolice,
  getListApolicesQueryKey,
  ApoliceStatus
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export function Apolices() {
  const [search, setSearch] = useState("");
  const { data: apolices, isLoading } = useListApolices({ q: search || undefined });
  const deleteApolice = useDeleteApolice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta apólice?")) return;
    
    try {
      await deleteApolice.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListApolicesQueryKey() });
      toast({ title: "Apólice excluída com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao excluir apólice", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Vigente':
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'A Renovar':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100"><Clock className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'Vencida':
        return <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100"><AlertCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      case 'Cancelada':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100"><XCircle className="w-3 h-3 mr-1" /> {status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Apólices</h2>
          <p className="text-muted-foreground">Gerencie todos os contratos e seguros ativos.</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nova Apólice (Em breve)
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por número, cliente..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Seguradora/Ramo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vigência</TableHead>
              <TableHead className="text-right">Prêmio</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : apolices?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Nenhuma apólice encontrada.
                </TableCell>
              </TableRow>
            ) : (
              apolices?.map((apolice) => (
                <TableRow key={apolice.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {apolice.numero}
                    </div>
                  </TableCell>
                  <TableCell>
                    {apolice.clienteId ? (
                      <Link href={`/clientes/${apolice.clienteId}`} className="hover:underline">
                        {apolice.clienteNome}
                      </Link>
                    ) : (
                      apolice.clienteNome
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{apolice.seguradora}</span>
                      <span className="text-xs text-muted-foreground">{apolice.ramo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(apolice.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {apolice.inicio ? formatDate(apolice.inicio) : '-'} até {apolice.fim ? formatDate(apolice.fim) : '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(apolice.premio)}
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
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(apolice.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
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
