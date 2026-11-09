import { useState } from "react";
import { Plus, Search, MoreHorizontal, UserCog, Shield, ShieldCheck, Trash2 } from "lucide-react";
import { 
  useListUsuarios, 
  useDeleteUsuario,
  getListUsuariosQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

export function Usuarios() {
  const [search, setSearch] = useState("");
  const { data: usuarios, isLoading, error } = useListUsuarios();
  const deleteUsuario = useDeleteUsuario();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isForbidden = (error as { status?: number } | null)?.status === 403;

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    
    try {
      await deleteUsuario.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListUsuariosQueryKey() });
      toast({ title: "Usuário excluído com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao excluir usuário", variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200"><ShieldCheck className="w-3 h-3 mr-1" /> Admin</Badge>;
      case 'corretor':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Shield className="w-3 h-3 mr-1" /> Corretor</Badge>;
      case 'atendente':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><UserCog className="w-3 h-3 mr-1" /> Atendente</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const filteredData = usuarios?.filter(u => 
    !search || 
    u.nome?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Usuários do Sistema</h2>
          <p className="text-muted-foreground">Gestão de acesso da equipe.</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{isForbidden ? "Acesso negado" : "Não foi possível carregar os usuários"}</AlertTitle>
          <AlertDescription>
            {isForbidden
              ? "Somente administradores podem consultar e gerenciar os usuários da equipe."
              : "Tente novamente em alguns instantes."}
          </AlertDescription>
        </Alert>
      ) : null}

      {!error ? <>
        <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou email..."
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
              <TableHead>Usuário</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Criado Em</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData?.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {usuario.nome?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{usuario.nome || "Usuário sem nome"}</span>
                        <span className="text-xs text-muted-foreground">{usuario.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(usuario.role)}</TableCell>
                  <TableCell>{formatDate(usuario.criadoEm)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>Editar Papel</DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(usuario.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remover Acesso
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
      </> : null}
    </div>
  );
}
