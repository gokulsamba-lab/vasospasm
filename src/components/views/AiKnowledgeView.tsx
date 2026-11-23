import React, { useMemo, useState } from 'react';
import {
  Activity,
  BookOpen01,
  ChevronDown,
  CpuChip01,
  Database01,
  HardDrive,
  HelpCircle,
  MessageChatCircle,
  SearchLg,
  Stars02,
  XClose,
} from '@untitledui/icons';
import {
  VASOSENSE_FAQ_ITEMS,
  VASOSENSE_FAQ_SECTIONS,
  type FaqItem,
  type FaqSectionId,
  type LiveTelemetryContext,
} from '../../data/vasosenseKnowledgeBase';
import type { AiChatMessage } from '../../services/aiAssistantService';
import { AiChatPanel } from '../AiChatPanel';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface AiKnowledgeViewProps {
  messages: AiChatMessage[];
  loading: boolean;
  telemetryContext: LiveTelemetryContext;
  onSendMessage: (text: string) => void;
  onClearMessages: () => void;
  onExplainFurther: (faq: FaqItem) => void;
}

function renderInlineAnswerSegments(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return segments.map((seg, idx) => {
    if (seg.startsWith('**') && seg.endsWith('**') && seg.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {seg.slice(2, -2)}
        </strong>
      );
    }
    if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
      return (
        <em key={idx} className="italic text-slate-700 dark:text-slate-300">
          {seg.slice(1, -1)}
        </em>
      );
    }
    if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 2) {
      return (
        <code
          key={idx}
          className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-900/10 dark:bg-white/10 text-sky-700 dark:text-sky-300"
        >
          {seg.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={idx}>{seg}</React.Fragment>;
  });
}

function renderFaqAnswer(answer: string) {
  const lines = answer.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={idx} className="h-1" />;
    }

    const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
    if (numMatch) {
      return (
        <div key={idx} className="flex items-start gap-2 pl-0.5 py-0.5 leading-relaxed">
          <span className="font-mono text-[11px] font-semibold text-sky-600 dark:text-sky-400 shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <span>{renderInlineAnswerSegments(numMatch[2])}</span>
        </div>
      );
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      const content = trimmed.replace(/^[-*•]\s+/, '');
      return (
        <div key={idx} className="flex items-start gap-2 pl-1 py-0.5 leading-relaxed">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
          <span>{renderInlineAnswerSegments(content)}</span>
        </div>
      );
    }

    return (
      <p key={idx} className="leading-relaxed">
        {renderInlineAnswerSegments(trimmed)}
      </p>
    );
  });
}

function getSectionIcon(sectionId: FaqSectionId) {
  switch (sectionId) {
    case 'A':
      return <HelpCircle className="w-4 h-4" aria-hidden="true" />;
    case 'B':
      return <Activity className="w-4 h-4" aria-hidden="true" />;
    case 'C':
      return <CpuChip01 className="w-4 h-4" aria-hidden="true" />;
    case 'D':
      return <Database01 className="w-4 h-4" aria-hidden="true" />;
    case 'E':
      return <HardDrive className="w-4 h-4" aria-hidden="true" />;
  }
}

export function AiKnowledgeView({
  messages,
  loading,
  telemetryContext,
  onSendMessage,
  onClearMessages,
  onExplainFurther,
}: AiKnowledgeViewProps) {
  const [sectionFilter, setSectionFilter] = useState<'ALL' | FaqSectionId>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(['Q1']));

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    return VASOSENSE_FAQ_SECTIONS.filter(
      (sec) => sectionFilter === 'ALL' || sec.id === sectionFilter
    )
      .map((sec) => {
        if (!normalizedQuery) return sec;
        const matchedItems = sec.items.filter(
          (item) =>
            item.id.toLowerCase().includes(normalizedQuery) ||
            item.question.toLowerCase().includes(normalizedQuery) ||
            item.answer.toLowerCase().includes(normalizedQuery) ||
            sec.title.toLowerCase().includes(normalizedQuery)
        );
        return { ...sec, items: matchedItems };
      })
      .filter((sec) => sec.items.length > 0);
  }, [sectionFilter, normalizedQuery]);

  const totalMatches = useMemo(
    () => filteredSections.reduce((acc, sec) => acc + sec.items.length, 0),
    [filteredSections]
  );

  const toggleCard = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAllVisible = () => {
    const next = new Set<string>(expandedIds);
    for (const sec of filteredSections) {
      for (const item of sec.items) {
        next.add(item.id);
      }
    }
    setExpandedIds(next);
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            VasoSense AI Assistant &amp; Knowledge Guide
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Search all {VASOSENSE_FAQ_ITEMS.length} clinical &amp; hardware FAQs across Sections A–E or ask
            VasoSense AI with live telemetry grounding
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="mint" className="gap-1.5 font-mono tabular-nums">
            <BookOpen01 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{VASOSENSE_FAQ_ITEMS.length} Q&amp;As Embedded</span>
          </Badge>
          <Badge variant="blue" className="gap-1.5">
            <Stars02 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Gemini Telemetry Grounded</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Searchable & Categorized 40-Q&A FAQ Browser */}
        <div className="xl:col-span-7 space-y-4 min-w-0">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                <BookOpen01 className="w-4 h-4 text-sky-500 shrink-0" aria-hidden="true" />
                <span>Complete Knowledge Base Browser (Sections A–E)</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral" className="font-mono tabular-nums">
                  {totalMatches} / {VASOSENSE_FAQ_ITEMS.length} Q&amp;As
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExpandAllVisible}
                  className="h-7 px-2.5 text-[11px]"
                >
                  Expand All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCollapseAll}
                  className="h-7 px-2.5 text-[11px]"
                >
                  Collapse All
                </Button>
              </div>
            </div>

            {/* Keyword Search Bar */}
            <div className="relative flex items-center min-w-0">
              <SearchLg
                className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 40 Q&As (e.g., Perfusion Index, SpO2, PhysioNet, TMP117, triggers)..."
                aria-label="Search VasoSense 40-question FAQ knowledge base"
                className="pl-10 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear FAQ search"
                  className="absolute right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                >
                  <XClose className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Section Filter Tabs */}
            <Tabs
              value={sectionFilter}
              onValueChange={(v) => setSectionFilter(v as 'ALL' | FaqSectionId)}
            >
              <TabsList className="w-full flex flex-wrap justify-start gap-1">
                <TabsTrigger value="ALL" className="text-[11px] px-2.5 py-1.5">
                  All ({VASOSENSE_FAQ_ITEMS.length})
                </TabsTrigger>
                {VASOSENSE_FAQ_SECTIONS.map((sec) => (
                  <TabsTrigger
                    key={sec.id}
                    value={sec.id}
                    className="text-[11px] px-2.5 py-1.5"
                  >
                    Sec {sec.id} · {sec.shortTitle} ({sec.items.length})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </Card>

          {filteredSections.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                No Q&amp;As matched &ldquo;{searchQuery}&rdquo;
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Try another keyword (e.g., Raynaud&apos;s, PI, delta T, Cortex-M33, PhysioNet, microSD)
                or ask VasoSense AI directly.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSectionFilter('ALL');
                  }}
                >
                  Reset Search &amp; Filters
                </Button>
                {searchQuery.trim() && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      onExplainFurther({
                        id: 'Custom',
                        number: 0,
                        sectionId: 'A',
                        sectionTitle: 'Custom Inquiry',
                        question: searchQuery.trim(),
                        answer: '',
                      })
                    }
                  >
                    <Stars02 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ask VasoSense AI in Drawer</span>
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            filteredSections.map((section) => (
              <Card key={section.id} className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-white/55 dark:border-white/10">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-400/25 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                      {getSectionIcon(section.id)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                        {section.title}
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                        {section.items.length}{' '}
                        {section.items.length === 1 ? 'question' : 'questions'} in this section
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {section.items.map((faq) => {
                    const isExpanded = expandedIds.has(faq.id);
                    return (
                      <div
                        key={faq.id}
                        className="glass-well rounded-2xl overflow-hidden transition-all"
                      >
                        <button
                          type="button"
                          onClick={() => toggleCard(faq.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`faq-panel-${faq.id}`}
                          className="w-full px-3.5 py-3 flex items-start justify-between gap-3 text-left hover:bg-white/40 dark:hover:bg-white/[0.04] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="font-mono tabular-nums text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-400/30 shrink-0 mt-0.5">
                              {faq.id}
                            </span>
                            <span className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-white leading-snug">
                              {faq.question}
                            </span>
                          </div>

                          <ChevronDown
                            className={`w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180 text-sky-500' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>

                        {isExpanded && (
                          <div
                            id={`faq-panel-${faq.id}`}
                            className="px-3.5 pb-3.5 pt-1 border-t border-white/45 dark:border-white/10 space-y-3"
                          >
                            <div className="text-xs text-slate-700 dark:text-slate-200 space-y-1.5 pt-1.5">
                              {renderFaqAnswer(faq.answer)}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                Section {faq.sectionId} · {faq.id}
                              </span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => onExplainFurther(faq)}
                                className="h-auto py-1.5 px-3 whitespace-normal text-left"
                              >
                                <Stars02 className="w-3.5 h-3.5 text-sky-500 shrink-0" aria-hidden="true" />
                                <span>Ask AI to explain further</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Sticky Interactive AI Console */}
        <Card className="xl:col-span-5 xl:sticky xl:top-20 p-5 sm:p-6 flex flex-col min-w-0">
          <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-white/55 dark:border-white/12">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] via-[#1D8CF8] to-[#06B6D4] text-white flex items-center justify-center shadow-[0_6px_16px_-4px_rgba(29,140,248,0.5)] shrink-0">
                <MessageChatCircle className="w-4 h-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                  Ask VasoSense AI
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grounded in all 40 Q&amp;As plus your real-time PI%, ΔT, pallor, and ML state
                </p>
              </div>
            </div>
          </div>

          <AiChatPanel
            messages={messages}
            loading={loading}
            telemetryContext={telemetryContext}
            onSendMessage={onSendMessage}
            onClearMessages={onClearMessages}
          />
        </Card>
      </div>
    </div>
  );
}
