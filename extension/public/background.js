// Escuta por mensagens do componente React
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  // Verifica se a mensagem é para abrir a janela de autenticação
  if (message.type === "open_auth_window") {
    const authUrl = message.authUrl;

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, function (redirect_uri) {
      if (chrome.runtime.lastError || redirect_uri.includes('error=access_denied')) {
        chrome.runtime.sendMessage(sender.tab?.id, { type: "auth_response", message: 'fail' });
      } else {
        chrome.runtime.sendMessage(sender.tab?.id, { type: "auth_response", message: 'success', redirect_uri });
      }
    })
  }
});
