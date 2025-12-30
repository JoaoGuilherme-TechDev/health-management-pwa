if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Registra o service worker
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log("✅ Service Worker registrado com sucesso:", registration.scope)

        // Verifica se há atualizações
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("🔄 Nova versão do Service Worker disponível")
                // Aqui você pode mostrar uma notificação para o usuário
              }
            })
          }
        })
      })
      .catch((error) => {
        console.error("❌ Falha ao registrar Service Worker:", error)
      })

    // Escuta mensagens do service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("Mensagem do Service Worker:", event.data)
    })
  })

  // Lida com atualizações de subscription
  navigator.serviceWorker.ready.then((registration) => {
    registration.pushManager.getSubscription().then((subscription) => {
      if (subscription) {
        console.log("📱 Subscription ativa encontrada:", subscription.endpoint)
      }
    })
  })
} else {
  console.warn("⚠️ Service Worker não suportado neste navegador")
}