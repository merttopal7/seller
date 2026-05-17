"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Trash, Plus, Globe, Building2, MapPin, Edit2, Check, X, Map } from "lucide-react";

interface Neighborhood {
  id: string;
  name: string;
  cityId: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface City {
  id: string;
  name: string;
  stateId: string;
  neighborhoods: Neighborhood[];
}

interface State {
  id: string;
  name: string;
  countryId: string;
  cities: City[];
}

interface Country {
  id: string;
  name: string;
  states: State[];
}

export function LocationManager({ initialCountries }: { initialCountries: Country[] }) {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>(initialCountries);
  
  // Selection states
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(
    initialCountries.length > 0 ? initialCountries[0].id : null
  );
  const selectedCountry = countries.find((c) => c.id === selectedCountryId);
  
  const [selectedStateId, setSelectedStateId] = useState<string | null>(
    selectedCountry && selectedCountry.states?.length > 0 ? selectedCountry.states[0].id : null
  );
  const selectedState = selectedCountry?.states?.find((s) => s.id === selectedStateId);

  const [selectedCityId, setSelectedCityId] = useState<string | null>(
    selectedState && selectedState.cities?.length > 0 ? selectedState.cities[0].id : null
  );
  const selectedCity = selectedState?.cities?.find((c) => c.id === selectedCityId);

  // Search & Inputs States
  const [countrySearch, setCountrySearch] = useState("");
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [neighSearch, setNeighSearch] = useState("");

  const [newCountryName, setNewCountryName] = useState("");
  const [newStateName, setNewStateName] = useState("");
  const [newCityName, setNewCityName] = useState("");
  
  // Neighborhood Add states
  const [newNeighborhoodName, setNewNeighborhoodName] = useState("");
  const [newNeighLat, setNewNeighLat] = useState("");
  const [newNeighLng, setNewNeighLng] = useState("");

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingLat, setEditingLat] = useState("");
  const [editingLng, setEditingLng] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Loading states
  const [isCountrySubmitting, setIsCountrySubmitting] = useState(false);
  const [isStateSubmitting, setIsStateSubmitting] = useState(false);
  const [isCitySubmitting, setIsCitySubmitting] = useState(false);
  const [isNeighSubmitting, setIsNeighSubmitting] = useState(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Filter lists
  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredStates = selectedCountry
    ? (selectedCountry.states || []).filter((s) =>
        s.name.toLowerCase().includes(stateSearch.toLowerCase())
      )
    : [];

  const filteredCities = selectedState
    ? (selectedState.cities || []).filter((c) =>
        c.name.toLowerCase().includes(citySearch.toLowerCase())
      )
    : [];

  const filteredNeighs = selectedCity
    ? (selectedCity.neighborhoods || []).filter((n) =>
        n.name.toLowerCase().includes(neighSearch.toLowerCase())
      )
    : [];

  const startEdit = (id: string, name: string, lat?: string, lng?: string) => {
    setEditingId(id);
    setEditingName(name);
    setEditingLat(lat || "");
    setEditingLng(lng || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingLat("");
    setEditingLng("");
  };

  // ADD HANDLERS
  const handleAddCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryName.trim()) return;
    setIsCountrySubmitting(true); setError("");
    try {
      const res = await fetch("/api/locations/countries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCountryName.trim() }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      const created: Country = { ...json.country, states: [] };
      setCountries((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedCountryId(created.id); setSelectedStateId(null); setSelectedCityId(null); setNewCountryName(""); router.refresh();
    } catch (err: any) { setError(err.message); } finally { setIsCountrySubmitting(false); }
  };

  const handleAddState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStateName.trim() || !selectedCountryId) return;
    setIsStateSubmitting(true); setError("");
    try {
      const res = await fetch("/api/locations/states", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newStateName.trim(), countryId: selectedCountryId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      const created: State = { ...json.state, cities: [] };
      setCountries((prev) => prev.map(c => c.id === selectedCountryId ? { ...c, states: [...(c.states||[]), created].sort((a,b)=>a.name.localeCompare(b.name)) } : c));
      setSelectedStateId(created.id); setSelectedCityId(null); setNewStateName(""); router.refresh();
    } catch (err: any) { setError(err.message); } finally { setIsStateSubmitting(false); }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim() || !selectedStateId) return;
    setIsCitySubmitting(true); setError("");
    try {
      const res = await fetch("/api/locations/cities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newCityName.trim(), stateId: selectedStateId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      const created: City = { ...json.city, neighborhoods: [] };
      setCountries((prev) => prev.map(c => c.id === selectedCountryId ? { ...c, states: c.states.map(s => s.id === selectedStateId ? { ...s, cities: [...(s.cities||[]), created].sort((a,b)=>a.name.localeCompare(b.name)) } : s) } : c));
      setSelectedCityId(created.id); setNewCityName(""); router.refresh();
    } catch (err: any) { setError(err.message); } finally { setIsCitySubmitting(false); }
  };

  const handleAddNeighborhood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNeighborhoodName.trim() || !selectedCityId) return;
    setIsNeighSubmitting(true); setError("");
    try {
      const lat = newNeighLat ? parseFloat(newNeighLat) : null;
      const lng = newNeighLng ? parseFloat(newNeighLng) : null;
      const res = await fetch("/api/locations/neighborhoods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newNeighborhoodName.trim(), cityId: selectedCityId, latitude: lat, longitude: lng }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setCountries((prev) => prev.map(c => c.id === selectedCountryId ? { ...c, states: c.states.map(s => s.id === selectedStateId ? { ...s, cities: s.cities.map(ct => ct.id === selectedCityId ? { ...ct, neighborhoods: [...(ct.neighborhoods||[]), json.neighborhood].sort((a,b)=>a.name.localeCompare(b.name)) } : ct) } : s) } : c));
      setNewNeighborhoodName(""); setNewNeighLat(""); setNewNeighLng(""); router.refresh();
    } catch (err: any) { setError(err.message); } finally { setIsNeighSubmitting(false); }
  };

  // EDIT HANDLERS
  const handleEdit = async (level: "countries" | "states" | "cities" | "neighborhoods", id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingName.trim()) return;
    setIsSavingEdit(true); setError("");
    try {
      const body: any = { name: editingName.trim() };
      if (level === "neighborhoods") {
        body.latitude = editingLat ? parseFloat(editingLat) : null;
        body.longitude = editingLng ? parseFloat(editingLng) : null;
      }
      const res = await fetch(`/api/locations/${level}/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Failed to edit");
      
      setCountries((prev) => {
        return prev.map(c => {
          if (level === "countries" && c.id === id) return { ...c, name: editingName.trim() };
          return {
            ...c,
            states: (c.states||[]).map(s => {
              if (level === "states" && s.id === id) return { ...s, name: editingName.trim() };
              return {
                ...s,
                cities: (s.cities||[]).map(ct => {
                  if (level === "cities" && ct.id === id) return { ...ct, name: editingName.trim() };
                  return {
                    ...ct,
                    neighborhoods: (ct.neighborhoods||[]).map(n => {
                      if (level === "neighborhoods" && n.id === id) return { ...n, name: editingName.trim(), latitude: body.latitude, longitude: body.longitude };
                      return n;
                    }).sort((a,b)=>a.name.localeCompare(b.name))
                  };
                }).sort((a,b)=>a.name.localeCompare(b.name))
              };
            }).sort((a,b)=>a.name.localeCompare(b.name))
          };
        }).sort((a,b)=>a.name.localeCompare(b.name));
      });
      cancelEdit(); router.refresh();
    } catch(err: any) { setError(err.message); } finally { setIsSavingEdit(false); }
  };

  // DELETE HANDLERS
  const handleDelete = async (level: "countries" | "states" | "cities" | "neighborhoods", id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete this ${level.slice(0, -1)}?`)) return;
    setDeletingId(id); setError("");
    try {
      const res = await fetch(`/api/locations/${level}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setCountries(prev => prev.map(c => ({
        ...c,
        states: c.states?.filter(s => s.id !== id).map(s => ({
          ...s,
          cities: s.cities?.filter(ct => ct.id !== id).map(ct => ({
            ...ct,
            neighborhoods: ct.neighborhoods?.filter(n => n.id !== id) || []
          })) || []
        })) || []
      })).filter(c => c.id !== id));
      if (level === "countries" && selectedCountryId === id) { setSelectedCountryId(null); setSelectedStateId(null); setSelectedCityId(null); }
      if (level === "states" && selectedStateId === id) { setSelectedStateId(null); setSelectedCityId(null); }
      if (level === "cities" && selectedCityId === id) setSelectedCityId(null);
      router.refresh();
    } catch(err: any) { setError(err.message); } finally { setDeletingId(null); }
  };

  return (
    <div className="space-y-4">
      {error && <div className="p-3 text-sm bg-destructive/15 text-destructive rounded-xl font-medium">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        
        {/* COUNTRIES */}
        <div className="bg-card border border-border rounded-xl flex flex-col h-[700px] shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="font-semibold flex items-center gap-2 mb-3 text-base"><Globe className="h-4 w-4 text-primary" /> Countries</h2>
            <Input placeholder="Search country..." value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredCountries.length === 0 ? <p className="text-sm text-muted-foreground text-center p-4">No countries found.</p> : null}
            {filteredCountries.map(c => (
              <div key={c.id} onClick={() => { setSelectedCountryId(c.id); setSelectedStateId(null); setSelectedCityId(null); cancelEdit(); }} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-sm transition-colors border ${selectedCountryId === c.id ? "bg-primary/10 border-primary/30 text-primary font-medium" : "bg-transparent border-transparent hover:bg-muted"}`}>
                {editingId === c.id ? (
                  <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                    <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="h-7 text-xs px-2" autoFocus />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={(e) => handleEdit("countries", c.id, e)} disabled={isSavingEdit}><Check className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <>
                    <span className="truncate">{c.name}</span>
                    <div className="flex items-center gap-0 opacity-50 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); startEdit(c.id, c.name); }}><Edit2 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete("countries", c.id, e)} disabled={deletingId === c.id}>{deletingId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash className="h-3 w-3" />}</Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border bg-muted/20">
            <form onSubmit={handleAddCountry} className="flex gap-2">
              <Input placeholder="New country" value={newCountryName} onChange={(e) => setNewCountryName(e.target.value)} className="h-9 text-sm" />
              <Button type="submit" size="sm" disabled={isCountrySubmitting || !newCountryName.trim()} className="h-9 px-3">{isCountrySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</Button>
            </form>
          </div>
        </div>

        {/* STATES */}
        <div className="bg-card border border-border rounded-xl flex flex-col h-[700px] shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="font-semibold flex items-center gap-2 mb-3 text-base"><Map className="h-4 w-4 text-emerald-500" /> States / Prov.</h2>
            <Input placeholder="Search state..." value={stateSearch} onChange={(e) => setStateSearch(e.target.value)} disabled={!selectedCountryId} className="h-9 text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedCountryId ? <p className="text-sm text-muted-foreground text-center p-4">Select a country first.</p> : filteredStates.length === 0 ? <p className="text-sm text-muted-foreground text-center p-4">No states found.</p> : null}
            {filteredStates.map(s => (
              <div key={s.id} onClick={() => { setSelectedStateId(s.id); setSelectedCityId(null); cancelEdit(); }} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-sm transition-colors border ${selectedStateId === s.id ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-medium" : "bg-transparent border-transparent hover:bg-muted"}`}>
                {editingId === s.id ? (
                  <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                    <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="h-7 text-xs px-2" autoFocus />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={(e) => handleEdit("states", s.id, e)} disabled={isSavingEdit}><Check className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <>
                    <span className="truncate">{s.name}</span>
                    <div className="flex items-center gap-0 opacity-50 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); startEdit(s.id, s.name); }}><Edit2 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete("states", s.id, e)} disabled={deletingId === s.id}>{deletingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash className="h-3 w-3" />}</Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border bg-muted/20">
            <form onSubmit={handleAddState} className="flex gap-2">
              <Input placeholder="New state" value={newStateName} onChange={(e) => setNewStateName(e.target.value)} disabled={!selectedCountryId} className="h-9 text-sm" />
              <Button type="submit" size="sm" disabled={isStateSubmitting || !newStateName.trim() || !selectedCountryId} className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white">{isStateSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</Button>
            </form>
          </div>
        </div>

        {/* CITIES */}
        <div className="bg-card border border-border rounded-xl flex flex-col h-[700px] shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="font-semibold flex items-center gap-2 mb-3 text-base"><Building2 className="h-4 w-4 text-blue-500" /> Cities</h2>
            <Input placeholder="Search city..." value={citySearch} onChange={(e) => setCitySearch(e.target.value)} disabled={!selectedStateId} className="h-9 text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedStateId ? <p className="text-sm text-muted-foreground text-center p-4">Select a state first.</p> : filteredCities.length === 0 ? <p className="text-sm text-muted-foreground text-center p-4">No cities found.</p> : null}
            {filteredCities.map(c => (
              <div key={c.id} onClick={() => { setSelectedCityId(c.id); cancelEdit(); }} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer text-sm transition-colors border ${selectedCityId === c.id ? "bg-blue-500/10 border-blue-500/30 text-blue-600 font-medium" : "bg-transparent border-transparent hover:bg-muted"}`}>
                {editingId === c.id ? (
                  <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                    <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="h-7 text-xs px-2" autoFocus />
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={(e) => handleEdit("cities", c.id, e)} disabled={isSavingEdit}><Check className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                  </div>
                ) : (
                  <>
                    <span className="truncate">{c.name}</span>
                    <div className="flex items-center gap-0 opacity-50 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); startEdit(c.id, c.name); }}><Edit2 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete("cities", c.id, e)} disabled={deletingId === c.id}>{deletingId === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash className="h-3 w-3" />}</Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border bg-muted/20">
            <form onSubmit={handleAddCity} className="flex gap-2">
              <Input placeholder="New city" value={newCityName} onChange={(e) => setNewCityName(e.target.value)} disabled={!selectedStateId} className="h-9 text-sm" />
              <Button type="submit" size="sm" disabled={isCitySubmitting || !newCityName.trim() || !selectedStateId} className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white">{isCitySubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}</Button>
            </form>
          </div>
        </div>

        {/* NEIGHBORHOODS */}
        <div className="bg-card border border-border rounded-xl flex flex-col h-[700px] shadow-sm">
          <div className="p-4 border-b border-border bg-muted/20">
            <h2 className="font-semibold flex items-center gap-2 mb-3 text-base"><MapPin className="h-4 w-4 text-orange-500" /> Neighborhoods</h2>
            <Input placeholder="Search neighborhood..." value={neighSearch} onChange={(e) => setNeighSearch(e.target.value)} disabled={!selectedCityId} className="h-9 text-sm" />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!selectedCityId ? <p className="text-sm text-muted-foreground text-center p-4">Select a city first.</p> : filteredNeighs.length === 0 ? <p className="text-sm text-muted-foreground text-center p-4">No neighborhoods found.</p> : null}
            {filteredNeighs.map(n => (
              <div key={n.id} className="flex flex-col p-2.5 rounded-lg text-sm bg-transparent border border-transparent hover:bg-muted transition-colors">
                {editingId === n.id ? (
                  <div className="flex flex-col gap-2 w-full">
                    <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="h-7 text-xs px-2" autoFocus />
                    <div className="flex gap-2">
                      <Input value={editingLat} onChange={e => setEditingLat(e.target.value)} placeholder="Lat" type="number" step="any" className="h-7 text-xs px-2 flex-1" />
                      <Input value={editingLng} onChange={e => setEditingLng(e.target.value)} placeholder="Lng" type="number" step="any" className="h-7 text-xs px-2 flex-1" />
                    </div>
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100" onClick={(e) => handleEdit("neighborhoods", n.id, e)} disabled={isSavingEdit}><Check className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={cancelEdit}><X className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between group">
                    <div className="flex flex-col">
                      <span className="font-medium text-orange-700 dark:text-orange-400">{n.name}</span>
                      {(n.latitude || n.longitude) && <span className="text-[10px] text-muted-foreground">Coords: {n.latitude}, {n.longitude}</span>}
                    </div>
                    <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEdit(n.id, n.name, n.latitude?.toString(), n.longitude?.toString())}><Edit2 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={(e) => handleDelete("neighborhoods", n.id, e)} disabled={deletingId === n.id}>{deletingId === n.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash className="h-3 w-3" />}</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border bg-muted/20">
            <form onSubmit={handleAddNeighborhood} className="flex flex-col gap-2">
              <Input placeholder="New neighborhood" value={newNeighborhoodName} onChange={(e) => setNewNeighborhoodName(e.target.value)} disabled={!selectedCityId} className="h-9 text-sm" />
              <div className="flex gap-2">
                <Input placeholder="Lat (opt)" type="number" step="any" value={newNeighLat} onChange={(e) => setNewNeighLat(e.target.value)} disabled={!selectedCityId} className="h-9 text-xs w-1/2" />
                <Input placeholder="Lng (opt)" type="number" step="any" value={newNeighLng} onChange={(e) => setNewNeighLng(e.target.value)} disabled={!selectedCityId} className="h-9 text-xs w-1/2" />
              </div>
              <Button type="submit" size="sm" disabled={isNeighSubmitting || !newNeighborhoodName.trim() || !selectedCityId} className="h-9 w-full bg-orange-600 hover:bg-orange-700 text-white">{isNeighSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />} Add</Button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
