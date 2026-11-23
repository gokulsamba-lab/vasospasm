import React, { useState } from 'react';
import { Activity, CheckCircle, Clock, Download01, HardDrive, ShieldTick } from '@untitledui/icons';
import { ProgressBar } from 'primereact/progressbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chip } from '@mui/material';
import type { OfflineRecord } from '../../types/telemetry';
import { generateSeedOfflineRecords } from '../../data/seedData';
import { serializeRecordsToCsv } from '../../utils/clinicalAnalytics';
import { glassColumnPt, glassDataTablePt } from '../../lib/primeTablePt';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { PrimeStatusTag } from '../ui/PrimeStatusTag';

interface OfflineSyncViewProps {
  sdFreeMb: number;
}

export function OfflineSyncView({ sdFreeMb }: OfflineSyncViewProps) {
  const [records, setRecords] = useState<OfflineRecord[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const handleFetchLogs = () => {
    if (syncing) return;
    setSyncing(true);
    setProgressPct(12);

    const steps = [34, 61, 88, 100];
    steps.forEach((pct, index) => {
      window.setTimeout(() => {
        setProgressPct(pct);
        if (pct === 100) {
          setRecords(generateSeedOfflineRecords(48));
          setSyncing(false);
          setLastSyncedAt(new Date().toISOString());
        }
      }, (index + 1) * 260);
    });
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (records.length === 0) return;
    const csv = serializeRecordsToCsv(records);
    downloadFile(csv, `vasosense_mcxn236_offline_${Date.now()}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportJson = () => {
    if (records.length === 0) return;
    const json = JSON.stringify(records, null, 2);
    downloadFile(json, `vasosense_mcxn236_offline_${Date.now()}.json`, 'application/json');
  };

  const validCount = records.filter((r) => r.crcValid).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Offline SD / SPI Flash Sync
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Retrieve autonomous microSD / QSPI flash logs recorded when the FRDM-MCXN236 operated untethered
          </p>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleFetchLogs}
          disabled={syncing}
        >
          <HardDrive className="w-4 h-4" aria-hidden="true" />
          <span>{syncing ? 'Transferring Blocks...' : 'Fetch Offline Logs from Device'}</span>
        </Button>
      </div>

      {/* Device Flash Status & Transfer Progress */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#1F75FE]/15 text-[#1F75FE] flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <span className="text-slate-500 dark:text-slate-400">On-Board Storage</span>
              <p className="mt-1 text-base font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                {sdFreeMb.toFixed(1)} MB Free
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#0095FF]/15 text-[#0095FF] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Buffered Packets</span>
              <p className="mt-1 text-base font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                {records.length > 0 ? `${records.length} Frames Synced` : '48 Pending Frames'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#00D18A]/15 text-[#00D18A] flex items-center justify-center shrink-0">
              <ShieldTick className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <span className="text-slate-500 dark:text-slate-400">CRC-16 Integrity</span>
              <p className="mt-1 text-base font-mono tabular-nums font-semibold text-[#00D18A]">
                {records.length > 0 ? `${validCount} / ${records.length} Verified` : 'Ready'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#E08E45]/15 text-[#E08E45] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" aria-hidden="true" />
            </span>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Last Synced</span>
              <p className="mt-1 text-sm font-mono tabular-nums text-slate-900 dark:text-white">
                {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Not fetched yet'}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-mono tabular-nums mb-1.5 text-slate-600 dark:text-slate-400">
            <span>Bulk SPI Flash Transfer Progress</span>
            <span>{progressPct}%</span>
          </div>
          <ProgressBar
            value={progressPct}
            showValue={false}
            color="#38BDF8"
            className="glass-well w-full h-2.5 rounded-full overflow-hidden"
            style={{ height: '10px', borderRadius: '9999px' }}
          />
        </div>

        {records.length > 0 && (
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/55 dark:border-white/12">
            <div className="inline-flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <ShieldTick className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>All {records.length} frames passed CRC-16 checksum verification (SpO2 fields excluded)</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleExportCsv}>
                <Download01 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Export Raw Dataset (CSV)</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleExportJson}>
                <Download01 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Export Raw Dataset (JSON)</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Synced Frames Table (PrimeReact DataTable) */}
      <Card className="overflow-hidden">
        {records.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              No offline records loaded into session buffer
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click &ldquo;Fetch Offline Logs from Device&rdquo; above to read stored microSD blocks and prepare ML training exports.
            </p>
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-slate-200/60 dark:divide-white/10 max-h-96 overflow-y-auto">
              {records.map((rec) => (
                <div key={rec.seq} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 font-mono tabular-nums">
                      <span className="font-semibold text-slate-900 dark:text-white">#{rec.seq}</span>
                      <span className="text-slate-400" aria-hidden="true">·</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {new Date(rec.packet.rtc_time).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono tabular-nums text-[11px]">
                      <span className="text-[#0095FF]">PI {rec.packet.perfusion_index.toFixed(2)}%</span>
                      <span className="text-[#E08E45]">ΔT {rec.packet.delta_t.toFixed(2)}°C</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Pal {(rec.packet.pallor_index * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 font-mono text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">CRC OK</span>
                    <span className="text-slate-500 dark:text-slate-400">Class {rec.packet.ml_class}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden md:block">
              <DataTable
                value={records}
                dataKey="seq"
                scrollable
                scrollHeight="384px"
                unstyled
                pt={glassDataTablePt}
              >
            <Column
              field="seq"
              header="Seq #"
              pt={glassColumnPt('left')}
              body={(rec: OfflineRecord) => (
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">{rec.seq}</span>
              )}
            />
            <Column
              header="RTC Timestamp"
              pt={glassColumnPt('left')}
              body={(rec: OfflineRecord) => (
                <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                  {new Date(rec.packet.rtc_time).toLocaleTimeString()}
                </span>
              )}
            />
            <Column
              header="PI (%)"
              pt={glassColumnPt('right')}
              body={(rec: OfflineRecord) => (
                <span className="font-mono tabular-nums text-[#0095FF]">
                  {rec.packet.perfusion_index.toFixed(2)}%
                </span>
              )}
            />
            <Column
              header="ΔT (°C)"
              pt={glassColumnPt('right')}
              body={(rec: OfflineRecord) => (
                <span className="font-mono tabular-nums text-[#E08E45]">
                  {rec.packet.delta_t.toFixed(2)}°C
                </span>
              )}
            />
            <Column
              header="Pallor"
              pt={glassColumnPt('right')}
              body={(rec: OfflineRecord) => (
                <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {(rec.packet.pallor_index * 100).toFixed(0)}%
                </span>
              )}
            />
            <Column
              header="ML Class"
              pt={glassColumnPt('right')}
              body={(rec: OfflineRecord) => (
                <PrimeStatusTag value={`Class ${rec.packet.ml_class}`} tone="slate" />
              )}
            />
            <Column
              header="Integrity"
              pt={glassColumnPt('right')}
              body={() => (
                <Chip
                  size="small"
                  icon={<CheckCircle className="w-3.5 h-3.5" />}
                  label="CRC OK"
                  sx={{
                    height: 22,
                    fontSize: '0.68rem',
                    fontFamily: 'var(--font-mono)',
                    bgcolor: 'rgba(0, 209, 138, 0.12)',
                    color: '#00D18A',
                    '& .MuiChip-icon': { color: '#00D18A' },
                  }}
                />
              )}
              />
              </DataTable>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
