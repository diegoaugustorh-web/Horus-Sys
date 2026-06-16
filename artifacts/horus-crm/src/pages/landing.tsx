import { Link } from "wouter";
import { Shield, BarChart3, Users, Clock, Target, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Hórus CRM" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">Hórus CRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="hidden sm:inline-flex">Entrar</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Criar Conta</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="space-y-6 pb-8 pt-16 md:pb-12 md:pt-24 lg:py-32">
          <div className="container mx-auto flex max-w-[64rem] flex-col items-center gap-4 text-center px-4">
            <h1 className="font-heading text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">
              O CRM definitivo para <br className="hidden sm:block" />
              <span className="text-primary">Corretoras de Seguros</span>
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Controle apólices, comissões, sinistros e pipeline de vendas em um só lugar. 
              Feito para quem vive a corretagem todos os dias.
            </p>
            <div className="space-x-4 mt-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base">Começar Agora</Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">Fazer Login</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto space-y-12 py-12 md:py-24 px-4 border-t border-border">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
            <h2 className="font-heading text-3xl font-bold leading-[1.1] sm:text-3xl md:text-5xl">
              Tudo que sua corretora precisa
            </h2>
            <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
              Substitua dezenas de planilhas por uma plataforma unificada e focada em resultados.
            </p>
          </div>
          <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <FeatureCard 
              icon={Shield} 
              title="Gestão de Apólices" 
              description="Acompanhe vencimentos, renovações e status de todas as apólices."
            />
            <FeatureCard 
              icon={BarChart3} 
              title="Controle de Comissões" 
              description="Saiba exatamente o que tem a receber e o que está atrasado."
            />
            <FeatureCard 
              icon={Target} 
              title="Pipeline de Vendas" 
              description="Do lead ao fechamento: não perca nenhuma oportunidade de negócio."
            />
            <FeatureCard 
              icon={Users} 
              title="Carteira de Clientes" 
              description="Histórico completo de PFs e PJs, com tudo em um só lugar."
            />
            <FeatureCard 
              icon={CheckCircle2} 
              title="Sinistros" 
              description="Gerencie processos de sinistro do aviso até o pagamento."
            />
            <FeatureCard 
              icon={Clock} 
              title="Reuniões e Agenda" 
              description="Integre seus compromissos e histórico de contatos com clientes."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 md:py-0">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row px-4">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Hórus CRM" className="h-6 w-6 grayscale" />
            <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
              © 2024 Hórus CRM. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-background p-2">
      <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
        <Icon className="h-10 w-10 text-primary" />
        <div className="space-y-2">
          <h3 className="font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
}
