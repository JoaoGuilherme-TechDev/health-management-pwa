"use client"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">HealthCare+</h1>
          <p className="text-muted-foreground">Sistema de Gerenciamento de Saúde</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Placeholder for future content */}
          <section className="p-6 border rounded-lg bg-card">
            <h3 className="text-lg font-semibold mb-2">Bem-vindo</h3>
            <p className="text-sm text-muted-foreground">
              Conteúdo principal será adicionado aqui.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
