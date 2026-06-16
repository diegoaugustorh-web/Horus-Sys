import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetCliente, 
  useCreateCliente, 
  useUpdateCliente,
  getListClientesQueryKey,
  getGetClienteQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

const clienteSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  tipo: z.enum(["PF", "PJ"]),
  cpfCnpj: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  observacao: z.string().optional(),
  dataNascimento: z.string().optional(),
  estadoCivil: z.string().optional(),
  razaoSocial: z.string().optional(),
  nomeFantasia: z.string().optional(),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

export function ClienteDetalhe() {
  const { id } = useParams();
  const isNew = !id || id === "novo";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cliente, isLoading } = useGetCliente(id as string, { 
    query: { enabled: !isNew, queryKey: getGetClienteQueryKey(id as string) } 
  });

  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: "",
      tipo: "PF",
      cpfCnpj: "",
      email: "",
      telefone: "",
      cidade: "",
      observacao: "",
      dataNascimento: "",
      estadoCivil: "",
      razaoSocial: "",
      nomeFantasia: "",
    },
  });

  useEffect(() => {
    if (cliente && !isNew) {
      form.reset({
        nome: cliente.nome,
        tipo: cliente.tipo as "PF" | "PJ",
        cpfCnpj: cliente.cpfCnpj || "",
        email: cliente.email || "",
        telefone: cliente.telefone || "",
        cidade: cliente.cidade || "",
        observacao: cliente.observacao || "",
        dataNascimento: cliente.dataNascimento || "",
        estadoCivil: cliente.estadoCivil || "",
        razaoSocial: cliente.razaoSocial || "",
        nomeFantasia: cliente.nomeFantasia || "",
      });
    }
  }, [cliente, isNew, form]);

  const onSubmit = async (data: ClienteFormValues) => {
    try {
      if (isNew) {
        await createCliente.mutateAsync({ data });
        toast({ title: "Cliente criado com sucesso" });
      } else {
        await updateCliente.mutateAsync({ id: id as string, data });
        toast({ title: "Cliente atualizado com sucesso" });
      }
      queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
      setLocation("/clientes");
    } catch (error) {
      toast({ title: "Erro ao salvar cliente", variant: "destructive" });
    }
  };

  const tipo = form.watch("tipo");

  if (isLoading && !isNew) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/clientes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight">
          {isNew ? "Novo Cliente" : `Editar: ${cliente?.nome}`}
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Pessoa</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PF">Pessoa Física (PF)</SelectItem>
                      <SelectItem value="PJ">Pessoa Jurídica (PJ)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tipo === "PF" ? "Nome Completo" : "Nome de Contato"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {tipo === "PJ" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="razaoSocial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input placeholder="Razão social..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nomeFantasia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome fantasia..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cpfCnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tipo === "PF" ? "CPF" : "CNPJ"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Apenas números..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {tipo === "PF" && (
              <FormField
                control={form.control}
                name="dataNascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 00000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="observacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Notas adicionais sobre o cliente..." className="min-h-[100px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => setLocation("/clientes")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createCliente.isPending || updateCliente.isPending}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
