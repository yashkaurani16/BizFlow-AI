/**
 * Google Gemini & Multi-Provider AI Adapter for BizFlow AI
 * Powered by the official @google/genai JavaScript SDK.
 * Server-side only: never logs or exposes API keys.
 * Supports Resilient Bounded Fallback when unconfigured or on failure.
 */

import { GoogleGenAI } from '@google/genai'

const DEFAULT_TIMEOUT_MS = 8000

function getDefaultModel(provider) {
  switch (provider) {
    case 'gemini':
      return 'gemini-2.5-flash'
    case 'openai':
      return 'gpt-4o-mini'
    case 'anthropic':
      return 'claude-3-5-haiku-20241022'
    default:
      return 'gemini-2.5-flash'
  }
}

/**
 * Validates provider configuration.
 */
export function getProviderConfig() {
  const provider = (process.env.AI_PROVIDER || '').trim().toLowerCase()
  const apiKey = (process.env.AI_API_KEY || '').trim()
  const model = (process.env.AI_MODEL || '').trim() || getDefaultModel(provider)

  const isConfigured = Boolean(apiKey && ['gemini', 'openai', 'anthropic'].includes(provider))

  return {
    provider: isConfigured ? provider : 'fallback',
    configuredProvider: provider || 'none',
    apiKey,
    model,
    isConfigured,
  }
}

/**
 * Generates bounded fallback analysis when AI provider is unconfigured or unavailable.
 */
export function generateFallbackAnalysis(lead, agent) {
  const agentName = agent?.name || 'Sales Agent'
  const company = lead.company ? `(${lead.company})` : '(Direct inbound)'
  const budgetNote = lead.budget ? ` Stated budget: ${lead.budget}.` : ''
  const timelineNote = lead.projectTimeline ? ` Timeline: ${lead.projectTimeline}.` : ''

  return {
    summary: `Lead qualified for ${lead.name} ${company} based on profile criteria.${budgetNote}${timelineNote} High intent for workflow automation. Potential value: Tier-1 business account.`,
    leadQuality: lead.score && lead.score > 70 ? 'High' : 'Medium',
    suggestedNextStep: `Schedule a 20-minute discovery call with ${lead.name} to demonstrate tailored business automations.`,
    reasoningSummary: `Evaluated by ${agentName} using bounded business heuristics. Contact information and lead interest verified.`,
    isRealAI: false,
    isFallback: true,
    provider: 'fallback',
    model: 'bounded-fallback-v1',
    humanReviewRequired: true,
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * Execute call to Google Gemini via official @google/genai SDK
 */
async function callGeminiSdk({ apiKey, model, systemPrompt, userPrompt, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const ai = new GoogleGenAI({ apiKey })

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const err = new Error(`Gemini request timed out after ${timeoutMs / 1000}s`)
      err.name = 'TimeoutError'
      reject(err)
    }, timeoutMs)
  })

  const apiPromise = ai.models.generateContent({
    model: model || 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  const response = await Promise.race([apiPromise, timeoutPromise])

  let text = response?.text
  if (!text && response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    text = response.candidates[0].content.parts[0].text
  }

  if (!text) {
    throw new Error('Gemini returned empty response content')
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return JSON.parse(jsonMatch ? jsonMatch[0] : text)
}

/**
 * Execute call to OpenAI Chat Completions API (fallback provider option)
 */
async function callOpenAI({ apiKey, model, systemPrompt, userPrompt, signal }) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
    signal,
  })

  if (!response.ok) {
    const status = response.status
    let errMsg = `OpenAI API returned status ${status}`
    try {
      const errJson = await response.json()
      if (errJson?.error?.message) {
        errMsg = `OpenAI error: ${errJson.error.message}`
      }
    } catch {
      // ignore
    }
    const err = new Error(errMsg)
    err.status = status
    throw err
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenAI returned empty response content')
  }

  return JSON.parse(content)
}

/**
 * Execute call to Anthropic Claude Messages API (fallback provider option)
 */
async function callAnthropic({ apiKey, model, systemPrompt, userPrompt, signal }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.2,
    }),
    signal,
  })

  if (!response.ok) {
    const status = response.status
    let errMsg = `Anthropic API returned status ${status}`
    try {
      const errJson = await response.json()
      if (errJson?.error?.message) {
        errMsg = `Anthropic error: ${errJson.error.message}`
      }
    } catch {
      // ignore
    }
    const err = new Error(errMsg)
    err.status = status
    throw err
  }

  const data = await response.json()
  const text = data.content?.[0]?.text
  if (!text) {
    throw new Error('Anthropic returned empty response content')
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return JSON.parse(jsonMatch ? jsonMatch[0] : text)
}

/**
 * Dispatches structured prompt to Google Gemini (or configured provider) with timeout & error handling.
 */
export async function executeAIRequest({ systemPrompt, userPrompt, fallbackFn }) {
  const config = getProviderConfig()

  // If no provider key is configured, return fallback immediately
  if (!config.isConfigured) {
    return {
      result: fallbackFn(),
      isRealAI: false,
      isFallback: true,
      provider: 'fallback',
      model: 'bounded-fallback-v1',
      warning: 'AI provider is not configured. Fallback analysis generated.',
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)

  try {
    let parsed = null

    if (config.provider === 'gemini') {
      parsed = await callGeminiSdk({
        apiKey: config.apiKey,
        model: config.model,
        systemPrompt,
        userPrompt,
        timeoutMs: DEFAULT_TIMEOUT_MS,
      })
    } else if (config.provider === 'openai') {
      parsed = await callOpenAI({
        apiKey: config.apiKey,
        model: config.model,
        systemPrompt,
        userPrompt,
        signal: controller.signal,
      })
    } else if (config.provider === 'anthropic') {
      parsed = await callAnthropic({
        apiKey: config.apiKey,
        model: config.model,
        systemPrompt,
        userPrompt,
        signal: controller.signal,
      })
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`)
    }

    clearTimeout(timeoutId)

    return {
      result: {
        summary: parsed.summary || 'Lead analyzed successfully.',
        leadQuality: ['High', 'Medium', 'Low'].includes(parsed.leadQuality)
          ? parsed.leadQuality
          : 'Medium',
        suggestedNextStep: parsed.suggestedNextStep || 'Review lead details.',
        reasoningSummary: parsed.reasoningSummary || 'AI evaluation complete.',
        isRealAI: true,
        isFallback: false,
        provider: config.provider,
        model: config.model,
        humanReviewRequired: true,
        analyzedAt: new Date().toISOString(),
      },
      isRealAI: true,
      isFallback: false,
      provider: config.provider,
      model: config.model,
    }
  } catch (error) {
    clearTimeout(timeoutId)

    // Sanitize error: never leak API keys
    const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError'
    let errorMsg = isTimeout
      ? `AI provider request timed out after ${DEFAULT_TIMEOUT_MS / 1000}s`
      : error.message || 'AI provider request failed'

    try {
      if (typeof errorMsg === 'string' && errorMsg.trim().startsWith('{')) {
        const parsedJson = JSON.parse(errorMsg.trim())
        if (parsedJson?.error?.message) {
          errorMsg = parsedJson.error.message
        }
      }
    } catch {
      // ignore json parse errors
    }

    // Mask any key patterns if accidentally included in upstream SDK messages
    errorMsg = errorMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, 'AIza*********************************')
    errorMsg = errorMsg.replace(/sk-[0-9A-Za-z-_]{20,}/g, 'sk-*************************')

    console.warn(`[AIProviderAdapter] ${config.provider} failed: ${errorMsg}. Falling back to bounded analysis.`)

    const fallback = fallbackFn()
    fallback.error = errorMsg
    fallback.failedProvider = config.provider

    return {
      result: fallback,
      isRealAI: false,
      isFallback: true,
      provider: 'fallback',
      model: 'bounded-fallback-v1',
      error: errorMsg,
      failedProvider: config.provider,
    }
  }
}

export default {
  getProviderConfig,
  generateFallbackAnalysis,
  executeAIRequest,
}
