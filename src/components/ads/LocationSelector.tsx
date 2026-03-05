'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, MapPin, Globe, Loader2 } from 'lucide-react'

// Format stored in campaign.locations:
//   Countries: "CO", "MX" (ISO-2 code, 2 chars)
//   Cities:    "city:KEY:Name" (e.g. "city:2388929:Bogotá")

const COUNTRIES: { code: string; name: string }[] = [
    { code: 'AR', name: 'Argentina' }, { code: 'BO', name: 'Bolivia' },
    { code: 'BR', name: 'Brasil' }, { code: 'CA', name: 'Canadá' },
    { code: 'CL', name: 'Chile' }, { code: 'CO', name: 'Colombia' },
    { code: 'CR', name: 'Costa Rica' }, { code: 'CU', name: 'Cuba' },
    { code: 'DO', name: 'República Dominicana' }, { code: 'EC', name: 'Ecuador' },
    { code: 'SV', name: 'El Salvador' }, { code: 'ES', name: 'España' },
    { code: 'US', name: 'Estados Unidos' }, { code: 'GT', name: 'Guatemala' },
    { code: 'HN', name: 'Honduras' }, { code: 'MX', name: 'México' },
    { code: 'NI', name: 'Nicaragua' }, { code: 'PA', name: 'Panamá' },
    { code: 'PY', name: 'Paraguay' }, { code: 'PE', name: 'Perú' },
    { code: 'PR', name: 'Puerto Rico' }, { code: 'UY', name: 'Uruguay' },
    { code: 'VE', name: 'Venezuela' }, { code: 'DE', name: 'Alemania' },
    { code: 'FR', name: 'Francia' }, { code: 'GB', name: 'Reino Unido' },
    { code: 'IT', name: 'Italia' }, { code: 'PT', name: 'Portugal' },
    { code: 'AU', name: 'Australia' }, { code: 'JP', name: 'Japón' },
    { code: 'MX', name: 'México' },
]

// Deduplicate
const COUNTRIES_LIST = COUNTRIES.filter((c, i, a) => a.findIndex(x => x.code === c.code) === i)

function parseLocation(loc: string): { type: 'country' | 'city'; code?: string; key?: string; name: string } {
    if (loc.startsWith('city:')) {
        const parts = loc.split(':')
        return { type: 'city', key: parts[1], name: parts.slice(2).join(':') }
    }
    const country = COUNTRIES_LIST.find(c => c.code === loc.toUpperCase())
    return { type: 'country', code: loc.toUpperCase(), name: country?.name || loc }
}

interface Props {
    selected: string[]
    onChange: (locs: string[]) => void
    platform?: string
}

export default function LocationSelector({ selected, onChange, platform = 'META' }: Props) {
    const [tab, setTab] = useState<'country' | 'city'>('country')
    const [countrySearch, setCountrySearch] = useState('')
    const [citySearch, setCitySearch] = useState('')
    const [cityResults, setCityResults] = useState<{ key: string; name: string; type: string; countryName?: string }[]>([])
    const [searchingCities, setSearchingCities] = useState(false)
    const [cityError, setCityError] = useState<string | null>(null)
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    const selectedCountries = selected.filter(l => !l.startsWith('city:'))
    const selectedCities = selected.filter(l => l.startsWith('city:'))

    const filteredCountries = COUNTRIES_LIST.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.toLowerCase().includes(countrySearch.toLowerCase())
    )

    function toggleCountry(code: string) {
        if (selectedCountries.includes(code)) {
            onChange(selected.filter(l => l !== code))
        } else {
            onChange([...selected, code])
        }
    }

    function addCity(key: string, name: string) {
        const val = `city:${key}:${name}`
        if (!selected.includes(val)) onChange([...selected, val])
        setCitySearch('')
        setCityResults([])
    }

    function removeLocation(loc: string) {
        onChange(selected.filter(l => l !== loc))
    }

    useEffect(() => {
        if (citySearch.trim().length < 2) { setCityResults([]); setCityError(null); return }
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setSearchingCities(true); setCityError(null)
            try {
                const res = await fetch(`/api/ads/integrations/${platform.toLowerCase()}/locations?q=${encodeURIComponent(citySearch)}`)
                const data = await res.json()
                if (!res.ok) {
                    setCityError(data.error || 'Error al buscar')
                    setCityResults([])
                } else {
                    setCityResults((data.locations || []).slice(0, 8))
                }
            } catch {
                setCityError('Error de conexión')
            } finally {
                setSearchingCities(false)
            }
        }, 500)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [citySearch, platform])

    return (
        <div className="bg-dark-900/60 border border-white/10 rounded-2xl overflow-hidden">
            {/* Selected chips */}
            {selected.length > 0 && (
                <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5 border-b border-white/5">
                    {selected.map(loc => {
                        const parsed = parseLocation(loc)
                        return (
                            <span key={loc} className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${parsed.type === 'country'
                                ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                                : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                                }`}>
                                {parsed.type === 'country' ? <Globe size={10} /> : <MapPin size={10} />}
                                {parsed.name}
                                <button onClick={() => removeLocation(loc)} className="text-white/30 hover:text-red-400 transition-all ml-0.5">
                                    <X size={10} />
                                </button>
                            </span>
                        )
                    })}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-white/8">
                {([['country', 'Países', <Globe size={12} />], ['city', 'Ciudades', <MapPin size={12} />]] as const).map(([key, label, icon]) => (
                    <button key={key} onClick={() => setTab(key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all ${tab === key ? 'text-white border-b-2 border-purple-500' : 'text-white/30 hover:text-white/60'}`}>
                        {icon} {label}
                        {key === 'country' && selectedCountries.length > 0 && (
                            <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">{selectedCountries.length}</span>
                        )}
                        {key === 'city' && selectedCities.length > 0 && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full">{selectedCities.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Country tab */}
            {tab === 'country' && (
                <div className="p-3">
                    <div className="relative mb-3">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            value={countrySearch}
                            onChange={e => setCountrySearch(e.target.value)}
                            placeholder="Buscar país..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder:text-white/20"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {filteredCountries.map(c => {
                            const isSelected = selectedCountries.includes(c.code)
                            return (
                                <button key={c.code} onClick={() => toggleCountry(c.code)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${isSelected
                                        ? 'bg-purple-500/20 border border-purple-500/40 text-purple-200'
                                        : 'bg-white/3 border border-white/8 text-white/60 hover:bg-white/8 hover:text-white/90'
                                        }`}>
                                    <span className="font-black text-[10px] text-white/30 w-5 shrink-0">{c.code}</span>
                                    <span className="truncate">{c.name}</span>
                                    {isSelected && <X size={10} className="ml-auto shrink-0 text-purple-400" />}
                                </button>
                            )
                        })}
                        {filteredCountries.length === 0 && (
                            <p className="col-span-2 text-center text-xs text-white/20 py-4">Sin resultados</p>
                        )}
                    </div>
                </div>
            )}

            {/* City tab */}
            {tab === 'city' && (
                <div className="p-3">
                    <div className="relative mb-2">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                            value={citySearch}
                            onChange={e => setCitySearch(e.target.value)}
                            placeholder="Buscar ciudad (requiere Meta conectado)..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 placeholder:text-white/20"
                        />
                        {searchingCities && (
                            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 animate-spin" />
                        )}
                    </div>

                    {cityError && (
                        <p className="text-[11px] text-red-400/70 mb-2 px-1">
                            {cityError.includes('not connected') || cityError.includes('Platform not') || cityError.includes('not found')
                                ? 'Conecta Meta Ads primero para buscar ciudades.'
                                : cityError}
                        </p>
                    )}

                    {cityResults.length > 0 && (
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {cityResults.map(r => {
                                const val = `city:${r.key}:${r.name}`
                                const isSelected = selected.includes(val)
                                return (
                                    <button key={r.key} onClick={() => !isSelected && addCity(r.key, r.name)} disabled={isSelected}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left transition-all ${isSelected
                                            ? 'bg-blue-500/10 border border-blue-500/20 text-blue-300 cursor-default'
                                            : 'bg-white/3 border border-white/8 text-white/70 hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-300'
                                            }`}>
                                        <MapPin size={11} className="shrink-0 text-white/30" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{r.name}</p>
                                            {r.countryName && <p className="text-[10px] text-white/30">{r.countryName}</p>}
                                        </div>
                                        <span className="text-[9px] text-white/20 shrink-0">{r.type}</span>
                                        {isSelected && <span className="text-[10px] text-blue-400 font-bold shrink-0">✓</span>}
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {citySearch.length >= 2 && !searchingCities && cityResults.length === 0 && !cityError && (
                        <p className="text-xs text-white/20 text-center py-4">Sin resultados para "{citySearch}"</p>
                    )}

                    {citySearch.length < 2 && (
                        <p className="text-[11px] text-white/20 text-center py-4">Escribe al menos 2 caracteres para buscar</p>
                    )}
                </div>
            )}
        </div>
    )
}
