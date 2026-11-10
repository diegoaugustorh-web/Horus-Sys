import { useGetDashboardSummary, useGetProximosVencimentos, useGetSinistrosRecentes } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Shield, ShieldAlert, DollarSign, Target, Activity, Users, AlertTriangle, FileText, TrendingUp, MessageCircle, HeartPulse } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: vencimentos, isLoading: isLoadingVencimentos } = useGetProximosVencimentos();
  const { data: sinistros, isLoading: isLoadingSinistros } = useGetSinistrosRecentes();

  // Agrupa renovações por urgência para o gráfico simples
  const chartData = vencimentos
    ? [
        { name: "≤7 dias", value: vencimentos.filter(v => v.urgency === "critical").length, fill: "#ef4444" },
        { name: "8-15 dias", value: vencimentos.filter(v => v.urgency === "warning").length, fill: "#f97316" },
        { name: "16-30 dias", value: vencimentos.filter(v => v.urgency === "normal").length, fill: "#22c55e" },
      ]
    : [];

  const openWhatsApp = (telefone: string | null | undefined, nome: string) => {
    if (!telefone) return;
    const clean = telefone.replace(/\D/g, "");
    const msg = encodeURIComponent(`Olá ${nome}, tudo bem? Aqui é da corretora. Gostaria de falar sobre a renovação da sua apólice.`);
    window.open(`https://wa.me/55${clean}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Bem-vindo ao Hórus CRM. Aqui está o resumo da sua corretora.</p>
        </div>
        {/* Placeholder para filtro por corretor — schema ainda não tem corretorId */}
        <div className="text-sm text-muted-foreground">
          Visão geral da corretora
        </div>
      </div>

      {/* KPIs principais */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard 
          title="Prêmio Total" 
          value={summary?.premioTotal ? formatCurrency(summary.premioTotal) : undefined}
          icon={Activity}
          description="Apólices vigentes"
          isLoading={isLoadingSummary}
        />
        <SummaryCard 
          title="Comissões a Receber" 
          value={summary?.comissoesAReceber ? formatCurrency(summary.comissoesAReceber) : undefined}
          icon={DollarSign}
          description="Previsão de recebimentos"
          isLoading={isLoadingSummary}
        />
        <SummaryCard 
          title="Pipeline de Vendas" 
          value={summary?.pipelineValor ? formatCurrency(summary.pipelineValor) : undefined}
          icon={Target}
          description={`${summary?.totalOportunidades || 0} oportunidades`}
          isLoading={isLoadingSummary}
        />
        <SummaryCard 
          title="Sinistros Abertos" 
          value={summary?.sinistrosAbertos?.toString()}
          icon={AlertTriangle}
          description="Requerem atenção"
          isLoading={isLoadingSummary}
        />
        <SummaryCard 
          title="Saúde da Carteira" 
          value={summary?.saudeCarteira !== undefined ? `${summary.saudeCarteira}%` : undefined}
          icon={HeartPulse}
          description="Baseado em renovação e sinistros"
          isLoading={isLoadingSummary}
          highlight={summary?.saudeCarteira !== undefined && summary.saudeCarteira < 70}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard 
          title="Apólices Vigentes" 
          value={summary?.apolicesVigentes?.toString()}
          icon={Shield}
          isLoading={isLoadingSummary}
        />
        <SummaryCard 
          title="Apólices a Renovar" 
          value={summary?.aRenovar?.toString()}
          icon={ShieldAlert}
          isLoading={isLoadingSummary}
        />
        <SummaryCard 
          title="Total de Clientes" 
          value={summary?.totalClientes?.toString()}
          icon={Users}
          isLoading={isLoadingSummary}
        />
        <SummaryCard 
          title="Prêmio Vendido no Mês"
          value={summary?.premioVendidoMes !== undefined ? formatCurrency(summary.premioVendidoMes) : undefined}
          icon={DollarSign}
          description="Pela data de início da vigência"
          isLoading={isLoadingSummary}
        />
      </div>

      {/* Gráfico de urgência de renovações */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Renovações por Urgência (próximos 30 dias)</CardTitle>
          <CardDescription>Distribuição das apólices que vencem em breve</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingVencimentos ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.some(d => d.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma renovação nos próximos 30 dias.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximos Vencimentos com urgência, link e WhatsApp */}
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              Próximos Vencimentos
            </CardTitle>
            <CardDescription>Apólices que vencem nos próximos 30 dias — ação rápida</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingVencimentos ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : vencimentos && vencimentos.length > 0 ? (
              <div className="space-y-4">
                {vencimentos.map(apolice => {
                  const isCritical = apolice.urgency === "critical";
                  const isWarning = apolice.urgency === "warning";
                  return (
                    <div key={apolice.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0 gap-3">
                      <div className="flex flex-col min-w-0">
                        <Link href={apolice.clienteId ? `/clientes/${apolice.clienteId}` : "/apolices"}>
                          <span className="font-medium hover:underline cursor-pointer">{apolice.clienteNome}</span>
                        </Link>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {apolice.seguradora} - {apolice.ramo}
                        </span>
                        {apolice.daysUntil !== null && (
                          <span className="text-xs mt-1">
                            {apolice.daysUntil} dias restantes
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={
                            isCritical
                              ? "bg-red-50 text-red-700 border-red-200"
                              : isWarning
                              ? "bg-orange-50 text-orange-700 border-orange-200"
                              : "bg-green-50 text-green-700 border-green-200"
                          }
                        >
                          {isCritical ? "Urgente" : isWarning ? "Atenção" : "Normal"} · {apolice.fim ? formatDate(apolice.fim) : "-"}
                        </Badge>
                        <div className="flex gap-1">
                          {apolice.clienteTelefone && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={() => openWhatsApp(apolice.clienteTelefone, apolice.clienteNome || "Cliente")}
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Link href="/apolices">
                            <Button size="sm" variant="ghost" className="h-7 px-2">Ver</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma apólice vencendo nos próximos 30 dias.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sinistros com link */}
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Sinistros Recentes
            </CardTitle>
            <CardDescription>Últimos sinistros — clique para ver detalhes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSinistros ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : sinistros && sinistros.length > 0 ? (
              <div className="space-y-4">
                {sinistros.map(sinistro => (
                  <div key={sinistro.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <Link href={sinistro.clienteId ? `/clientes/${sinistro.clienteId}` : "/sinistros"}>
                        <span className="font-medium hover:underline cursor-pointer">{sinistro.clienteNome || "Sinistro"}</span>
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {sinistro.apoliceRamo} - Prot: {sinistro.protocolo}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={sinistro.status === 'Em Análise' ? 'secondary' : sinistro.status === 'Aberto' ? 'destructive' : 'default'}>
                        {sinistro.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {sinistro.dataOcorrencia ? formatDate(sinistro.dataOcorrencia) : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum sinistro recente encontrado.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  isLoading,
  highlight = false
}: { 
  title: string, 
  value?: string, 
  icon: any, 
  description?: string,
  isLoading?: boolean,
  highlight?: boolean
}) {
  return (
    <Card className={`shadow-sm ${highlight ? "border-orange-400" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className={`text-2xl font-bold ${highlight ? "text-orange-600" : ""}`}>{value !== undefined ? value : "0"}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
