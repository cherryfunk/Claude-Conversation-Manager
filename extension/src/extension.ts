import * as vscode from 'vscode'
import * as path from 'path'
import * as os from 'os'
import { listProjects, listConversations, getConversation } from '@ccm/shared'
import type { WebviewRequest } from '@ccm/shared'

let currentPanel: vscode.WebviewPanel | undefined

function setupPanel(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): void {
  currentPanel = panel

  panel.webview.html = getWebviewContent(panel.webview, context.extensionUri)

  panel.webview.onDidReceiveMessage(
    async (msg: WebviewRequest) => {
      try {
        let result: unknown
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
          data: result,
        })
      } catch (err) {
        panel.webview.postMessage({
          type: msg.type + ':response',
          requestId: msg.requestId,
          error: err instanceof Error ? err.message : String(err),
        })
      }
    },
    undefined,
    context.subscriptions,
  )

  // File watcher: auto-reload when conversation files change
  const claudeProjectsDir = path.join(os.homedir(), '.claude', 'projects')
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(vscode.Uri.file(claudeProjectsDir), '**/*.jsonl'),
  )

  const notify = (): void => {
    panel.webview.postMessage({ type: 'refresh' })
  }

  watcher.onDidChange(notify)
  watcher.onDidCreate(notify)
  watcher.onDidDelete(notify)

  panel.onDidDispose(() => {
    currentPanel = undefined
    watcher.dispose()
  })
}

export function activate(context: vscode.ExtensionContext): void {
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
            vscode.Uri.joinPath(context.extensionUri, 'webview'),
          ],
        },
      )

      setupPanel(panel, context)
    }),
  )

  vscode.window.registerWebviewPanelSerializer('ccm', {
    async deserializeWebviewPanel(panel: vscode.WebviewPanel): Promise<void> {
      panel.webview.options = {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'webview'),
        ],
      }
      setupPanel(panel, context)
    },
  })
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const webviewDir = vscode.Uri.joinPath(extensionUri, 'webview')
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(webviewDir, 'assets', 'index.js'),
  )
  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(webviewDir, 'assets', 'index.css'),
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

function getNonce(): string {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

export function deactivate(): void {}
