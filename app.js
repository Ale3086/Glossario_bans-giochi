// App Logic - Offline, PWA, Navigation

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
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
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Here we could show a custom banner "Aggiungi a Home"
  console.log("PWA install prompt ready.");
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
