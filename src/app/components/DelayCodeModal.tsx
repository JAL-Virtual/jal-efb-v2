'use client'
import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import { Icon } from "@iconify/react"

// Organized delay codes in numerical order
const DELAY_CODES = [
  { code: "00", reason: "PILOT DECISION TO DELAY FLIGHT" },
  { code: "01", reason: "PILOT ERROR DURING BOOKING PROCESS" },
  { code: "02", reason: "CREW ERROR DURING FLIGHT PREP" },
  { code: "03", reason: "DISPATCH ERROR" },
  { code: "04", reason: "PREFLIGHT DOCUMENTATION MISSING" },
  { code: "05", reason: "AIRCRAFT LATE ARRIVAL" },
  { code: "06", reason: "PREVIOUS FLIGHT DELAY" },
  { code: "07", reason: "SLOW BOARDING OF PREVIOUS FLIGHT" },
  { code: "08", reason: "SLOW DEBOARDING OF PREVIOUS FLIGHT" },
  { code: "09", reason: "INSUFFICIENT GROUND TIME" },
  { code: "10", reason: "LATE ARRIVAL OF PASSENGERS" },
  { code: "11", reason: "LATE ARRIVAL OF CARGO" },
  { code: "12", reason: "LATE ARRIVAL OF MAIL" },
  { code: "13", reason: "CONNECTING PASSENGER DELAY" },
  { code: "14", reason: "CONNECTING BAGGAGE DELAY" },
  { code: "15", reason: "LATE LANDING" },
  { code: "16", reason: "LATE BOARDING" },
  { code: "17", reason: "GATE NOT AVAILABLE" },
  { code: "18", reason: "CHECK-IN ERROR" },
  { code: "19", reason: "GATE CHANGE CONFUSION" },
  { code: "20", reason: "LATE BAGGAGE" },
  { code: "21", reason: "BAGGAGE MISHANDLING" },
  { code: "22", reason: "LATE LOADING OF CARGO" },
  { code: "23", reason: "LATE LOADING OF MAIL" },
  { code: "24", reason: "LATE LOADING OF BAGS" },
  { code: "25", reason: "CATERING DELAY" },
  { code: "26", reason: "CATERING MISSING ITEMS" },
  { code: "27", reason: "WATER OR LAVATORY SERVICE DELAY" },
  { code: "28", reason: "GROUND EQUIPMENT FAILURE" },
  { code: "29", reason: "CLEANING CREW LATE ARRIVAL" },
  { code: "30", reason: "INCOMPLETE CABIN CLEANING" },
  { code: "31", reason: "CREW REST REQUIREMENT" },
  { code: "32", reason: "CREW LATE ARRIVAL" },
  { code: "33", reason: "CREW SHIFT LIMIT EXCEEDED" },
  { code: "34", reason: "CREW DOCUMENTATION" },
  { code: "35", reason: "CREW TRANSPORTATION DELAY" },
  { code: "36", reason: "LATE REQUEST OF REFUELING" },
  { code: "37", reason: "FUELING TRUCK NOT AVAILABLE" },
  { code: "38", reason: "FUEL TYPE MISMATCH" },
  { code: "39", reason: "FUEL SPILL INCIDENT" },
  { code: "40", reason: "CABIN PREP DELAY" },
  { code: "41", reason: "AIRCRAFT CLEANING DELAY" },
  { code: "42", reason: "CABIN CREW SHORTAGE" },
  { code: "43", reason: "UNASSIGNED CABIN CREW" },
  { code: "44", reason: "FLIGHT DOCUMENTATION ISSUE" },
  { code: "45", reason: "FLIGHT PLAN NOT FILED" },
  { code: "46", reason: "TECHNICAL INSPECTION" },
  { code: "47", reason: "AIRCRAFT CONFIGURATION CHANGE" },
  { code: "48", reason: "INOP SEAT SYSTEMS" },
  { code: "49", reason: "APU INOP" },
  { code: "50", reason: "ENGINE FAILURES" },
  { code: "51", reason: "AIRCRAFT DAMAGE" },
  { code: "52", reason: "DAMAGE WHILE GROUNDED" },
  { code: "53", reason: "HYDRAULIC SYSTEM FAILURE" },
  { code: "54", reason: "BRAKE SYSTEM MALFUNCTION" },
  { code: "55", reason: "DE-ICING DELAY" },
  { code: "56", reason: "DE-ICING EQUIPMENT FAILURE" },
  { code: "57", reason: "ICE BUILDUP ON SURFACES" },
  { code: "58", reason: "SIM FAILURE" },
  { code: "59", reason: "WASM CRASH" },
  { code: "60", reason: "FMS SYSTEM MALFUNCTION" },
  { code: "61", reason: "EFB OR TABLET FAILURE" },
  { code: "62", reason: "MORE FUEL NEEDED" },
  { code: "63", reason: "FUEL ORDERED INCORRECTLY" },
  { code: "64", reason: "PILOT SICKNESS" },
  { code: "65", reason: "SECURITY ALERT AT AIRPORT" },
  { code: "66", reason: "AIRPORT SECURITY CHECK DELAY" },
  { code: "67", reason: "PASSENGER SECURITY INCIDENT" },
  { code: "68", reason: "UNATTENDED BAGGAGE INVESTIGATION" },
  { code: "69", reason: "BIRD STRIKE" },
  { code: "70", reason: "WILDLIFE ON RUNWAY" },
  { code: "71", reason: "DEPARTURE AIRPORT WEATHER RESTRICTIONS" },
  { code: "72", reason: "ARRIVAL AIRPORT WEATHER RESTRICTIONS" },
  { code: "73", reason: "ENROUTE WEATHER" },
  { code: "74", reason: "AIRPORT CLOSED DUE TO WEATHER" },
  { code: "75", reason: "LIGHTNING IN VICINITY" },
  { code: "76", reason: "LOW VISIBILITY PROCEDURES" },
  { code: "77", reason: "VOLCANIC ASH ALERT" },
  { code: "78", reason: "SNOW REMOVAL DELAY" },
  { code: "79", reason: "WINDS ABOVE LIMITATIONS" },
  { code: "80", reason: "TARMAC DELAY DUE TO CONGESTION" },
  { code: "81", reason: "AIRPORT EQUIPMENT MALFUNCTION" },
  { code: "82", reason: "GATE CONGESTION" },
  { code: "83", reason: "ATC CAPACITY AT DEPARTURE" },
  { code: "84", reason: "ATC CAPACITY AT ARRIVAL" },
  { code: "85", reason: "WRONG DISPATCHING" },
  { code: "86", reason: "ATC STRIKE" },
  { code: "87", reason: "AIRSPACE CLOSURE" },
  { code: "88", reason: "FLIGHT PLAN REJECTION" },
  { code: "89", reason: "ENROUTE TRAFFIC REROUTING" },
  { code: "90", reason: "MILITARY AIRSPACE RESTRICTION" },
  { code: "91", reason: "CUSTOMS CLEARANCE DELAY" },
  { code: "92", reason: "IMMIGRATION HOLD" },
  { code: "93", reason: "SPECIAL HANDLING PASSENGERS" },
  { code: "94", reason: "GROUND HANDLING STRIKE" },
  { code: "95", reason: "BAGGAGE SYSTEM FAILURE" },
  { code: "96", reason: "FLIGHT CANCELLED" },
  { code: "97", reason: "NO CREW AVAILABLE" },
  { code: "98", reason: "FLIGHT REMOVED FROM SCHEDULE" },
  { code: "99", reason: "UNSPECIFIED DELAY - INVESTIGATION NEEDED" }
]

// Japan Airlines Group + key subsidiaries
const AIRLINES = [
  { id: 'JAL', name: 'Japan Airlines' },
  { id: 'JAR', name: 'J-AIR' },
  { id: 'JTA', name: 'Japan Transocean Air' },
  { id: 'RAC', name: 'Ryukyu Air Commuter' },
  { id: 'ZP',  name: 'ZIPAIR Tokyo' },
]

type Props = {
  show: boolean;
  onClose: () => void;
  webhookUrl?: string;
}

/** Fetch current pilot profile from your backend/crew API and normalize the ID */
async function fetchCurrentPilot(): Promise<{ pilotIdNum?: string } | null> {
  try {
    // Replace with your real endpoint if different:
    const res = await fetch('https://crew.jalvirtual.com/api/profile', { cache: 'no-store', credentials: 'include' as RequestCredentials })
    if (!res.ok) return null
    const data = await res.json()

    // Accept a few common shapes: "JAL01234", "01234", numeric, etc.
    const raw: string | number | undefined =
      data?.pilotId ?? data?.hoppieId ?? data?.id ?? data?.callsign

    if (raw == null) return { pilotIdNum: undefined }

    const str = String(raw)
    // Extract numeric block (strip any airline prefix letters)
    const num = (str.match(/(\d+)/)?.[1] ?? '').padStart(4, '0')
    return { pilotIdNum: num || undefined }
  } catch {
    return null
  }
}

const DelayCodeModal = ({
  show,
  onClose,
  webhookUrl = "https://discord.com/api/webhooks/1390281109862092913/fYdJLjqYavUblunHHeGFgtx3vShJN44nh8BJMVf_2egEV6vmdxCPY94lr_L_Xa0rf0xJ"
}: Props) => {
  const [pilotIdNum, setPilotIdNum] = useState("") // numeric part only (e.g., "01234")
  const [selectedAirline, setSelectedAirline] = useState(AIRLINES[0].id)
  const [selectedCode, setSelectedCode] = useState(DELAY_CODES[0].code)
  const [isSending, setIsSending] = useState(false)
  const [loadingPilot, setLoadingPilot] = useState(false)
  const [feedback, setFeedback] = useState<{message: string, type: 'success'|'error'}|null>(null)

  // Reset on open
  useEffect(() => {
    if (show) {
      setSelectedAirline(AIRLINES[0].id)
      setSelectedCode(DELAY_CODES[0].code)
      setFeedback(null)
      setIsSending(false)
      // Load Pilot ID from DB
      let cancelled = false
      const run = async () => {
        setLoadingPilot(true)
        const fetched = await fetchCurrentPilot()
        if (!cancelled) {
          setPilotIdNum(fetched?.pilotIdNum ?? "")
          setLoadingPilot(false)
        }
      }
      run()
      return () => { cancelled = true }
    }
  }, [show])

  useEffect(() => {
    if (feedback) {
      const timeout = setTimeout(() => setFeedback(null), 3000)
      return () => clearTimeout(timeout)
    }
  }, [feedback])

  const handleSend = async () => {
    setIsSending(true)
    setFeedback(null)

    const selected = DELAY_CODES.find(d => d.code === selectedCode)
    // Build full ID as <AIRLINE><NUM>, e.g., "JAL01234"
    const fullPilotId = `${selectedAirline}${pilotIdNum}`

    const airlineName = AIRLINES.find(a => a.id === selectedAirline)?.name ?? selectedAirline

    const embedContent = {
      embeds: [
        {
          title: "DELAY CODE REPORT",
          color: 0xffcb05,
          fields: [
            { name: "DELAY CODE", value: `${selected?.code} - ${selected?.reason}`, inline: false },
            { name: "AIRLINE", value: airlineName, inline: true },
            { name: "PILOT ID", value: fullPilotId || '-', inline: true },
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "JAL EFB - Delay Code System" }
        }
      ]
    }

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embedContent),
      })
      if (res.ok) {
        setFeedback({message: "Delay code submitted successfully", type: 'success'})
      } else {
        setFeedback({message: "Failed to submit delay code", type: 'error'})
      }
    } catch {
      setFeedback({message: "Failed to submit delay code", type: 'error'})
    }
    setIsSending(false)
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="relative w-full max-w-6xl bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
        <div className="sticky top-0 z-10 bg-gray-800 px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Icon icon="mdi:clock-alert" width={24} className="text-yellow-400" />
            <h2 className="text-2xl font-semibold text-white">Delay Code Report</h2>
          </div>
          {/* close button removed; wrapper handles closing */}
        </div>

        <div className="flex h-[600px] overflow-hidden">
          <div className="flex-1 bg-gray-900 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Airline Dropdown */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Airline</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none font-mono"
                    value={selectedAirline}
                    onChange={e => setSelectedAirline(e.target.value)}
                    disabled={isSending}
                  >
                    {AIRLINES.map(airline => (
                      <option
                        key={airline.id}
                        value={airline.id}
                        className="font-mono"
                      >
                        {airline.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Icon icon="mdi:chevron-down" className="text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Pilot ID Input (pre-filled from DB, editable) */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Pilot ID</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 font-mono">
                    {selectedAirline}
                  </div>
                  <input
                    type="text"
                    className="w-full pl-16 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-mono"
                    value={pilotIdNum}
                    onChange={e => setPilotIdNum(e.target.value.replace(/\D/g, ''))}
                    placeholder={`Enter your ${selectedAirline} ID NUMBER`}
                    disabled={isSending}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {loadingPilot ? (
                    <span className="inline-flex items-center">
                      <Icon icon="line-md:loading-twotone-loop" className="mr-1 animate-spin" />
                      Loading Pilot ID from profile…
                    </span>
                  ) : pilotIdNum ? (
                    <>Loaded from profile. You may edit before submitting.</>
                  ) : (
                    <>Couldn’t auto-detect your Pilot ID — please enter it manually.</>
                  )}
                </div>
              </div>

              {/* Delay Code Dropdown */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <label className="block text-sm font-medium text-gray-300 mb-2">Delay Code</label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none font-mono"
                    value={selectedCode}
                    onChange={e => setSelectedCode(e.target.value)}
                    disabled={isSending}
                  >
                    {DELAY_CODES.map(dc => (
                      <option
                        key={dc.code}
                        value={dc.code}
                        className="font-mono"
                      >
                        {dc.code} - {dc.reason}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Icon icon="mdi:chevron-down" className="text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
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
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !pilotIdNum.trim()}
              className={`px-5 py-2.5 text-sm font-medium text-white rounded-lg flex items-center space-x-2 ${
                isSending || !pilotIdNum.trim()
                  ? 'bg-blue-600/50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSending ? (
                <>
                  <Icon icon="line-md:loading-twotone-loop" className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Icon icon="mdi:send" />
                  <span>Submit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default DelayCodeModal
