"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, ChevronRight, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LocationFilters({ locations, defaultCountry, defaultState, defaultCity, defaultLocation }: { locations: any[], defaultCountry?: string, defaultState?: string, defaultCity?: string, defaultLocation?: string }) {
  // We'll search for the initial state and city if they are not explicitly provided
  let initialCountry = defaultCountry || "";
  let initialState = defaultState || "";
  let initialCity = defaultCity || "";

  if (defaultLocation) {
    // Attempt to auto-detect the full hierarchy from the neighborhood
    for (const country of locations) {
      for (const state of country.states || []) {
        for (const city of state.cities || []) {
          if (city.neighborhoods?.some((n: any) => n.name === defaultLocation)) {
            initialCountry = country.name;
            initialState = state.name;
            initialCity = city.name;
            break;
          }
        }
        if (initialState) break;
      }
      if (initialCountry) break;
    }
  } else if (defaultCity) {
    // Attempt to auto-detect country/state from city
    for (const country of locations) {
      for (const state of country.states || []) {
        if (state.cities?.some((c: any) => c.name === defaultCity)) {
          initialCountry = country.name;
          initialState = state.name;
          break;
        }
      }
      if (initialCountry) break;
    }
  }

  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedState, setSelectedState] = useState(initialState);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(defaultLocation || "");

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"country" | "state" | "city" | "neighborhood">("country");
  
  // Temporary states
  const [tempCountry, setTempCountry] = useState(initialCountry);
  const [tempState, setTempState] = useState(initialState);
  const [tempCity, setTempCity] = useState(initialCity);

  const handleCountrySelect = (countryName: string) => {
    if (!countryName) {
      setSelectedCountry("");
      setSelectedState("");
      setSelectedCity("");
      setSelectedNeighborhood("");
      setIsOpen(false);
      return;
    }
    setTempCountry(countryName);
    // Auto-skip if country only has 1 state? Keep it simple: always go to state
    setStep("state");
  };

  const handleStateSelect = (stateName: string) => {
    if (!stateName) {
      setSelectedCountry(tempCountry);
      setSelectedState("");
      setSelectedCity("");
      setSelectedNeighborhood("");
      setIsOpen(false);
      return;
    }
    setTempState(stateName);
    setSelectedCountry(tempCountry);
    setSelectedState(stateName);
    setSelectedCity("");
    setSelectedNeighborhood("");
    
    // Check if state has cities
    const selectedCountryObj = locations.find(c => c.name === tempCountry);
    const selectedStateObj = selectedCountryObj?.states?.find((s: any) => s.name === stateName);
    const hasCities = selectedStateObj?.cities && selectedStateObj.cities.length > 0;
    
    if (hasCities) {
      setStep("city");
    } else {
      setIsOpen(false);
    }
  };

  const handleCitySelect = (cityName: string) => {
    if (!cityName) {
      setSelectedCountry(tempCountry);
      setSelectedState(tempState);
      setSelectedCity("");
      setSelectedNeighborhood("");
      setIsOpen(false);
      return;
    }
    setTempCity(cityName);
    setSelectedCountry(tempCountry);
    setSelectedState(tempState);
    setSelectedCity(cityName);
    setSelectedNeighborhood("");
    
    // Check if city has neighborhoods
    const selectedCountryObj = locations.find(c => c.name === tempCountry);
    const selectedStateObj = selectedCountryObj?.states?.find((s: any) => s.name === tempState);
    const selectedCityObj = selectedStateObj?.cities?.find((c: any) => c.name === cityName);
    const hasNeighborhoods = selectedCityObj?.neighborhoods && selectedCityObj.neighborhoods.length > 0;
    
    if (hasNeighborhoods) {
      setStep("neighborhood");
    } else {
      setIsOpen(false);
    }
  };

  const handleNeighborhoodSelect = (neighName: string) => {
    setSelectedCountry(tempCountry);
    setSelectedState(tempState);
    setSelectedCity(tempCity);
    setSelectedNeighborhood(neighName);
    setIsOpen(false);
  };

  // Get active display text
  let displayText = "Any Location";
  if (selectedNeighborhood) {
    displayText = `${selectedNeighborhood}, ${selectedCity}`;
  } else if (selectedCity) {
    displayText = `${selectedCity}, ${selectedState}`;
  } else if (selectedState) {
    displayText = `${selectedState}, ${selectedCountry}`;
  } else if (selectedCountry) {
    displayText = selectedCountry;
  }

  // Current data slices
  const activeCountry = locations.find(c => c.name === tempCountry);
  const states = activeCountry?.states || [];
  
  const activeState = states.find((s: any) => s.name === tempState);
  const cities = activeState?.cities || [];

  const activeCity = cities.find((c: any) => c.name === tempCity);
  const neighborhoods = activeCity?.neighborhoods || [];

  return (
    <div>
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
        Location
      </Label>
      
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (open) {
          setStep("country");
          setTempCountry(selectedCountry);
          setTempState(selectedState);
          setTempCity(selectedCity);
        }
      }}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between font-normal text-sm h-9 bg-background hover:bg-muted/50 border-input"
          >
            <span className="flex items-center gap-2 truncate">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{displayText}</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50 shrink-0" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl gap-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <DialogTitle className="text-lg flex items-center gap-2 flex-wrap">
              {step === "country" && "Select Country"}
              
              {step === "state" && (
                <>
                  <button onClick={() => setStep("country")} className="text-muted-foreground hover:text-foreground text-sm font-normal underline decoration-dashed">
                    {tempCountry}
                  </button>
                  <ChevronRight className="h-4 w-4 opacity-50" /> Select State
                </>
              )}

              {step === "city" && (
                <>
                  <button onClick={() => setStep("country")} className="text-muted-foreground hover:text-foreground text-sm font-normal underline decoration-dashed">
                    {tempCountry}
                  </button>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                  <button onClick={() => setStep("state")} className="text-muted-foreground hover:text-foreground text-sm font-normal underline decoration-dashed">
                    {tempState}
                  </button>
                  <ChevronRight className="h-4 w-4 opacity-50" /> Select City
                </>
              )}

              {step === "neighborhood" && (
                <>
                  <button onClick={() => setStep("state")} className="text-muted-foreground hover:text-foreground text-sm font-normal underline decoration-dashed">
                    {tempState}
                  </button>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                  <button onClick={() => setStep("city")} className="text-muted-foreground hover:text-foreground text-sm font-normal underline decoration-dashed">
                    {tempCity}
                  </button>
                  <ChevronRight className="h-4 w-4 opacity-50" /> Area
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            
            {step === "country" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleCountrySelect("")}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-colors hover:bg-muted/50 ${!selectedCountry ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                >
                  All Countries
                  {!selectedCountry && <Check className="h-4 w-4" />}
                </button>
                {locations.map((country: any) => (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => handleCountrySelect(country.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-colors hover:bg-muted/50 ${selectedCountry === country.name ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                  >
                    {country.name}
                    <ChevronRight className="h-4 w-4 opacity-30" />
                  </button>
                ))}
              </div>
            )}

            {step === "state" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleStateSelect("")}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-colors hover:bg-muted/50 ${!selectedState ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                >
                  All of {tempCountry}
                  {!selectedState && <Check className="h-4 w-4" />}
                </button>
                {states.map((state: any) => (
                  <button
                    key={state.id}
                    type="button"
                    onClick={() => handleStateSelect(state.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-colors hover:bg-muted/50 ${selectedState === state.name ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                  >
                    {state.name}
                    <ChevronRight className="h-4 w-4 opacity-30" />
                  </button>
                ))}
              </div>
            )}

            {step === "city" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleCitySelect("")}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-colors hover:bg-muted/50 ${!selectedCity ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                >
                  All of {tempState}
                  {!selectedCity && <Check className="h-4 w-4" />}
                </button>
                {cities.map((city: any) => (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleCitySelect(city.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-colors hover:bg-muted/50 ${selectedCity === city.name ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                  >
                    {city.name}
                    <ChevronRight className="h-4 w-4 opacity-30" />
                  </button>
                ))}
              </div>
            )}

            {step === "neighborhood" && (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleNeighborhoodSelect("")}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-colors hover:bg-muted/50 ${!selectedNeighborhood ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                >
                  All of {tempCity}
                  {!selectedNeighborhood && <Check className="h-4 w-4" />}
                </button>
                {neighborhoods.map((neigh: any) => (
                  <button
                    key={neigh.id}
                    type="button"
                    onClick={() => handleNeighborhoodSelect(neigh.name)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-colors hover:bg-muted/50 ${selectedNeighborhood === neigh.name ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}
                  >
                    {neigh.name}
                    {selectedNeighborhood === neigh.name && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            )}

          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden inputs to attach to the search form */}
      {selectedCountry && !selectedCity && !selectedNeighborhood && <input type="hidden" name="country" value={selectedCountry} />}
      {selectedState && !selectedCity && !selectedNeighborhood && <input type="hidden" name="state" value={selectedState} />}
      {selectedCity && !selectedNeighborhood && <input type="hidden" name="city" value={selectedCity} />}
      {selectedNeighborhood && <input type="hidden" name="location" value={selectedNeighborhood} />}
    </div>
  );
}
