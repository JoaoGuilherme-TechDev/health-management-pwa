"use client"

import { Button } from "@/components/ui/button"
import { HomeIcon } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div>
          <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Página não encontrada</h2>
          <p className="text-muted-foreground">A página que você está procurando não existe ou foi movida.</p>
        </div>

        <Link href="/">
          <Button className="gap-2 w-full">
            <HomeIcon className="h-4 w-4" />
            Voltar para a Página Inicial
          </Button>
        </Link>
      </div>
    </div>
  )
}
