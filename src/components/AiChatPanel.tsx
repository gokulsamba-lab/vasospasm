import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  InfoCircle,
  MessageChatCircle,
  Send01,
  Stars02,
  Trash01,
} from '@untitledui/icons';
import { Chip } from '@mui/material';
import {
  QUICK_ASK_CATEGORIES,
  cleanMathDisplayText,
  type LiveTelemetryContext,
  type QuickAskCategory,
} from '../data/vasosenseKnowledgeBase';
import type { AiChatMessage } from '../services/aiAssistantService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';

interface AiChatPanelProps {
  messages: AiChatMessage[];
  loading: boolean;
  telemetryContext: LiveTelemetryContext;
  onSendMessage: (text: string) => void;
  onClearMessages: () => void;
  compact?: boolean;
  draftPrompt?: { id: number; text: string } | null;
}

function formatInlineSegments(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return segments.map((seg, sIdx) => {
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
      return (
        <strong key={sIdx} className="font-semibold text-slate-950 dark:text-white">
          {seg.slice(2, -2)}
        </strong>
      );
    }
    if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
      return (
        <em key={sIdx} className="italic text-slate-600 dark:text-slate-300">
          {seg.slice(1, -1)}
        </em>
      );
    }
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
      return (
        <code
          key={sIdx}
          className="font-mono text-[11px] px-1 py-0.5 rounded bg-slate-900/10 dark:bg-white/10 text-sky-700 dark:text-sky-300"
        >
          {seg.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={sIdx}>{seg}</React.Fragment>;
  });
}

function renderFormattedText(content: string) {
  const lines = cleanMathDisplayText(content).split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className="h-1.5" />;
    }

    if (/^---+$/.test(trimmed)) {
      return <hr key={idx} className="my-2 border-slate-300/60 dark:border-white/12" />;
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,3}\s+/, '');
      return (
        <h4 key={idx} className="text-xs font-semibold text-slate-950 dark:text-white pt-1.5">
          {formatInlineSegments(heading)}
        </h4>
      );
    }

    const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5 leading-relaxed">
          <span className="font-mono text-[11px] font-semibold text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <span>{formatInlineSegments(numMatch[2])}</span>
        </div>
      );
    }

    const isBullet = /^[-*•]\s+/.test(trimmed);
    const cleanText = isBullet ? trimmed.replace(/^[-*•]\s+/, '') : trimmed;

    if (isBullet) {
      return (
        <div key={idx} className="flex items-start gap-2 pl-1 py-0.5 leading-relaxed">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
          <span>{formatInlineSegments(cleanText)}</span>
        </div>
      );
    }

    return (
      <p key={idx} className="leading-relaxed">
        {formatInlineSegments(cleanText)}
      </p>
    );
  });
}

export function AiChatPanel({
  messages,
  loading,
  telemetryContext,
  onSendMessage,
  onClearMessages,
  compact = false,
  draftPrompt = null,
}: AiChatPanelProps) {
  const [input, setInput] = useState('');
  const [chipCategory, setChipCategory] = useState<QuickAskCategory['id']>('live');
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  useEffect(() => {
    if (draftPrompt && draftPrompt.text) {
      setInput(draftPrompt.text);
      const timer = window.setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [draftPrompt]);

  const activeCategory =
    QUICK_ASK_CATEGORIES.find((c) => c.id === chipCategory) ?? QUICK_ASK_CATEGORIES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput('');
    onSendMessage(trimmed);
  };

  const classStatusLabel = telemetryContext.high_motion_flag
    ? 'Motion Discard'
    : telemetryContext.ml_class === 2
    ? 'Active Spasm'
    : telemetryContext.ml_class === 1
    ? 'Cooling Risk'
    : 'Normal Flow';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Live Telemetry Context Strip */}
      <div className="glass-well rounded-2xl p-3 mb-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]" />
            <span>Live Telemetry Context Synced</span>
          </span>
          <Badge
            variant={
              telemetryContext.high_motion_flag || telemetryContext.ml_class === 1
                ? 'amber'
                : telemetryContext.ml_class === 2
                ? 'rose'
                : 'mint'
            }
          >
            {classStatusLabel}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Chip
            size="small"
            label={`PI ${telemetryContext.perfusion_index.toFixed(2)}%`}
            sx={{
              height: 20,
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              bgcolor: 'rgba(56, 189, 248, 0.14)',
              color: '#38BDF8',
            }}
          />
          <Chip
            size="small"
            label={`ΔT ${telemetryContext.delta_t.toFixed(2)}°C`}
            sx={{
              height: 20,
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              bgcolor: 'rgba(245, 158, 11, 0.14)',
              color: '#F59E0B',
            }}
          />
          <Chip
            size="small"
            label={`Pallor ${(telemetryContext.pallor_index * 100).toFixed(0)}%`}
            sx={{
              height: 20,
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              bgcolor: 'rgba(16, 185, 129, 0.14)',
              color: '#10B981',
            }}
          />
          <Chip
            size="small"
            label={`${telemetryContext.recentEpisodeCount} Episodes`}
            sx={{
              height: 20,
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              bgcolor: 'rgba(148, 163, 184, 0.16)',
              color: 'inherit',
            }}
          />
        </div>
      </div>

      {/* Quick-Ask Categorized Suggestion Chips */}
      <div className="mb-3 space-y-2 shrink-0">
        <Tabs
          value={chipCategory}
          onValueChange={(val) => setChipCategory(val as QuickAskCategory['id'])}
        >
          <TabsList className="w-full flex flex-wrap justify-start gap-1">
            {QUICK_ASK_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-[11px] px-2.5 py-1">
                {compact ? cat.label.replace("Raynaud's & ", '') : cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-1.5">
          {activeCategory.questions.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => onSendMessage(q)}
              className="text-left text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-white/55 dark:bg-white/[0.06] hover:bg-white/80 dark:hover:bg-white/[0.12] border border-white/70 dark:border-white/15 text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Transcript */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto pr-1 space-y-3 ${
          compact ? 'max-h-[46vh]' : 'min-h-[320px] max-h-[520px]'
        }`}
      >
        {messages.length === 0 ? (
          <div className="glass-well rounded-2xl p-5 text-center space-y-2.5 my-2">
            <div className="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] text-white flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(29,140,248,0.5)]">
              <Stars02 className="w-5 h-5" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Ask VasoSense AI About Your Readings or Hardware
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Your live FRDM-MCXN236 Perfusion Index, Dual TMP117 thermal gradient (ΔT), spectral
              pallor, and motion score are automatically included so answers reflect your current
              state.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs space-y-1.5 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_8px_20px_-6px_rgba(29,140,248,0.5)]'
                    : msg.isError
                    ? 'glass-surface border-rose-400/50 text-rose-900 dark:text-rose-200'
                    : 'glass-well text-slate-700 dark:text-slate-200'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 pb-0.5">
                    <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
                      {msg.isError ? (
                        <AlertCircle className="w-3 h-3 text-rose-500" aria-hidden="true" />
                      ) : (
                        <MessageChatCircle className="w-3 h-3" aria-hidden="true" />
                      )}
                      <span>VasoSense AI</span>
                    </span>
                    {msg.model && <span>{msg.model}</span>}
                  </div>
                )}
                {msg.role === 'user' ? (
                  <p className="leading-relaxed">{msg.content}</p>
                ) : (
                  <div className="space-y-1">{renderFormattedText(msg.content)}</div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-start">
            <div className="glass-well rounded-2xl px-3.5 py-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>Analyzing live telemetry &amp; clinical knowledge base...</span>
            </div>
          </div>
        )}
        <div ref={scrollEndRef} />
      </div>

      {/* Educational Disclaimer + Input Bar */}
      <div className="pt-3 mt-3 border-t border-white/55 dark:border-white/12 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <InfoCircle className="w-3.5 h-3.5 shrink-0 text-sky-500" aria-hidden="true" />
            <span>
              Educational telemetry tool only — not a medical diagnosis or substitute for a
              rheumatologist.
            </span>
          </span>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearMessages}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 transition-colors shrink-0"
              aria-label="Clear AI chat history"
            >
              <Trash01 className="w-3 h-3" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2 min-w-0">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your PI%, ΔT, Raynaud's, or MCXN236 sensors..."
            aria-label="Ask VasoSense AI"
            disabled={loading}
            className="flex-1 min-w-0"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message to VasoSense AI"
            className="shrink-0"
          >
            <Send01 className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Ask</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
