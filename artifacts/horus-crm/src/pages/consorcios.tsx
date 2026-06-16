import { useState } from "react";
import { Plus, Search, MoreHorizontal, Car, Building2, Trash2 } from "lucide-react";
import { 
  useListConsorcios, 
  useDeleteConsorcio,
  getListConsorciosQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export function Consorcios() {
  const [search, setSearch] = useState("");
  const { data: consorcios, isLoading } = useListConsorcios();
  const deleteConsorcio = useDeleteConsorcio();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este consórcio?")) return;
    
    try {
      await deleteConsorcio.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListConsorciosQueryKey() });
      toast({ title: "Consórcio excluído com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao excluir consórcio", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{status}</Badge>;
      case 'Contemplado':
        return <Badge className="bg-green-100 text-green-800 border-green-200">{status}</Badge>;
      case 'Quitado':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredData = consorcios?.filter(c => 
    !search || 
    c.clienteNome?.toLowerCase().includes(search.toLowerCase()) ||
    c.administradora?.toLowerCase().includes(search.toLowerCase()) ||
    c.bem?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Consórcios</h2>
          <p className="text-muted-foreground">Gestão de cotas de consórcios.</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Novo Consórcio
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por cliente, administradora, bem..."
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
              <TableHead>Bem / Adm</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Grupo/Cota</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Crédito</TableHead>
              <TableHead className="text-right">Parcela</TableHead>
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
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Nenhum consórcio encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData?.map((consorcio) => (
                <TableRow key={consorcio.id}>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <div className="mt-1">
                        {consorcio.bem?.toLowerCase().includes('imóvel') || consorcio.bem?.toLowerCase().includes('casa') ? 
                          <Building2 className="h-4 w-4 text-muted-foreground" /> : 
                          <Car className="h-4 w-4 text-muted-foreground" />
                        }
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{consorcio.bem}</span>
                        <span className="text-xs text-muted-foreground">{consorcio.administradora}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{consorcio.clienteNome}</TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{consorcio.grupo} / {consorcio.cota}</span>
                  </TableCell>
                  <TableCell>{getStatusBadge(consorcio.status)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(consorcio.valorCredito)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(consorcio.parcela)}
                    <div className="text-xs text-muted-foreground">{consorcio.prazoMeses} meses</div>
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
                        <DropdownMenuItem disabled>Editar</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(consorcio.id)}
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
