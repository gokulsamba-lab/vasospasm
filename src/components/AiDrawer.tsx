import React from 'react';
import { Stars02, XClose } from '@untitledui/icons';
import type { LiveTelemetryContext } from '../data/vasosenseKnowledgeBase';
import type { AiChatMessage } from '../services/aiAssistantService';
import { AiChatPanel } from './AiChatPanel';
import { Button } from './ui/button';

interface AiDrawerProps {
  open: boolean;
  hideFloatingButton: boolean;
  onOpenChange: (open: boolean) => void;
  messages: AiChatMessage[];
  loading: boolean;
  telemetryContext: LiveTelemetryContext;
  onSendMessage: (text: string) => void;
  onClearMessages: () => void;
  draftPrompt?: { id: number; text: string } | null;
}

export function AiDrawer({
  open,
  hideFloatingButton,
  onOpenChange,
  messages,
  loading,
  telemetryContext,
  onSendMessage,
  onClearMessages,
  draftPrompt = null,
}: AiDrawerProps) {
  return (
    <>
      {/* Floating Bottom-Right Launcher (Desktop only; mobile uses bottom tab bar) */}
      {!open && !hideFloatingButton && (
        <button
          type="button"
          onClick={() => onOpenChange(true)}
          aria-label="Ask VasoSense AI"
          className="no-print hidden lg:inline-flex fixed bottom-5 right-5 z-40 items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] text-white text-xs font-semibold border border-white/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_14px_34px_-6px_rgba(29,140,248,0.65)] hover:brightness-110 active:scale-[0.97] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Stars02 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Ask VasoSense AI</span>
          <span
            className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]"
            aria-hidden="true"
          />
        </button>
      )}

      {/* Collapsible Frosted Glass Bottom Sheet (mobile) / Side-Drawer (desktop) */}
      {open && (
        <div className="no-print fixed inset-0 z-50 flex items-end lg:items-stretch lg:justify-end">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-drawer-title"
            className="glass-surface relative z-10 h-[88vh] lg:h-full w-full lg:w-[460px] max-w-full rounded-t-3xl lg:rounded-none lg:rounded-l-3xl p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-5 flex flex-col shadow-2xl"
          >
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full mx-auto mb-3 lg:hidden shrink-0" aria-hidden="true" />
            <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-white/55 dark:border-white/12 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] text-white flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_16px_-4px_rgba(29,140,248,0.55)] shrink-0">
                  <Stars02 className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="ai-drawer-title"
                    className="text-sm font-semibold text-slate-900 dark:text-white truncate"
                  >
                    VasoSense AI Assistant
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Live Telemetry &amp; Clinical Engineering Guide
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onOpenChange(false)}
                aria-label="Close VasoSense AI drawer"
              >
                <XClose className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex-1 min-h-0">
              <AiChatPanel
                compact
                messages={messages}
                loading={loading}
                telemetryContext={telemetryContext}
                onSendMessage={onSendMessage}
                onClearMessages={onClearMessages}
                draftPrompt={draftPrompt}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
