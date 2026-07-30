// App Logic - Offline, PWA, Navigation

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

// Offline/Online Status Banner
const offlineBanner = document.createElement('div');
offlineBanner.className = 'offline-banner';
offlineBanner.textContent = 'Modalità offline — dati salvati localmente';
document.body.appendChild(offlineBanner);

function updateOnlineStatus() {
  if (navigator.onLine) {
    offlineBanner.classList.remove('visible');
  } else {
    offlineBanner.classList.add('visible');
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
// Init
updateOnlineStatus();

// PWA Install Prompt (Optional enhancement as requested)
let deferredPrompt;
const installBtn = document.getElementById('installAppBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) installBtn.style.display = 'inline-block';
  console.log("PWA install prompt ready.");
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      deferredPrompt = null;
      installBtn.style.display = 'none';
    } else {
      alert("L'installazione diretta non è supportata dal tuo dispositivo/browser (es. su iPhone/Safari, usa il tasto 'Condividi' -> 'Aggiungi alla schermata Home').");
    }
  });
}

window.addEventListener('appinstalled', () => {
  if (installBtn) installBtn.style.display = 'none';
  console.log('PWA was installed');
});

// View Transitions Helper
export function navigateTo(url) {
  if (!document.startViewTransition) {
    window.location.href = url;
    return;
  }
  document.startViewTransition(() => {
    window.location.href = url;
  });
}

// Attach View Transitions to regular links (if they are local)
document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (link && link.href && link.host === window.location.host && !link.target && !link.hasAttribute('download')) {
    e.preventDefault();
    navigateTo(link.href);
  }
});
