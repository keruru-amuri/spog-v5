"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MapPin, Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { LocationService } from "@/services/location-service"
import { Location } from "@/types/location"

interface LocationOption {
  value: string;
  label: string;
}

interface LocationSelectorProps {
  currentLocation: string;
  setCurrentLocation: (location: string) => void;
}

export function LocationSelector({ currentLocation, setCurrentLocation }: LocationSelectorProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [locations, setLocations] = useState<LocationOption[]>([{ value: "all", label: "All Locations" }]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const locationService = new LocationService();
        const response = await locationService.getLocations();

        if (response.success && response.data) {
          // Map API locations to location options
          const locationOptions: LocationOption[] = [
            { value: "all", label: "All Locations" },
            ...response.data.map((location: Location) => ({
              value: location.id,
              label: location.name
            }))
          ];
          setLocations(locationOptions);
        } else {
          setError(response.error || 'Failed to load locations');
          // Fallback to default locations
          setLocations([{ value: "all", label: "All Locations" }]);
        }
      } catch (err) {
        console.error('Error fetching locations:', err);
        setError('Failed to load locations');
        // Fallback to default locations
        setLocations([{ value: "all", label: "All Locations" }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[180px] justify-between">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 opacity-50" />
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <span className="truncate">
                {locations.find(loc => loc.value === currentLocation)?.label || "All Locations"}
              </span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search location..." />
          <CommandEmpty>No location found.</CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Loading locations...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-sm text-red-500">{error}</div>
          ) : (
            <CommandGroup>
              <CommandList>
                {locations.map((location) => (
                  <CommandItem
                    key={location.value}
                    value={location.value}
                    onSelect={(currentValue) => {
                      setCurrentLocation(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${currentLocation === location.value ? "opacity-100" : "opacity-0"}`}
                    />
                    {location.label}
                  </CommandItem>
                ))}
              </CommandList>
            </CommandGroup>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
