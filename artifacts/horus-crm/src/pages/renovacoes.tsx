import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

export function Renovacoes() {
  const { data: regua = [], isLoading } = useQuery({
    queryKey: ["renovacoes-regua"],
    queryFn: async () => {
      const res = await fetch("/api/renovacoes/regua");
      if (!res.ok) throw new Error("Falha ao carregar régua");
      return res.json();
    },
  });

  const { data: crossSell = [] } = useQuery({
    queryKey: ["cross-sell"],
    queryFn: async () => {
      const res = await fetch("/api/renovacoes/cross-sell");
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) return <div className="p-6">Carregando régua de renovação...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Régua de Renovação</h1>
        <p className="text-muted-foreground">Apólices que precisam de ação nos próximos 90 dias</p>
      </div>

      <div className="grid gap-4">
        {regua.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhuma renovação urgente no momento.
            </CardContent>
          </Card>
        )}

        {regua.map((item: any) => (
          <Card key={item.apoliceId} className={item.risco === "alto" ? "border-destructive/50" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{item.clienteNome || "Cliente"}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Apólice {item.numero} • {item.ramo} • Vence em {item.daysUntil} dias
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={item.risco === "alto" ? "destructive" : item.risco === "medio" ? "default" : "secondary"}>
                    Risco {item.risco}
                  </Badge>
                  <Badge variant="outline">Regra {item.regra}d</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm bg-muted p-3 rounded-md">{item.mensagem}</p>
              <div className="flex gap-2">
                {item.clienteTelefone && (
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={`https://wa.me/55${item.clienteTelefone.replace(/\D/g, "")}?text=${encodeURIComponent(item.mensagem)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Enviar WhatsApp
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="secondary" asChild>
                  <Link href={`/clientes/${item.clienteId}`}>Ver ficha</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {crossSell.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Sugestões de Cross-sell</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {crossSell.map((s: any, i: number) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{s.clienteNome}</p>
                      <p className="text-sm text-muted-foreground">
                        Oferecer <strong>{s.sugestao}</strong> — {s.motivo}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
