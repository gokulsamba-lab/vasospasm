/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PrimeReactProvider } from 'primereact/api';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button } from './components/ui/button';
import type {
  AppView,
  CalibrationBaseline,
  DataSourceMode,
  HardwareConnectionState,
  PatientProfile,
  SimulatorScenario,
  SymptomLog,
  TelemetryPacket,
  VasospasmEpisode,
} from './types/telemetry';
import {
  DEFAULT_DEMO_PROFILE,
  createSeedEpisodes,
  createSeedSymptomLogs,
} from './data/seedData';
import { HardwareBridge, TelemetrySimulator } from './services/hardwareBridge';
import { AuthGate } from './components/AuthGate';
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileMoreSheet } from './components/MobileMoreSheet';
import { OfflineIndicator } from './components/PWAInstallButton';
import { type ChartPoint } from './components/SynchronizedChart';
import { LiveDashboardView } from './components/views/LiveDashboardView';
import { EpisodeHistoryView } from './components/views/EpisodeHistoryView';
import { OfflineSyncView } from './components/views/OfflineSyncView';
import { DiagnosticsView } from './components/views/DiagnosticsView';
import { ClinicalReportView } from './components/views/ClinicalReportView';
import { AccountPairingView } from './components/views/AccountPairingView';
import { AiKnowledgeView } from './components/views/AiKnowledgeView';
import { AiDrawer } from './components/AiDrawer';
import { sendAiAssistantMessage, type AiChatMessage } from './services/aiAssistantService';
import type { FaqItem, LiveTelemetryContext } from './data/vasosenseKnowledgeBase';

const STORAGE_KEYS = {
  accounts: 'vasosense_accounts_v1',
  session: 'vasosense_active_profile_v1',
  episodes: 'vasosense_episodes_v1',
  symptoms: 'vasosense_symptom_logs_v1',
  theme: 'vasosense_theme_v1',
};

function playClinicalAlertBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
    window.setTimeout(() => {
      void ctx.close();
    }, 450);
  } catch {
    // Audio playback may be blocked prior to user gesture
  }
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.theme);
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
          primary: { main: '#1F75FE' },
          success: { main: '#00D18A' },
          warning: { main: '#E08E45' },
          error: { main: '#F43F5E' },
          background: {
            default: theme === 'dark' ? '#0B0C10' : '#F8FAFC',
            paper: theme === 'dark' ? '#14161D' : '#FFFFFF',
          },
        },
        typography: {
          fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }),
    [theme]
  );

  const [profile, setProfile] = useState<PatientProfile | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('autostart') === '1') {
          return DEFAULT_DEMO_PROFILE;
        }
      }
      const raw = localStorage.getItem(STORAGE_KEYS.session);
      return raw ? (JSON.parse(raw) as PatientProfile) : null;
    } catch {
      return null;
    }
  });

  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [episodes, setEpisodes] = useState<VasospasmEpisode[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.episodes);
      return raw ? (JSON.parse(raw) as VasospasmEpisode[]) : createSeedEpisodes();
    } catch {
      return createSeedEpisodes();
    }
  });

  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.symptoms);
      return raw ? (JSON.parse(raw) as SymptomLog[]) : createSeedSymptomLogs();
    } catch {
      return createSeedSymptomLogs();
    }
  });

  const simulatorRef = useRef<TelemetrySimulator>(new TelemetrySimulator());
  const bridgeRef = useRef<HardwareBridge>(new HardwareBridge());

  const [scenario, setScenario] = useState<SimulatorScenario>('normal');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [rollingSec, setRollingSec] = useState(12);
  const prevMlClassRef = useRef<number>(0);

  // Pre-seed 24 initial telemetry frames for immediate chart visibility
  const initialBuffer = useRef<{ latest: TelemetryPacket; points: ChartPoint[] } | null>(null);
  if (!initialBuffer.current) {
    const pts: ChartPoint[] = [];
    const baseMs = Date.now() - 24 * 1000;
    let lastPkt = simulatorRef.current.nextPacket(new Date(baseMs));
    for (let i = 0; i < 24; i += 1) {
      const t = new Date(baseMs + i * 1000);
      lastPkt = simulatorRef.current.nextPacket(t);
      pts.push({
        timeLabel: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        packet: lastPkt,
      });
    }
    initialBuffer.current = { latest: lastPkt, points: pts };
  }

  const [latestPacket, setLatestPacket] = useState<TelemetryPacket>(initialBuffer.current.latest);
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>(initialBuffer.current.points);

  const [connection, setConnection] = useState<HardwareConnectionState>({
    mode: 'simulator',
    connected: true,
    deviceLabel: 'VasoSense-MCXN236',
    transportDetail: 'Simulator (1 Hz)',
    errorMessage: null,
  });

  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiDraftPrompt, setAiDraftPrompt] = useState<{ id: number; text: string } | null>(null);
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiMessagesRef = useRef<AiChatMessage[]>([]);
  aiMessagesRef.current = aiMessages;

  // Sync Tailwind .dark class on <html> and <meta name="theme-color">
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.theme, theme);

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'dark' ? '#050814' : '#EAF1FB');
    }
  }, [theme]);

  // Persist active profile, episodes, and symptom logs
  useEffect(() => {
    if (profile) {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(profile));
    } else {
      localStorage.removeItem(STORAGE_KEYS.session);
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.episodes, JSON.stringify(episodes));
  }, [episodes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.symptoms, JSON.stringify(symptomLogs));
  }, [symptomLogs]);

  const ingestPacket = useCallback(
    (pkt: TelemetryPacket) => {
      setLatestPacket(pkt);
      const timeLabel = new Date(pkt.rtc_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setChartPoints((prev) => [...prev.slice(-59), { timeLabel, packet: pkt }]);

      setRollingSec((prev) => (prev >= 30 ? 8 : prev + 1));

      if (alertsEnabled && pkt.ml_class === 2 && prevMlClassRef.current !== 2 && !pkt.high_motion_flag) {
        playClinicalAlertBeep();
      }
      prevMlClassRef.current = pkt.ml_class;

      if (pkt.hw_event_btn) {
        const hwLog: SymptomLog = {
          id: `SYM-${Math.floor(1000 + Math.random() * 8999)}`,
          timestamp: pkt.rtc_time,
          source: 'hw_button',
          trigger: 'Cold Exposure',
          stage: pkt.pallor_index > 0.6 ? 'Blue (Cyanosis)' : 'White (Pallor)',
          severity: pkt.ml_class === 2 ? 4 : 3,
          piAtEvent: pkt.perfusion_index,
          deltaTAtEvent: pkt.delta_t,
          notes: 'Physical hardware event button pressed on FRDM-MCXN236 wrist unit.',
          annotated: false,
        };
        setSymptomLogs((prev) => [hwLog, ...prev]);
      }
    },
    [alertsEnabled]
  );

  // Simulator 1 Hz tick loop when in Simulator Mode
  useEffect(() => {
    if (!profile || connection.mode !== 'simulator') return;
    const interval = window.setInterval(() => {
      const pkt = simulatorRef.current.nextPacket(new Date());
      ingestPacket(pkt);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [profile, connection.mode, ingestPacket]);

  const handleSelectScenario = (nextScenario: SimulatorScenario) => {
    setScenario(nextScenario);
    simulatorRef.current.setScenario(nextScenario);
    // Emit immediate packet so UI updates responsively on click
    const pkt = simulatorRef.current.nextPacket(new Date());
    ingestPacket(pkt);
  };

  const handleTriggerHwButton = () => {
    simulatorRef.current.triggerHardwareButton();
    const pkt = simulatorRef.current.nextPacket(new Date());
    ingestPacket(pkt);
  };

  const handlePairBle = async () => {
    await bridgeRef.current.disconnect();
    setConnection({
      mode: 'ble',
      connected: false,
      deviceLabel: 'VasoSense-MCXN236',
      transportDetail: 'Connecting BLE...',
      errorMessage: null,
    });
    try {
      const info = await bridgeRef.current.connectBle(
        ingestPacket,
        (reason) =>
          setConnection((prev) => ({
            ...prev,
            connected: false,
            errorMessage: reason,
          }))
      );
      setConnection({
        mode: 'ble',
        connected: true,
        deviceLabel: info.deviceName,
        transportDetail: 'BLE GATT NUS',
        errorMessage: null,
      });
    } catch (err) {
      setConnection({
        mode: 'ble',
        connected: false,
        deviceLabel: 'VasoSense-MCXN236',
        transportDetail: 'BLE Disconnected',
        errorMessage: err instanceof Error ? err.message : 'Unable to pair via Web Bluetooth.',
      });
    }
  };

  const handlePairSerial = async () => {
    await bridgeRef.current.disconnect();
    setConnection({
      mode: 'serial',
      connected: false,
      deviceLabel: 'FRDM-MCXN236',
      transportDetail: 'Opening USB-UART...',
      errorMessage: null,
    });
    try {
      const info = await bridgeRef.current.connectSerial(
        ingestPacket,
        (reason) =>
          setConnection((prev) => ({
            ...prev,
            connected: false,
            errorMessage: reason,
          }))
      );
      setConnection({
        mode: 'serial',
        connected: true,
        deviceLabel: 'FRDM-MCXN236 USB-UART',
        transportDetail: info.portLabel,
        errorMessage: null,
      });
    } catch (err) {
      setConnection({
        mode: 'serial',
        connected: false,
        deviceLabel: 'FRDM-MCXN236',
        transportDetail: 'Serial Disconnected',
        errorMessage: err instanceof Error ? err.message : 'Unable to open Web Serial port.',
      });
    }
  };

  const handlePairSimulated = () => {
    void bridgeRef.current.disconnect();
    setConnection({
      mode: 'simulator',
      connected: true,
      deviceLabel: 'VasoSense-MCXN236',
      transportDetail: 'Simulator (1 Hz)',
      errorMessage: null,
    });
  };

  const handleChangeDataSource = (mode: DataSourceMode) => {
    if (mode === 'simulator') {
      handlePairSimulated();
    } else if (mode === 'ble') {
      void handlePairBle();
    } else {
      void handlePairSerial();
    }
  };

  const handleSyncRtc = async () => {
    const now = new Date();
    await bridgeRef.current.syncRtcTime(now);
    setProfile((prev) => (prev ? { ...prev, rtcLastSyncedAt: now.toISOString() } : prev));
  };

  const handleUpdateProfile = (next: PatientProfile) => {
    setProfile(next);
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.accounts);
      const accounts = raw ? (JSON.parse(raw) as Record<string, { passwordHash: string; profile: PatientProfile }>) : {};
      const key = next.email.toLowerCase();
      if (accounts[key]) {
        accounts[key] = { ...accounts[key], profile: next };
        localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
      }
    } catch {
      // Ignore storage error
    }
  };

  const handleSaveCalibration = (cal: CalibrationBaseline) => {
    if (!profile) return;
    handleUpdateProfile({
      ...profile,
      calibration: cal,
      baselineFingertipTempC: cal.restingFingertipTempC,
    });
  };

  const handleAddSymptomLog = (
    entry: Omit<SymptomLog, 'id' | 'timestamp' | 'piAtEvent' | 'deltaTAtEvent'>
  ) => {
    const newLog: SymptomLog = {
      ...entry,
      id: `SYM-${Math.floor(1000 + Math.random() * 8999)}`,
      timestamp: new Date().toISOString(),
      piAtEvent: latestPacket.perfusion_index,
      deltaTAtEvent: latestPacket.delta_t,
    };
    setSymptomLogs((prev) => [newLog, ...prev]);

    // Also append a corresponding episode record if current readings show active cooling/vasospasm
    if (latestPacket.ml_class >= 1) {
      const nowIso = new Date().toISOString();
      const newEp: VasospasmEpisode = {
        id: `EP-${new Date().getFullYear()}-${Math.floor(200 + Math.random() * 799)}`,
        startedAt: new Date(Date.now() - 8 * 60000).toISOString(),
        endedAt: nowIso,
        durationMin: 8,
        recoveryTimeMin: 6,
        nadirPiPct: latestPacket.perfusion_index,
        nadirDeltaTC: latestPacket.delta_t,
        nadirFingertipTempC: latestPacket.t_fingertip,
        peakPallorIndex: latestPacket.pallor_index,
        trigger: entry.trigger,
        stage: entry.stage,
        severity: entry.severity,
        hwButtonConfirmed: false,
        notes: entry.notes,
        samples: chartPoints.slice(-10).map((cp, idx) => ({
          minuteOffset: idx,
          timestamp: cp.packet.rtc_time,
          perfusion_index: cp.packet.perfusion_index,
          delta_t: cp.packet.delta_t,
          t_fingertip: cp.packet.t_fingertip,
          t_dorsal: cp.packet.t_dorsal,
          pallor_index: cp.packet.pallor_index,
          rgb_r: cp.packet.rgb_r,
          rgb_g: cp.packet.rgb_g,
          rgb_b: cp.packet.rgb_b,
          ml_class: cp.packet.ml_class,
        })),
      };
      setEpisodes((prev) => [newEp, ...prev]);
    }
  };

  const handleAnnotateSymptomLog = (id: string, updates: Partial<SymptomLog>) => {
    setSymptomLogs((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const liveTelemetryContext: LiveTelemetryContext = useMemo(
    () => ({
      perfusion_index: latestPacket.perfusion_index,
      ppg_ac: latestPacket.ppg_ac,
      ppg_dc: latestPacket.ppg_dc,
      ppg_snr: latestPacket.ppg_snr,
      t_fingertip: latestPacket.t_fingertip,
      t_dorsal: latestPacket.t_dorsal,
      delta_t: latestPacket.delta_t,
      cooling_rate: latestPacket.cooling_rate,
      pallor_index: latestPacket.pallor_index,
      motion_score: latestPacket.motion_score,
      high_motion_flag: latestPacket.high_motion_flag,
      hand_elevation_deg: latestPacket.hand_elevation_deg,
      ml_class: latestPacket.ml_class,
      ml_confidence: latestPacket.ml_confidence,
      recentEpisodeCount: episodes.length,
      monitoredHand: profile?.monitoredHand,
      raynaudsType: profile?.raynaudsType,
    }),
    [latestPacket, episodes.length, profile]
  );

  const handleSendAiMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || aiLoading) return;

      const userMsg: AiChatMessage = {
        id: `ai-u-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      const historyForApi = [
        ...aiMessagesRef.current
          .filter((m) => !m.isError)
          .map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: trimmed },
      ];

      setAiMessages((prev) => [...prev, userMsg]);
      setAiLoading(true);

      try {
        const res = await sendAiAssistantMessage(historyForApi, liveTelemetryContext);
        const assistantMsg: AiChatMessage = {
          id: `ai-a-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          timestamp: new Date().toISOString(),
          model: res.model,
        };
        setAiMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const errText =
          err instanceof Error ? err.message : 'Unable to reach VasoSense AI right now.';
        setAiMessages((prev) => [
          ...prev,
          {
            id: `ai-e-${Date.now()}`,
            role: 'assistant',
            content: errText,
            timestamp: new Date().toISOString(),
            isError: true,
          },
        ]);
      } finally {
        setAiLoading(false);
      }
    },
    [aiLoading, liveTelemetryContext]
  );

  const handleExplainFaqInDrawer = useCallback((faq: FaqItem) => {
    const label = faq.id === 'Custom' ? '' : `${faq.id}: `;
    setAiDraftPrompt({
      id: Date.now(),
      text: `Please explain ${label}${faq.question} in detail and relate it to my current live sensor telemetry.`,
    });
    setAiDrawerOpen(true);
  }, []);

  const handleSignOut = () => {
    void bridgeRef.current.disconnect();
    setProfile(null);
    setActiveView('dashboard');
    setAiDrawerOpen(false);
  };

  if (!profile) {
    return (
      <PrimeReactProvider>
        <ThemeProvider theme={muiTheme}>
          <AuthGate
            accountsKey={STORAGE_KEYS.accounts}
            onAuthenticated={(p) => setProfile(p)}
          />
        </ThemeProvider>
      </PrimeReactProvider>
    );
  }

  return (
    <PrimeReactProvider>
      <ThemeProvider theme={muiTheme}>
        <div className="min-h-screen flex bg-[#EAF1FB] dark:bg-[#050814] text-slate-900 dark:text-slate-100 antialiased relative selection:bg-sky-400/30">
          {/* Atmospheric Aurora Light Field for Real Glass Refraction */}
          <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print">
            <div className="absolute -top-32 -left-24 w-[520px] h-[520px] rounded-full bg-sky-400/30 dark:bg-[#1D4ED8]/28 blur-[120px]" />
            <div className="absolute top-1/4 right-[-8%] w-[560px] h-[560px] rounded-full bg-cyan-300/35 dark:bg-[#06B6D4]/20 blur-[130px]" />
            <div className="absolute bottom-[-14%] left-1/3 w-[540px] h-[540px] rounded-full bg-emerald-300/25 dark:bg-[#10B981]/16 blur-[130px]" />
            <div className="absolute top-1/2 left-[-6%] w-[380px] h-[380px] rounded-full bg-indigo-300/25 dark:bg-[#4F46E5]/20 blur-[110px]" />
          </div>

          <Sidebar
            activeView={activeView}
            onSelectView={setActiveView}
            profile={profile}
            connection={connection}
            batteryPct={latestPacket.battery_pct}
            mobileOpen={false}
            onCloseMobile={() => setMobileMenuOpen(false)}
            onSignOut={handleSignOut}
          />

          <div className="flex-1 min-w-0 flex flex-col relative z-10">
            <HeaderBar
              activeView={activeView}
              profile={profile}
              connection={connection}
              theme={theme}
              onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              onChangeDataSource={handleChangeDataSource}
              onBackToDashboard={() => setActiveView('dashboard')}
              onOpenDevicePairing={() => setActiveView('account')}
            />

            <OfflineIndicator />

            {connection.errorMessage && activeView !== 'account' && (
              <div className="glass-surface mx-3 sm:mx-6 mt-3 p-3.5 rounded-2xl border-amber-400/60 dark:border-amber-400/35 text-xs text-amber-950 dark:text-amber-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 no-print">
                <span>{connection.errorMessage}</span>
                <Button
                  type="button"
                  size="sm"
                  onClick={handlePairSimulated}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-none min-h-[40px]"
                >
                  Switch to Simulator
                </Button>
              </div>
            )}

            <main className="flex-1 p-3 sm:p-6 pb-24 lg:pb-6 max-w-[1440px] w-full mx-auto">
              {activeView === 'dashboard' && (
                <LiveDashboardView
                  packet={latestPacket}
                  history={chartPoints}
                  profile={profile}
                  dataSourceMode={connection.mode}
                  scenario={scenario}
                  onSelectScenario={handleSelectScenario}
                  onTriggerHwButton={handleTriggerHwButton}
                  rollingWindowProgressSec={rollingSec}
                  alertsEnabled={alertsEnabled}
                  onToggleAlerts={() => setAlertsEnabled((a) => !a)}
                  symptomLogs={symptomLogs}
                  onAddSymptomLog={handleAddSymptomLog}
                  onAnnotateSymptomLog={handleAnnotateSymptomLog}
                  theme={theme}
                />
              )}

              {activeView === 'history' && <EpisodeHistoryView episodes={episodes} />}

              {activeView === 'sync' && <OfflineSyncView sdFreeMb={latestPacket.sd_free_mb} />}

              {activeView === 'diagnostics' && (
                <DiagnosticsView
                  packet={latestPacket}
                  profile={profile}
                  onSaveCalibration={handleSaveCalibration}
                />
              )}

              {activeView === 'report' && (
                <ClinicalReportView
                  profile={profile}
                  episodes={episodes}
                  symptomLogs={symptomLogs}
                />
              )}

              {activeView === 'ai' && (
                <AiKnowledgeView
                  messages={aiMessages}
                  loading={aiLoading}
                  telemetryContext={liveTelemetryContext}
                  onSendMessage={(txt) => void handleSendAiMessage(txt)}
                  onClearMessages={() => setAiMessages([])}
                  onExplainFurther={handleExplainFaqInDrawer}
                />
              )}

              {activeView === 'account' && (
                <AccountPairingView
                  profile={profile}
                  connection={connection}
                  onUpdateProfile={handleUpdateProfile}
                  onPairBle={handlePairBle}
                  onPairSerial={handlePairSerial}
                  onPairSimulated={handlePairSimulated}
                  onSyncRtc={handleSyncRtc}
                />
              )}
            </main>
          </div>

          <MobileBottomNav
            activeView={activeView}
            moreOpen={mobileMenuOpen}
            onSelectView={(view) => {
              setMobileMenuOpen(false);
              setActiveView(view);
            }}
            onOpenMore={() => setMobileMenuOpen(true)}
          />

          <MobileMoreSheet
            open={mobileMenuOpen}
            activeView={activeView}
            profile={profile}
            connection={connection}
            batteryPct={latestPacket.battery_pct}
            onClose={() => setMobileMenuOpen(false)}
            onSelectView={(view) => setActiveView(view)}
            onChangeDataSource={handleChangeDataSource}
            onSignOut={handleSignOut}
          />

          <AiDrawer
            open={aiDrawerOpen}
            hideFloatingButton={activeView === 'ai'}
            onOpenChange={setAiDrawerOpen}
            messages={aiMessages}
            loading={aiLoading}
            telemetryContext={liveTelemetryContext}
            onSendMessage={(txt) => void handleSendAiMessage(txt)}
            onClearMessages={() => setAiMessages([])}
            draftPrompt={aiDraftPrompt}
          />
        </div>
      </ThemeProvider>
    </PrimeReactProvider>
  );
}
