'use client'
import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { Icon } from "@iconify/react"

type FlightToolsModalProps = {
  show: boolean
  onClose: () => void

  /** Optional hooks, kept for future flows */
  onConfirm?: () => Promise<string>
  onAutofill?: () => Promise<any>
  simbriefId?: string
  hoppieId?: string

  /** Optional extra context */
  dpt?: string
  arr?: string
}

/** Clamp to a finite number to avoid NaN propagating */
const clampNumber = (n: number) => (Number.isFinite(n) ? n : 0)

/** TODO: Adjust this to your real API endpoint/contract */
async function fetchCurrentPilot(): Promise<{ pilotId?: string; simbriefId?: string } | null> {
  try {
    // Example 1: same-origin API route you control
    // const res = await fetch('/api/pilot/me', { cache: 'no-store', credentials: 'include' })

    // Example 2: external API (replace with your real endpoint)
    const res = await fetch('https://crew.jalvirtual.com/api/profile', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    // Normalize keys defensively
    return {
      pilotId: data?.pilotId ?? data?.hoppieId ?? data?.id ?? undefined,
      simbriefId: data?.simbriefId ?? data?.simbrief ?? undefined,
    }
  } catch {
    return null
  }
}

const FlightToolsModal = ({
  show,
  onClose,
  dpt = '',
  arr = '',
  simbriefId: simbriefIdFromProps,
  hoppieId,
  onConfirm,
  onAutofill,
}: FlightToolsModalProps) => {
  const [activeSection, setActiveSection] = useState<'tod' | 'trl' | 'aero'>('tod')
  const [feedback, setFeedback] = useState<{message: string, type: 'success'|'error'}|null>(null)

  // IDs from database
  const [pilotId, setPilotId] = useState<string | undefined>(undefined)
  const [simbriefId, setSimbriefId] = useState<string | undefined>(simbriefIdFromProps)
  const [loadingIds, setLoadingIds] = useState(false)

  // TOD Calculator State
  const [todData, setTodData] = useState({ actfl: '', fixfl: '', gspeed: '' })
  const [todResult, setTodResult] = useState<{tod: number, vSpeed: number}|null>(null)

  // TRL Calculator State (inHg)
  const [trlData, setTrlData] = useState({ altimeter: '29.92', ta: '18000' })
  const [trlResult, setTrlResult] = useState<{alt1013: number, flEq: number}|null>(null)

  // Aero Calculator State
  const [aeroData, setAeroData] = useState({ ias: '', alt: '', temp: '', windDir: '', windSpd: '' })
  const [aeroResult, setAeroResult] = useState<{tas: number; windComponent: number; groundSpeed: number} | null>(null)

  // Convert inHg to hPa (guard NaN)
  const inHgToHpa = (value: string) => clampNumber(parseFloat(value)) * 33.8639

  // Calculate TOD (guard NaN + basic validation)
  const calculateTod = () => {
    const actfl = clampNumber(parseFloat(todData.actfl))
    const fixfl = clampNumber(parseFloat(todData.fixfl))
    const gspeed = clampNumber(parseFloat(todData.gspeed))

    if (gspeed <= 0 || actfl <= 0 || fixfl < 0 || actfl <= fixfl) {
      setFeedback({ message: 'Please enter valid values: Current FL > Target FL and Ground Speed > 0.', type: 'error' })
      setTodResult(null)
      return
    }

    const tod = (actfl - fixfl) / 3 // nm
    const vSpeed = Math.round((5 * gspeed) / 100) * 100 // fpm
    setTodResult({ tod, vSpeed })
    setFeedback(null)
  }

  // Calculate TRL
  const calculateTrl = () => {
    const altimeterHpa = inHgToHpa(trlData.altimeter)
    const ta = clampNumber(parseFloat(trlData.ta))
    if (ta <= 0 || altimeterHpa <= 0) {
      setFeedback({ message: 'Please provide a valid Transition Altitude and altimeter setting.', type: 'error' })
      setTrlResult(null)
      return
    }
    const alt1013 = (-28 * (altimeterHpa - 1013)) + ta
    const flEq = Math.round(alt1013 / 100)
    setTrlResult({ alt1013, flEq })
    setFeedback(null)
  }

  // Calculate Aero metrics (simple model; swap with full formula later)
  const calculateAero = () => {
    const ias = clampNumber(parseFloat(aeroData.ias))
    if (ias <= 0) {
      setFeedback({ message: 'Please enter a valid Indicated Airspeed (> 0).', type: 'error' })
      setAeroResult(null)
      return
    }
    const tas = ias * 1.02
    const windComponent = 0 // TODO: implement true vector wind calc
    setAeroResult({ tas, windComponent, groundSpeed: tas + windComponent })
    setFeedback(null)
  }

  // Reset calculator state when opening
  useEffect(() => {
    if (!show) return
    setTodData({ actfl: '', fixfl: '', gspeed: '' })
    setTrlData({ altimeter: '29.92', ta: '18000' })
    setAeroData({ ias: '', alt: '', temp: '', windDir: '', windSpd: '' })
    setFeedback(null)
    setTodResult(null)
    setTrlResult(null)
    setAeroResult(null)
  }, [show])

  // Load pilot/simbrief IDs from database when opening
  useEffect(() => {
    if (!show) return
    let cancelled = false
    const load = async () => {
      setLoadingIds(true)
      const data = await fetchCurrentPilot()
      if (!cancelled) {
        setPilotId(data?.pilotId)
        // Prefer prop, but backfill from DB if not provided
        setSimbriefId(prev => prev ?? data?.simbriefId)
        setLoadingIds(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [show])

  return (
    <Modal onClose={onClose} wide>
      {/* Hide number input spinners (Chrome/Firefox) */}
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>

      <div className="relative w-full max-w-6xl bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Icon icon="mdi:airplane" width={24} className="text-blue-400" />
            <h2 className="text-2xl font-semibold text-white">Flight Tools</h2>
          </div>
          {/* close button removed; wrapper handles closing */}
        </div>

        <div className="flex h-[600px] overflow-hidden">
          {/* Navigation */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="space-y-1">
              {([
                {id: 'tod', icon: 'mdi:airplane-landing', label: 'TOD Calculator'},
                {id: 'trl', icon: 'mdi:altimeter', label: 'TRL Calculator'},
                {id: 'aero', icon: 'mdi:calculator', label: 'Aero Calculator'}
              ] as {id: 'tod' | 'trl' | 'aero', icon: string, label: string}[]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
                    activeSection === item.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon icon={item.icon} width={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Identity summary (from DB) */}
            <div className="mt-4 text-xs text-gray-400 space-y-1">
              {loadingIds ? (
                <div className="animate-pulse">Loading pilot profile…</div>
              ) : (
                <>
                  {pilotId && <div>Pilot ID: <span className="font-mono">{pilotId}</span></div>}
                  {simbriefId && <div>SimBrief: <span className="font-mono">{simbriefId}</span></div>}
                  {(dpt || arr) && <div>Route: <span className="font-mono">{dpt || '—'} → {arr || '—'}</span></div>}
                </>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-gray-900 overflow-y-auto p-6">
            {/* TOD */}
            {activeSection === 'tod' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <Icon icon="mdi:airplane-landing" width={28} className="text-blue-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold text-white">Top of Descent Calculator</h3>
                    <p className="text-sm text-gray-400">Compute your optimal descent point.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <LabeledNumber
                    label="Current FL"
                    value={todData.actfl}
                    onChange={(v) => setTodData({ ...todData, actfl: v })}
                    placeholder="350"
                  />
                  <LabeledNumber
                    label="Target FL"
                    value={todData.fixfl}
                    onChange={(v) => setTodData({ ...todData, fixfl: v })}
                    placeholder="100"
                  />
                  <LabeledNumber
                    label="Ground Speed (kts)"
                    value={todData.gspeed}
                    onChange={(v) => setTodData({ ...todData, gspeed: v })}
                    placeholder="250"
                  />
                </div>

                <div className="flex justify-center">
                  <button onClick={calculateTod} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center">
                    <Icon icon="mdi:calculator" className="mr-2" />
                    Calculate TOD
                  </button>
                </div>

                {todResult && (
                  <ResultPanel title="Descent Profile" icon="mdi:chart-line">
                    <div className="grid grid-cols-2 gap-6">
                      <MetricBox label="TOD Distance" value={`${todResult.tod.toFixed(1)} nm`} />
                      <MetricBox label="Vertical Speed" value={`-${todResult.vSpeed} fpm`} />
                    </div>
                    <InfoLine text={`Start descent ${todResult.tod.toFixed(1)} nm before target at ${todResult.vSpeed} fpm.`} />
                  </ResultPanel>
                )}
              </div>
            )}

            {/* TRL */}
            {activeSection === 'trl' && (
              <div className="space-y-6">
                <SectionHeader icon="mdi:altimeter" title="Transition Level Calculator" subtitle="Based on current altimeter setting." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <LabeledNumber
                    label="Altimeter Setting"
                    value={trlData.altimeter}
                    onChange={(v) => setTrlData({ ...trlData, altimeter: v })}
                    placeholder="29.92"
                    unit="inHg"
                    step="0.01"
                  />
                  <LabeledNumber
                    label="Transition Altitude"
                    value={trlData.ta}
                    onChange={(v) => setTrlData({ ...trlData, ta: v })}
                    placeholder="18000"
                    unit="ft"
                  />
                </div>

                <div className="flex justify-center">
                  <button onClick={calculateTrl} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center">
                    <Icon icon="mdi:calculator" className="mr-2" />
                    Calculate TRL
                  </button>
                </div>

                {trlResult && (
                  <ResultPanel title="Transition Level" icon="mdi:chart-areaspline">
                    <div className="grid grid-cols-3 gap-4">
                      <MetricBox label="Std Altitude" value={`${Math.round(trlResult.alt1013).toLocaleString()} ft`} />
                      <div className="bg-blue-900/30 rounded-lg p-4 text-center border border-blue-800">
                        <div className="text-sm text-blue-300 mb-1">Transition Level</div>
                        <div className="text-2xl font-mono text-white">FL{trlResult.flEq + 10}</div>
                      </div>
                      <MetricBox label="Current Setting" value={`${trlData.altimeter} inHg`} />
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <HintBox label="When climbing:" text={`Set STD at FL${trlResult.flEq + 10}.`} />
                      <HintBox label="When descending:" text={`Set QNH at ${trlData.ta} ft.`} />
                    </div>
                  </ResultPanel>
                )}
              </div>
            )}

            {/* Aero */}
            {activeSection === 'aero' && (
              <div className="space-y-6">
                <SectionHeader icon="mdi:calculator" title="Aeronautical Calculator" subtitle="True airspeed and wind components." />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Panel title="Airspeed Parameters" icon="mdi:speedometer">
                    <div className="space-y-4">
                      <LabeledNumber label="Indicated Airspeed" value={aeroData.ias} onChange={(v) => setAeroData({ ...aeroData, ias: v })} placeholder="250" unit="kts" />
                      <LabeledNumber label="Altitude" value={aeroData.alt} onChange={(v) => setAeroData({ ...aeroData, alt: v })} placeholder="35000" unit="ft" />
                      <LabeledNumber label="Temperature" value={aeroData.temp} onChange={(v) => setAeroData({ ...aeroData, temp: v })} placeholder="-50" unit="°C" />
                    </div>
                  </Panel>

                  <Panel title="Wind Parameters" icon="mdi:weather-windy">
                    <div className="space-y-4">
                      <LabeledNumber label="Wind Direction" value={aeroData.windDir} onChange={(v) => setAeroData({ ...aeroData, windDir: v })} placeholder="270" unit="°" />
                      <LabeledNumber label="Wind Speed" value={aeroData.windSpd} onChange={(v) => setAeroData({ ...aeroData, windSpd: v })} placeholder="50" unit="kts" />
                    </div>
                  </Panel>
                </div>

                <div className="flex justify-center">
                  <button onClick={calculateAero} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors flex items-center">
                    <Icon icon="mdi:calculator" className="mr-2" />
                    Calculate
                  </button>
                </div>

                {aeroResult && (
                  <ResultPanel title="Calculation Results" icon="mdi:chart-areaspline-variant">
                    <div className="grid grid-cols-3 gap-4">
                      <MetricBox label="True Airspeed" value={`${aeroResult.tas} kts`} />
                      <MetricBox label="Wind Component" value={`${aeroResult.windComponent} kts`} />
                      <MetricBox label="Ground Speed" value={`${aeroResult.groundSpeed} kts`} />
                    </div>
                  </ResultPanel>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 px-6 py-4 flex justify-between items-center">
          {feedback && (
            <div className={`text-sm font-medium px-3 py-1.5 rounded ${
              feedback.type === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
            }`}>
              {feedback.message}
            </div>
          )}
          <div className="flex space-x-3 ml-auto">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

/** Small UI helpers */
function LabeledNumber({
  label, value, onChange, placeholder, unit, step,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; unit?: string; step?: string }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <input
          inputMode="numeric"
          type="number"
          step={step}
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {unit && <span className="absolute right-3 top-3 text-gray-400">{unit}</span>}
      </div>
    </div>
  )
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <Icon icon={icon} width={28} className="text-blue-400 flex-shrink-0" />
      <div>
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

function Panel({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
      <h4 className="text-lg font-medium text-white mb-4 flex items-center">
        <Icon icon={icon} className="mr-2 text-blue-400" />
        {title}
      </h4>
      {children}
    </div>
  )
}

function HintBox({ label, text }: { label: string; text: string }) {
  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="font-medium text-white">{text}</div>
    </div>
  )
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-700 rounded-lg p-4 text-center">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-mono text-white">{value}</div>
    </div>
  )
}

function ResultPanel({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mt-6">
      <h4 className="text-lg font-medium text-white mb-4 flex items-center">
        <Icon icon={icon} className="mr-2 text-blue-400" />
        {title}
      </h4>
      {children}
    </div>
  )
}

function InfoLine({ text }: { text: string }) {
  return (
    <div className="mt-6 text-sm text-gray-400 bg-gray-700/50 rounded-lg p-4">
      <Icon icon="mdi:information" className="inline mr-2 text-blue-400" />
      {text}
    </div>
  )
}

export default FlightToolsModal
