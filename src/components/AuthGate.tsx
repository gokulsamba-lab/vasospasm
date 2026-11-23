import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  BluetoothOn,
  ShieldTick,
  UsbFlashDrive,
} from '@untitledui/icons';
import type { DominantHand, PatientProfile, RaynaudsType } from '../types/telemetry';
import { DEFAULT_DEMO_PROFILE } from '../data/seedData';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { PrimeSelect } from './ui/PrimeSelect';

interface StoredAccount {
  passwordHash: string;
  profile: PatientProfile;
}

interface AuthGateProps {
  onAuthenticated: (profile: PatientProfile) => void;
  accountsKey: string;
}

export function AuthGate({ onAuthenticated, accountsKey }: AuthGateProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign up state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [dominantHand, setDominantHand] = useState<DominantHand>('Right');
  const [monitoredHand, setMonitoredHand] = useState<'Left' | 'Right'>('Left');
  const [raynaudsType, setRaynaudsType] = useState<RaynaudsType>('Primary');
  const [baselineTemp, setBaselineTemp] = useState('32.4');
  const [piThreshold, setPiThreshold] = useState('0.9');
  const [deltaTThreshold, setDeltaTThreshold] = useState('-3.5');
  const [deviceMac, setDeviceMac] = useState('MCXN236-E8:9F:6D:41:2B:09');

  const loadAccounts = (): Record<string, StoredAccount> => {
    try {
      const raw = localStorage.getItem(accountsKey);
      return raw ? (JSON.parse(raw) as Record<string, StoredAccount>) : {};
    } catch {
      return {};
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const email = loginEmail.trim().toLowerCase();
    if (!email || !loginPassword) {
      setError('Enter your registered email address and password.');
      return;
    }

    const accounts = loadAccounts();
    const record = accounts[email];
    if (!record || record.passwordHash !== loginPassword) {
      setError('Invalid email or password. Use Instant Demo Login or register a new clinical profile.');
      return;
    }

    onAuthenticated(record.profile);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const email = signupEmail.trim().toLowerCase();
    if (!fullName.trim() || !email || signupPassword.length < 4) {
      setError('Full name, valid email, and password (min 4 characters) are required.');
      return;
    }
    const parsedTemp = Number(baselineTemp);
    const parsedPi = Number(piThreshold);
    const parsedDt = Number(deltaTThreshold);
    if (!Number.isFinite(parsedTemp) || !Number.isFinite(parsedPi) || !Number.isFinite(parsedDt)) {
      setError('Enter valid numeric values for baseline temperature and alert thresholds.');
      return;
    }

    const profile: PatientProfile = {
      patientId: `PT-MCX-${Math.floor(1000 + Math.random() * 8999)}`,
      fullName: fullName.trim(),
      email,
      dominantHand,
      monitoredHand,
      raynaudsType,
      baselineFingertipTempC: parsedTemp,
      piAlertThresholdPct: parsedPi,
      deltaTAlertThresholdC: parsedDt,
      boundDeviceName: 'VasoSense-MCXN236',
      boundDeviceMacOrSerial: deviceMac.trim() || 'MCXN236-UNBOUND',
      rtcLastSyncedAt: new Date().toISOString(),
      calibration: {
        restingPiPct: 2.8,
        restingDeltaTC: -0.7,
        restingFingertipTempC: parsedTemp,
        baselineRgb: { r: 214, g: 164, b: 150 },
        calibratedAt: new Date().toISOString(),
      },
    };

    const accounts = loadAccounts();
    accounts[email] = { passwordHash: signupPassword, profile };
    localStorage.setItem(accountsKey, JSON.stringify(accounts));
    onAuthenticated(profile);
  };

  const handleDemoLogin = () => {
    setError(null);
    const accounts = loadAccounts();
    const demoKey = DEFAULT_DEMO_PROFILE.email.toLowerCase();
    const profileToUse = accounts[demoKey]?.profile ?? DEFAULT_DEMO_PROFILE;
    if (!accounts[demoKey]) {
      accounts[demoKey] = { passwordHash: 'demo1234', profile: profileToUse };
      localStorage.setItem(accountsKey, JSON.stringify(accounts));
    }
    onAuthenticated(profileToUse);
  };

  return (
    <div className="min-h-screen bg-[#EAF1FB] dark:bg-[#050814] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Atmospheric Aurora Light Field for AuthGate Glass */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-24 -left-20 w-[480px] h-[480px] rounded-full bg-sky-400/35 dark:bg-[#1D4ED8]/30 blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[520px] h-[520px] rounded-full bg-cyan-300/35 dark:bg-[#06B6D4]/22 blur-[130px]" />
        <div className="absolute top-1/3 left-1/2 w-[420px] h-[420px] rounded-full bg-emerald-300/25 dark:bg-[#10B981]/16 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 glass-surface rounded-3xl overflow-hidden">
        {/* Left Clinical Overview Column (below form on mobile) */}
        <div className="order-2 lg:order-1 lg:col-span-5 bg-white/35 dark:bg-white/[0.03] backdrop-blur-xl p-5 sm:p-10 flex flex-col justify-between border-t lg:border-t-0 lg:border-r border-white/60 dark:border-white/10">
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-sky-600 dark:text-sky-400">
                <Activity className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-semibold tracking-tight">VasoSense Clinical</span>
              </div>
              <Badge variant="blue">FRDM-MCXN236</Badge>
            </div>

            <h1 className="mt-6 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white text-balance">
              Microvascular Vasospasm Telemetry Console
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Continuous multi-modal monitoring for Raynaud&apos;s phenomenon powered by NXP FRDM-MCXN236 edge inference.
            </p>

            <dl className="mt-8 space-y-4 border-t border-white/55 dark:border-white/10 pt-6 text-xs">
              <div>
                <dt className="font-semibold text-slate-900 dark:text-white">Optical &amp; Thermal Fusion</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                  MAX30102 Perfusion Index · Dual TMP117 Distal-Dorsal Gradient · TCS34725 Spectral Pallor
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-white">Motion Artifact Rejection</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                  LIS3DH 3-axis variance gate discards invalid movement windows prior to Cortex-M33 scoring
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900 dark:text-white">Direct Hardware Transports</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <BluetoothOn className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" /> Web Bluetooth
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <UsbFlashDrive className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" /> Web Serial (115200)
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 pt-6 border-t border-white/55 dark:border-white/10 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldTick className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
            <span>Patient baseline &amp; device binding persisted locally in browser storage</span>
          </div>
        </div>

        {/* Right Authentication & Registration Column (first on mobile) */}
        <div className="order-1 lg:order-2 lg:col-span-7 p-5 sm:p-10">
          <div className="flex items-center justify-between gap-2 mb-4 lg:hidden">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
              <Activity className="w-5 h-5" aria-hidden="true" />
              <span className="text-sm font-semibold tracking-tight">VasoSense Clinical</span>
            </div>
            <Badge variant="blue">FRDM-MCXN236</Badge>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/55 dark:border-white/10 pb-4">
            <Tabs
              value={tab}
              onValueChange={(v) => {
                setTab(v as 'login' | 'signup');
                setError(null);
              }}
              className="w-auto"
            >
              <TabsList>
                <TabsTrigger value="login" className="min-h-[38px]">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="min-h-[38px]">Create Profile</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button type="button" onClick={handleDemoLogin} className="min-h-[44px]">
              <span>Instant Demo Login</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 p-3.5 rounded-xl border border-rose-200 dark:border-rose-500/40 bg-rose-50/90 dark:bg-rose-500/12 text-xs text-rose-700 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Clinical Account Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="patient@clinic.org"
                  className="mt-1.5 min-h-[42px] text-sm"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter password"
                  className="mt-1.5 min-h-[42px] text-sm"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <Button type="submit" size="lg" variant="secondary">
                  Sign In to Console
                </Button>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Or click Instant Demo Login above for pre-seeded patient {DEFAULT_DEMO_PROFILE.patientId}
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="signup-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Patient Full Name
                  </label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jordan Vance"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="signup-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="jordan@clinic.org"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="signup-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="signup-raynauds" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Raynaud&apos;s Classification
                  </label>
                  <PrimeSelect
                    inputId="signup-raynauds"
                    ariaLabel="Raynaud's Classification"
                    value={raynaudsType}
                    options={[
                      'Primary',
                      'Secondary (Systemic Sclerosis)',
                      'Secondary (Lupus / Mixed CTD)',
                      'Unspecified',
                    ]}
                    onChange={(val) => setRaynaudsType(val as RaynaudsType)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="signup-dom-hand" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Dominant Hand
                  </label>
                  <PrimeSelect
                    inputId="signup-dom-hand"
                    ariaLabel="Dominant Hand"
                    value={dominantHand}
                    options={['Right', 'Left', 'Ambidextrous']}
                    onChange={(val) => setDominantHand(val as DominantHand)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="signup-mon-hand" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Monitored Sensor Hand
                  </label>
                  <PrimeSelect
                    inputId="signup-mon-hand"
                    ariaLabel="Monitored Sensor Hand"
                    value={monitoredHand}
                    options={['Left', 'Right']}
                    onChange={(val) => setMonitoredHand(val as 'Left' | 'Right')}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label htmlFor="signup-temp" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Baseline Temp (°C)
                  </label>
                  <Input
                    id="signup-temp"
                    type="number"
                    step="0.1"
                    value={baselineTemp}
                    onChange={(e) => setBaselineTemp(e.target.value)}
                    className="mt-1 font-mono tabular-nums text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="signup-pi" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    PI Alert Threshold (%)
                  </label>
                  <Input
                    id="signup-pi"
                    type="number"
                    step="0.1"
                    value={piThreshold}
                    onChange={(e) => setPiThreshold(e.target.value)}
                    className="mt-1 font-mono tabular-nums text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="signup-dt" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    ΔT Alert Threshold (°C)
                  </label>
                  <Input
                    id="signup-dt"
                    type="number"
                    step="0.1"
                    value={deltaTThreshold}
                    onChange={(e) => setDeltaTThreshold(e.target.value)}
                    className="mt-1 font-mono tabular-nums text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-mac" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Bound FRDM-MCXN236 MAC / Serial ID
                </label>
                <Input
                  id="signup-mac"
                  type="text"
                  value={deviceMac}
                  onChange={(e) => setDeviceMac(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
              </div>

              <Button type="submit" size="lg" className="w-full sm:w-auto">
                Create Profile &amp; Bind Hardware
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
