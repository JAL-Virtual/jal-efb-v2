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

// Japan Airlines Group + subsidiaries only
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

// Removed auto-detection function - pilot ID must be manually entered

const DelayCodeModal = ({
  show,
  onClose,
  webhookUrl = "https://discord.com/api/webhooks/1390281109862092913/fYdJLjqYavUblunHHeGFgtx3vShJN44nh8BJMVf_2egEV6vmdxCPY94lr_L_Xa0rf0xJ"
}: Props) => {
  const [pilotIdNum, setPilotIdNum] = useState("") // numeric part only (e.g., "01234")
  const [selectedAirline, setSelectedAirline] = useState("") // No default airline
  const [selectedCode, setSelectedCode] = useState(DELAY_CODES[0].code)
  const [isSending, setIsSending] = useState(false)
  const [feedback, setFeedback] = useState<{message: string, type: 'success'|'error'}|null>(null)

  // Reset on open
  useEffect(() => {
    if (show) {
      setSelectedAirline("") // No default airline selection
      setPilotIdNum("") // Clear pilot ID
      setSelectedCode(DELAY_CODES[0].code)
      setFeedback(null)
      setIsSending(false)
    }
  }, [show])

  useEffect(() => {
    if (feedback) {
      const timeout = setTimeout(() => setFeedback(null), 3000)
      return () => clearTimeout(timeout)
    }
  }, [feedback])

  const handleSend = async () => {
    // Validation
    if (!selectedAirline.trim()) {
      setFeedback({message: "Please select an airline", type: 'error'})
      return
    }
    if (!pilotIdNum.trim()) {
      setFeedback({message: "Please enter your pilot ID", type: 'error'})
      return
    }

    setIsSending(true)
    setFeedback(null)

     const selected = DELAY_CODES.find(d => d.code === selectedCode)
     // Build full ID as JAL<NUM>, e.g., "JAL01234"
     const fullPilotId = `JAL${pilotIdNum}`

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
      <div className="relative w-full max-w-7xl bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-600/50 backdrop-blur-xl">
        {/* Enhanced Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-gray-800/95 to-slate-800/95 backdrop-blur-sm px-8 py-6 border-b border-gray-600/50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg">
              <Icon icon="mdi:clock-alert" width={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                ⚠️ Delay Code Report
              </h2>
              <p className="text-sm text-white mt-1">Report flight delays and issues</p>
            </div>
          </div>
          {/* Enhanced decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full blur-2xl"></div>
        </div>

        <div className="flex h-[650px] overflow-hidden">
          <div className="flex-1 bg-gradient-to-br from-gray-900/95 to-slate-900/95 backdrop-blur-sm overflow-y-auto p-8">
            <div className="space-y-8">
              {/* Enhanced Airline Dropdown */}
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-600/50 p-6">
                <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  ✈️ Airline Selection
                </label>
                <div className="relative">
                  <select
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-700/80 to-slate-700/80 border-2 border-gray-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 appearance-none font-semibold text-lg hover:bg-gray-600/80"
                    value={selectedAirline}
                    onChange={e => setSelectedAirline(e.target.value)}
                    disabled={isSending}
                    required
                  >
                    <option value="" className="text-white bg-gray-800">Select your airline...</option>
                    {AIRLINES.map(airline => (
                      <option
                        key={airline.id}
                        value={airline.id}
                        className="font-semibold text-white bg-gray-800"
                      >
                        {airline.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <Icon icon="mdi:chevron-down" className="text-gray-400 text-xl" />
                  </div>
                </div>
                {!selectedAirline && (
                  <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                    <Icon icon="mdi:alert-circle" width={16} />
                    Please select an airline to continue
                  </div>
                )}
              </div>

              {/* Enhanced Pilot ID Input */}
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-600/50 p-6">
                <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  🆔 Pilot ID
                </label>
                <div className="relative">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold text-lg bg-gray-600 px-2 py-1 rounded">
                     JAL
                   </div>
                  <input
                    type="text"
                    className="w-full pl-20 pr-4 py-4 bg-gradient-to-r from-gray-700/80 to-slate-700/80 border-2 border-gray-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all duration-300 font-mono text-lg hover:bg-gray-600/80"
                    value={pilotIdNum}
                    onChange={e => setPilotIdNum(e.target.value.replace(/\D/g, ''))}
                    placeholder={selectedAirline ? `Enter your ${selectedAirline} ID number` : "Select airline first"}
                    disabled={isSending || !selectedAirline}
                    required
                  />
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  {!selectedAirline ? (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Icon icon="mdi:information" width={16} />
                      Please select an airline first
                    </div>
                  ) : !pilotIdNum ? (
                    <div className="flex items-center gap-2 text-red-400">
                      <Icon icon="mdi:alert-circle" width={16} />
                      Please enter your pilot ID number
                    </div>
                  ) : (
                     <div className="flex items-center gap-2 text-green-400">
                       <Icon icon="mdi:check-circle" width={16} />
                       Pilot ID: JAL{pilotIdNum}
                     </div>
                  )}
                </div>
              </div>

              {/* Enhanced Delay Code Dropdown */}
              <div className="bg-gradient-to-br from-gray-800/80 to-slate-800/80 backdrop-blur-sm rounded-2xl border-2 border-gray-600/50 p-6">
                <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  ⚠️ Delay Code
                </label>
                <div className="relative">
                  <select
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-700/80 to-slate-700/80 border-2 border-gray-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 appearance-none font-semibold text-lg hover:bg-gray-600/80"
                    value={selectedCode}
                    onChange={e => setSelectedCode(e.target.value)}
                    disabled={isSending}
                  >
                    {DELAY_CODES.map(dc => (
                      <option
                        key={dc.code}
                        value={dc.code}
                        className="font-semibold"
                      >
                        {dc.code} - {dc.reason}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <Icon icon="mdi:chevron-down" className="text-gray-400 text-xl" />
                  </div>
                </div>
                <div className="mt-3 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:information" width={16} />
                    Select the appropriate delay code for your situation
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="sticky bottom-0 bg-gradient-to-r from-gray-800/95 to-slate-800/95 backdrop-blur-sm border-t border-gray-600/50 px-8 py-6 flex justify-between items-center">
          {feedback && (
            <div className={`text-sm font-bold px-4 py-2 rounded-xl border-2 backdrop-blur-sm ${
              feedback.type === 'success' 
                ? 'bg-gradient-to-r from-green-900/40 to-green-800/40 text-green-300 border-green-500/50 shadow-lg shadow-green-500/20' 
                : 'bg-gradient-to-r from-red-900/40 to-red-800/40 text-red-300 border-red-500/50 shadow-lg shadow-red-500/20'
            }`}>
              {feedback.message}
            </div>
          )}

          <div className="flex space-x-4 ml-auto">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-gray-700 to-gray-600 border-2 border-gray-500/50 rounded-xl hover:from-gray-600 hover:to-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400/50 transition-all duration-300 transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !selectedAirline.trim() || !pilotIdNum.trim()}
              className={`px-8 py-3 text-sm font-bold text-white rounded-xl flex items-center space-x-3 transition-all duration-300 transform hover:scale-105 ${
                isSending || !selectedAirline.trim() || !pilotIdNum.trim()
                  ? 'bg-gradient-to-r from-gray-600 to-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isSending ? (
                <>
                  <Icon icon="line-md:loading-twotone-loop" className="animate-spin text-xl" />
                  <span>🚀 Sending Report...</span>
                </>
              ) : (
                <>
                  <Icon icon="mdi:send" className="text-xl" />
                  <span>📤 Submit Delay Report</span>
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

