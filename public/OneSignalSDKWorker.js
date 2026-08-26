/*
  OneSignal Service Worker
  Reference: https://documentation.onesignal.com/docs/service-worker-setup
*/
// Mantido para instalações antigas registradas no escopo raiz.
// O SDK local anterior estava corrompido; carregue sempre o arquivo oficial.
self.importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
