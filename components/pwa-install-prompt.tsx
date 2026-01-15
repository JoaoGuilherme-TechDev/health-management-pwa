"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Download, Share, PlusSquare, Monitor, X } from "lucide-react"

export function PWAInstallPrompt() {
  const [isOpen, setIsOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)

  useEffect(() => {
    // Check if already in standalone mode
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsStandalone(true)
      return
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    // Handle beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA] beforeinstallprompt fired")
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Show popup after 2 seconds
    const timer = setTimeout(() => {
      if (!isStandalone) {
        console.log("[PWA] Showing install prompt")
        setIsOpen(true)
      }
    }, 2000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      clearTimeout(timer)
    }
  }, [isStandalone])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`[PWA] User response to install prompt: ${outcome}`)
      setDeferredPrompt(null)
      setIsOpen(false)
    } else {
      // Fallback for manual instructions
      setShowManualInstructions(true)
    }
  }

  if (isStandalone) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Instalar HealthCare+
          </DialogTitle>
          <DialogDescription>
            Instale nosso aplicativo para uma melhor experiência, acesso offline e notificações.
          </DialogDescription>
        </DialogHeader>

        {!showManualInstructions ? (
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <img src="/apple-icon.png" alt="App Icon" className="w-12 h-12 rounded-xl shadow-sm" />
              <div className="flex-1">
                <h3 className="font-semibold">HealthCare+</h3>
                <p className="text-sm text-muted-foreground">Gerenciamento de Saúde</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {isIOS ? (
              <div className="space-y-3 text-sm">
                <p>Para instalar no iOS:</p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li className="flex items-center gap-2">
                    Toque no botão <Share className="h-4 w-4" /> <strong>Compartilhar</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    Role para baixo e toque em <PlusSquare className="h-4 w-4" /> <strong>Adicionar à Tela de Início</strong>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <p>Para instalar manualmente:</p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li className="flex items-center gap-2">
                    Procure o ícone de instalação <Download className="h-4 w-4" /> ou <Monitor className="h-4 w-4" /> na barra de endereço do navegador.
                  </li>
                  <li>
                    Ou abra o menu do navegador e selecione "Instalar Aplicativo" ou "Adicionar à Tela Inicial".
                  </li>
                </ol>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!showManualInstructions ? (
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Agora não
              </Button>
              <Button onClick={handleInstallClick} className="gap-2">
                <Download className="h-4 w-4" />
                Instalar
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsOpen(false)}>Entendi</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
