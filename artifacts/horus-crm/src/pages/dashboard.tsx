import { useGetDashboardSummary, useGetProximosVencimentos, useGetSinistrosRecentes } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Shield, ShieldAlert, DollarSign, Target, Activity, Users, AlertTriangle, FileText, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: vencimentos, isLoading: isLoadingVencimentos } = useGetProximosVencimentos();
  const { data: sinistros, isLoading: isLoadingSinistros } = useGetSinistrosRecentes();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Bem-vindo ao Hórus CRM. Aqui está o resumo da sua corretora.</p>
      </div>

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
        <SummaryCard
          title="Comissão Gerada no Mês"
          value={summary?.comissaoGeradaMes !== undefined ? formatCurrency(summary.comissaoGeradaMes) : undefined}
          icon={TrendingUp}
          description="Pela data de criação da comissão"
          isLoading={isLoadingSummary}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-orange-500" />
              Próximos Vencimentos
            </CardTitle>
            <CardDescription>Apólices que vencem nos próximos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingVencimentos ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : vencimentos && vencimentos.length > 0 ? (
              <div className="space-y-4">
                {vencimentos.map(apolice => (
                  <div key={apolice.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-medium">{apolice.clienteNome}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {apolice.seguradora} - {apolice.ramo}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        Vence: {apolice.fim ? formatDate(apolice.fim) : '-'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma apólice vencendo nos próximos 30 dias.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Sinistros Recentes
            </CardTitle>
            <CardDescription>Últimos sinistros abertos ou atualizados</CardDescription>
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
                      <span className="font-medium">{sinistro.clienteNome}</span>
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
  isLoading 
}: { 
  title: string, 
  value?: string, 
  icon: any, 
  description?: string,
  isLoading?: boolean 
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className="text-2xl font-bold">{value !== undefined ? value : "0"}</div>
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
