export function extractDeepSeekSessionId(input: string): string {
  const trimmed = input.trim().replace(/^['"]+|['"]+$/g, "")
  try {
    const url = new URL(trimmed)
    const parts = url.pathname.split("/").filter(Boolean)
    const last = parts[parts.length - 1]
    if (last && last !== "s" && last !== "chat" && last !== "a") {
      return last
    }
  } catch {}

  const uuidMatch = trimmed.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i)
  if (uuidMatch) return uuidMatch[0]

  const slashMatch = trimmed.match(/\/s\/([^/?#\s]+)/i) || trimmed.match(/\/chat\/([^/?#\s]+)/i)
  if (slashMatch) return slashMatch[1]

  return trimmed
}

export async function linkBridgeSession(input: {
  url: string
  externalSessionId?: string
  bridgeUrl?: string
  lastResponseMessageId?: number | null
  title?: string
}) {
  const deepseekSessionId = extractDeepSeekSessionId(input.url)
  if (!deepseekSessionId) {
    throw new Error("ID de sessão inválido ou não encontrado na URL.")
  }
  const extId = input.externalSessionId || "default"
  const bridgeBase = input.bridgeUrl || "http://127.0.0.1:5050"

  const response = await fetch(`${bridgeBase.replace(/\/v1\/?$/, "")}/v1/session/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-session-id": extId,
    },
    body: JSON.stringify({
      externalSessionId: extId,
      deepseekSessionId,
      sessionId: deepseekSessionId,
      url: input.url,
      lastResponseMessageId: input.lastResponseMessageId,
      title: input.title,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    try {
      const json = JSON.parse(text)
      throw new Error(json.message || `HTTP ${response.status}: ${response.statusText}`)
    } catch (e: any) {
      if (e.message && !e.message.startsWith("Unexpected token")) throw e
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${text}`)
    }
  }

  if (extId !== "default") {
    try {
      await fetch(`${bridgeBase.replace(/\/v1\/?$/, "")}/v1/session/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": "default" },
        body: JSON.stringify({
          externalSessionId: "default",
          deepseekSessionId,
          sessionId: deepseekSessionId,
          url: input.url,
          lastResponseMessageId: input.lastResponseMessageId,
          title: input.title,
        }),
      })
    } catch {}
  }

  return (await response.json()) as {
    status: string
    externalSessionId: string
    deepseekSessionId: string
    lastResponseMessageId: number | null
  }
}

export async function importAndLinkDeepSeekSession(input: {
  url: string
  sdk: { client: any; fetch: typeof fetch; url: string; directory?: string }
  bridgeUrl?: string
}) {
  const deepseekSessionId = extractDeepSeekSessionId(input.url)
  if (!deepseekSessionId) {
    throw new Error("ID de sessão inválido ou não encontrado na URL.")
  }

  const bridgeBase = (input.bridgeUrl || "http://127.0.0.1:5050").replace(/\/v1\/?$/, "")

  // 1. Fetch conversation history from DeepBlack bridge
  const histResponse = await fetch(`${bridgeBase}/v1/session/history?chat_session_id=${deepseekSessionId}`)
  if (!histResponse.ok) {
    const errText = await histResponse.text()
    try {
      const errJson = JSON.parse(errText)
      throw new Error(errJson.message || `Bridge HTTP ${histResponse.status}: ${histResponse.statusText}`)
    } catch (e: any) {
      if (e.message && !e.message.startsWith("Unexpected token")) throw e
      throw new Error(`Bridge HTTP ${histResponse.status}: ${errText}`)
    }
  }

  const histData = (await histResponse.json()) as {
    status: string
    chat_session: {
      id: string
      title?: string
      current_message_id?: number | null
    }
    messages: Array<{
      message_id: number
      parent_id: number | null
      role: "user" | "assistant"
      text?: string
      reasoning?: string
      model?: string
      time?: number
    }>
    total: number
  }

  if (histData.status !== "ok") {
    throw new Error("Não foi possível recuperar a conversa do DeepSeek.")
  }

  const title = histData.chat_session?.title || "DeepSeek Conversation"

  // 2. Pre-create the session via standard SDK to ensure full workspace/git context setup
  let precreatedSessionId: string | undefined
  try {
    const created = await input.sdk.client.session.create({ title })
    if (created.data?.id) {
      precreatedSessionId = created.data.id
    }
  } catch {}

  // 3. Import messages into DeepCode server via /session/import
  const serverBase = input.sdk.url.replace(/\/$/, "")
  const importResponse = await input.sdk.fetch(`${serverBase}/session/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(input.sdk.directory ? { "x-opencode-directory": encodeURIComponent(input.sdk.directory) } : {}),
    },
    body: JSON.stringify({
      sessionID: precreatedSessionId,
      title,
      messages: histData.messages,
    }),
  })

  if (!importResponse.ok) {
    const errText = await importResponse.text()
    try {
      const errJson = JSON.parse(errText)
      throw new Error(errJson.message || `DeepCode import error HTTP ${importResponse.status}`)
    } catch (e: any) {
      if (e.message && !e.message.startsWith("Unexpected token")) throw e
      throw new Error(`DeepCode import error HTTP ${importResponse.status}: ${errText}`)
    }
  }

  const importResult = (await importResponse.json()) as {
    status: string
    session: { id: string; title: string }
    messageCount: number
  }

  const finalSessionId = importResult.session.id

  // 4. Link the new DeepCode session to the DeepSeek chat on the bridge
  const linkResult = await linkBridgeSession({
    url: input.url,
    externalSessionId: finalSessionId,
    bridgeUrl: bridgeBase,
    lastResponseMessageId: histData.chat_session?.current_message_id,
    title,
  })

  return {
    sessionId: finalSessionId,
    deepseekSessionId,
    title,
    messageCount: importResult.messageCount,
    lastResponseMessageId: linkResult.lastResponseMessageId,
  }
}
