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
import { Download, Share, PlusSquare, Monitor, Pill, HeartPulse, Calendar } from "lucide-react"

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
      <DialogContent className="sm:max-w-md rounded-2xl bg-gradient-to-br from-rose-50 via-sky-50 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 border border-pink-100/70 dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-pink-500" />
            Seu app de cuidado em saúde
          </DialogTitle>
          <DialogDescription>
            Instale o HealthCare+ para receber lembretes de remédios, consultas e evolução física direto na tela
            inicial.
          </DialogDescription>
        </DialogHeader>

        {!showManualInstructions ? (
          <div className="flex flex-col gap-4 py-3">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-pink-100/90 text-pink-700 text-xs px-3 py-1 dark:bg-pink-900/40 dark:text-pink-100">
              <span>💊 Cuidado contínuo, no seu bolso</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/80 dark:bg-slate-950/70 border border-pink-100/60 dark:border-slate-800 shadow-sm">
              <img src="/apple-icon.png" alt="App Icon" className="w-12 h-12 rounded-2xl shadow-md" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">HealthCare+</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 dark:bg-emerald-900/60 dark:text-emerald-100">
                    <Pill className="h-3 w-3" />
                    Saúde
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Seu espaço para acompanhar consultas, medicamentos, dieta e evolução física.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2 rounded-xl bg-pink-50/80 dark:bg-pink-950/40 px-3 py-2">
                <Calendar className="h-4 w-4 text-pink-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-xs">Consultas</p>
                  <p className="text-[11px] leading-snug">Lembretes fofos de consultas e retornos importantes.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 px-3 py-2">
                <Pill className="h-4 w-4 text-sky-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-xs">Medicamentos</p>
                  <p className="text-[11px] leading-snug">Ajuda a lembrar da próxima dose com carinho.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 px-3 py-2">
                <HeartPulse className="h-4 w-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground text-xs">Sua evolução</p>
                  <p className="text-[11px] leading-snug">Acompanhe peso, medidas e bem-estar ao longo do tempo.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            {isIOS ? (
              <div className="space-y-3 text-sm rounded-2xl bg-white/80 dark:bg-slate-950/70 border border-pink-100/60 dark:border-slate-800 px-4 py-3">
                <p className="font-medium text-foreground">Como instalar no iOS</p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li className="flex items-center gap-2">
                    Toque no botão <Share className="h-4 w-4" /> <strong>Compartilhar</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    Role para baixo e toque em <PlusSquare className="h-4 w-4" />{" "}
                    <strong>Adicionar à Tela de Início</strong>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 text-sm rounded-2xl bg-white/80 dark:bg-slate-950/70 border border-pink-100/60 dark:border-slate-800 px-4 py-3">
                <p className="font-medium text-foreground">Como instalar no seu dispositivo</p>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li className="flex items-center gap-2">
                    Procure o ícone de instalação <Download className="h-4 w-4" /> ou{" "}
                    <Monitor className="h-4 w-4" /> na barra de endereço do navegador.
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
              <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
                Agora não
              </Button>
              <Button onClick={handleInstallClick} className="gap-2 w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Instalar app
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
              Entendi
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
