export const DEFAULT_INJECT_URL =
  "https://raw.githubusercontent.com/azurejoga/DeepSeek-jailbreak/refs/heads/master/README.md"

export async function fetchRawPrompt(url?: string, customFetch: typeof fetch = fetch): Promise<string> {
  const targetUrl = (url && url.trim()) || DEFAULT_INJECT_URL
  const response = await customFetch(targetUrl)
  if (!response.ok) {
    throw new Error(`Falha HTTP ao baixar prompt (${response.status} ${response.statusText})`)
  }
  const text = await response.text()
  if (!text || !text.trim()) {
    throw new Error("O prompt retornado da URL está vazio.")
  }
  return text
}
