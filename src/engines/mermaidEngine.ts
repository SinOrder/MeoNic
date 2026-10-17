// src/engines/mermaidEngine.ts
import mermaid from 'mermaid';

let initialized = false;

export function initMermaid() {
  if (!initialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      themeVariables: {
        darkMode: true,
        background: '#0f172a',
        primaryColor: '#10b981',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#059669',
        lineColor: '#38bdf8',
        secondaryColor: '#1e293b',
        tertiaryColor: '#334155',
      },
    });
    initialized = true;
  }
}

export async function renderMermaidDiagram(code: string, id: string): Promise<{ svg: string; error?: string }> {
  try {
    initMermaid();
    // Validate first
    await mermaid.parse(code);
    const { svg } = await mermaid.render(`mermaid_${id}_${Date.now()}`, code);
    return { svg };
  } catch (err: any) {
    return { svg: '', error: err.message || 'Mermaid syntax error' };
  }
}
