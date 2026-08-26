'use client'

export default function NotificationBlockerModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = typeof window !== 'undefined' && ('standalone' in window.navigator) && window.navigator.standalone;

  const handlePermitir = async () => {
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

    if (isLocalhost) {
      alert('No localhost, as notificações são simuladas. Em produção, o OneSignal pedirá permissão real ao navegador.')
      onClose()
      return
    }

    if (window.OneSignal) {
      await window.OneSignal.Notifications.requestPermission();
      if (window.OneSignal.Notifications.permission) {
        window.location.reload();
      } else if (window.Notification && window.Notification.permission === 'denied') {
        alert("As notificações estão bloqueadas no seu navegador. Por favor, clique no cadeado ao lado da barra de endereço e permita as notificações para continuar.");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 cursor-pointer font-bold">X</button>
        <h2 className="text-xl font-bold text-[#82181A] mb-2">Atenção: Ação Obrigatória</h2>
        
        {isIOS && !isStandalone ? (
          <div className="text-sm text-neutral-600 space-y-4 mt-4">
            <p className="font-medium text-neutral-800">Para acessar esta área no seu iPhone, você precisa ativar as notificações para não perder avisos importantes.</p>
            <div className="bg-neutral-50 p-4 rounded-xl space-y-3 border border-neutral-200">
              <p className="font-bold text-neutral-800 text-xs uppercase tracking-wider">Como liberar o acesso agora:</p>
              <ol className="list-decimal pl-4 space-y-2 font-medium">
                <li>Toque no ícone de <b>Compartilhar</b> <span className="inline-flex items-center justify-center border rounded p-1 mx-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg></span> no rodapé do Safari.</li>
                <li>Role para baixo e selecione <b>Adicionar à Tela de Início</b> <span className="inline-flex items-center justify-center border rounded p-1 mx-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg></span>.</li>
                <li>Feche o Safari e <b>abra o aplicativo do DHPB</b> que apareceu na sua tela inicial.</li>
                <li>Pronto! Agora é só clicar em "Permitir notificações" ao abrir.</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="text-sm text-neutral-600 space-y-4 mt-4">
            <p>Para acessar esta área, você precisa habilitar as notificações. Isso é essencial para que você não perca os prazos das provas e as respostas do suporte.</p>
            <button 
              onClick={handlePermitir}
              className="w-full bg-[#82181A] text-white py-3 rounded-lg font-semibold hover:bg-[#631214] transition-colors cursor-pointer shadow-md"
            >
              Ativar Notificações Agora
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
