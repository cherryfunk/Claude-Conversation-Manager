const vscode = require('vscode')
const path = require('path')
const { listProjects, listConversations, getConversation } = require('./parser')

let currentPanel = undefined

function setupPanel(panel, context) {
  currentPanel = panel

  panel.webview.html = getWebviewContent(
    panel.webview,
    context.extensionUri
  )

  panel.webview.onDidReceiveMessage(
    async (msg) => {
      try {
        let result
        switch (msg.type) {
          case 'getProjects':
            result = await listProjects()
            break
          case 'getConversations':
            result = await listConversations(msg.projectId)
            break
          case 'getConversation':
            result = await getConversation(msg.projectId, msg.sessionId)
            break
          default:
            return
        }
        panel.webview.postMessage({
          type: msg.type + ':response',
          requestId: msg.requestId,
          data: result
        })
      } catch (err) {
        panel.webview.postMessage({
          type: msg.type + ':response',
          requestId: msg.requestId,
          error: err.message
        })
      }
    },
    undefined,
    context.subscriptions
  )

  panel.onDidDispose(() => {
    currentPanel = undefined
  })
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('ccm.open', () => {
      if (currentPanel) {
        currentPanel.reveal(vscode.ViewColumn.One)
        return
      }

      const panel = vscode.window.createWebviewPanel(
        'ccm',
        'Claude Conversation Manager',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, 'webview')
          ]
        }
      )

      setupPanel(panel, context)
    })
  )

  // Restore panel on reload
  vscode.window.registerWebviewPanelSerializer('ccm', {
    async deserializeWebviewPanel(panel, state) {
      panel.webview.options = {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'webview')
        ]
      }
      setupPanel(panel, context)
    }
  })
}

function getWebviewContent(webview, extensionUri) {
  const webviewDir = vscode.Uri.joinPath(extensionUri, 'webview')
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(webviewDir, 'assets', 'index.js')
  )
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(webviewDir, 'assets', 'index.css')
  )

  const nonce = getNonce()

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; font-src ${webview.cspSource};" />
  <link rel="stylesheet" href="${styleUri}" />
  <title>Claude Conversation Manager</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
}

function getNonce() {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

function deactivate() {}

module.exports = { activate, deactivate }
