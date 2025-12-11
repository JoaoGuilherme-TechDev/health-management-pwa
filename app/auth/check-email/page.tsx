import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Verifique seu Email</CardTitle>
            <CardDescription>Enviamos um link de confirmação para seu endereço de email</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <p className="text-sm text-muted-foreground text-center">
              Clique no link em seu email para confirmar sua conta e começar a usar o HealthCare+.
            </p>
            <Link href="/auth/login">
              <Button className="w-full bg-transparent" variant="outline">
                Voltar para Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
