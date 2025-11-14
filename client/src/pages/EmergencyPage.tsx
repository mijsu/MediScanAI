import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  MapPin, 
  Navigation, 
  Star,
  Clock,
  Search,
  AlertCircle,
  X,
  Locate,
  Loader2
} from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  address: string;
  distance: number;
  specialties: string[];
  rating: number;
  phoneNumber: string;
  isOpen24Hours: boolean;
  latitude: number;
  longitude: number;
}

const mockHospitals: Hospital[] = [
  {
    id: "1",
    name: "Philippine General Hospital",
    address: "Taft Avenue, Ermita, Manila",
    distance: 1.2,
    specialties: ["Emergency Care", "Cardiology", "Neurology"],
    rating: 4.5,
    phoneNumber: "+63 (2) 8554-8400",
    isOpen24Hours: true,
    latitude: 14.5782,
    longitude: 120.9858,
  },
  {
    id: "2",
    name: "St. Luke's Medical Center",
    address: "279 E Rodriguez Sr. Ave, Quezon City",
    distance: 2.8,
    specialties: ["Emergency Care", "Oncology", "Pediatrics"],
    rating: 4.7,
    phoneNumber: "+63 (2) 8723-0101",
    isOpen24Hours: true,
    latitude: 14.6224,
    longitude: 121.0194,
  },
  {
    id: "3",
    name: "Makati Medical Center",
    address: "2 Amorsolo Street, Legaspi Village, Makati City",
    distance: 3.5,
    specialties: ["Emergency Care", "Cardiology", "Orthopedics"],
    rating: 4.6,
    phoneNumber: "+63 (2) 8888-8999",
    isOpen24Hours: true,
    latitude: 14.5547,
    longitude: 121.0244,
  },
  {
    id: "4",
    name: "The Medical City",
    address: "Ortigas Avenue, Pasig City",
    distance: 4.1,
    specialties: ["Emergency Care", "Laboratory Services", "Radiology"],
    rating: 4.5,
    phoneNumber: "+63 (2) 8988-1000",
    isOpen24Hours: true,
    latitude: 14.5864,
    longitude: 121.0623,
  },
  {
    id: "5",
    name: "Manila Doctors Hospital",
    address: "667 United Nations Avenue, Ermita, Manila",
    distance: 1.8,
    specialties: ["Emergency Care", "Internal Medicine", "Surgery"],
    rating: 4.4,
    phoneNumber: "+63 (2) 8558-0888",
    isOpen24Hours: true,
    latitude: 14.5833,
    longitude: 120.9839,
  },
];

const emergencyContacts = [
  {
    id: "1",
    title: "Emergency Services",
    number: "911",
    description: "Life-threatening emergencies",
    icon: AlertCircle,
    color: "from-red-500 to-red-600",
  },
  {
    id: "2",
    title: "National Poison Center",
    number: "+63 (2) 8524-1078",
    description: "Philippine Poison Control",
    icon: Phone,
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "3",
    title: "NCMH Crisis Hotline",
    number: "0917-899-8727",
    description: "Mental health crisis support",
    icon: Phone,
    color: "from-purple-500 to-purple-600",
  },
];

export default function EmergencyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitals, setHospitals] = useState(mockHospitals);
  const [baseHospitals, setBaseHospitals] = useState(mockHospitals); // Stores either GPS results or mock data
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [expandedHospitalId, setExpandedHospitalId] = useState<string | null>(null);
  const [isActualLocation, setIsActualLocation] = useState(false); // Track if location is from GPS or default
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null); // Track GPS accuracy in meters
  const { toast } = useToast();
  const watchIdRef = useRef<number | null>(null);

  // Fetch nearby hospitals from API
  const fetchNearbyHospitals = async (location: {lat: number; lng: number}) => {
    try {
      const response = await fetch(`/api/hospitals/nearby?lat=${location.lat}&lng=${location.lng}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch nearby hospitals');
      }
      
      const data = await response.json();
      setHospitals(data);
      setBaseHospitals(data); // Update base hospitals to GPS results
    } catch (error) {
      console.error('Error fetching nearby hospitals:', error);
      toast({
        title: "Error",
        description: "Failed to load nearby hospitals. Showing default results.",
        variant: "destructive",
      });
      // Fall back to mock hospitals
      setHospitals(mockHospitals);
      setBaseHospitals(mockHospitals);
    }
  };

  // Automatically request location on page load with watchPosition for better accuracy
  useEffect(() => {
    // Try to get actual location from browser geolocation
    if (navigator.geolocation) {
      setLoadingLocation(true);
      
      // Use watchPosition to get better GPS accuracy over time
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const actualLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          const accuracy = position.coords.accuracy; // in meters
          
          console.log(`GPS Update - Accuracy: ${accuracy.toFixed(0)}m, Lat: ${actualLocation.lat}, Lng: ${actualLocation.lng}`);
          
          // Always update location and fetch hospitals regardless of accuracy
          setUserLocation(actualLocation);
          setLocationAccuracy(accuracy);
          setIsActualLocation(true);
          setLoadingLocation(false);
          
          // Fetch hospitals with the current location
          fetchNearbyHospitals(actualLocation);
          
          // Store actual location in cache
          sessionStorage.setItem('userLocation', JSON.stringify({
            ...actualLocation,
            accuracy,
            isActual: true,
            timestamp: Date.now(),
          }));
          
          // Stop watching after a few seconds (browser geo won't get better accuracy)
          setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
          }, 3000);
        },
        (error) => {
          // If geolocation fails, just show mock hospitals without setting location
          console.log('Geolocation not available:', error.message);
          setLoadingLocation(false);
          setIsActualLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000, // Longer timeout for watchPosition
          maximumAge: 0,
        }
      );
      
      watchIdRef.current = watchId;
      
      // Cleanup: stop watching when component unmounts
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
      };
    } else {
      // Browser doesn't support geolocation
      console.log('Browser does not support geolocation');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      // If no search query, restore base hospitals (GPS results or mock data)
      setHospitals(baseHospitals);
      return;
    }

    // Filter the base hospital list
    const filtered = baseHospitals.filter(
      (hospital) =>
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.specialties.some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    setHospitals(filtered);
  };

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const clearSearch = () => {
    setSearchQuery("");
    setHospitals(baseHospitals); // Restore base hospitals (GPS results or mock data)
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    setLoadingLocation(true);
    
    // Clear any existing watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    
    // Use watchPosition for better GPS accuracy over time
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const accuracy = position.coords.accuracy;
        
        console.log(`Manual GPS Update - Accuracy: ${accuracy.toFixed(0)}m, Lat: ${location.lat}, Lng: ${location.lng}`);
        
        setUserLocation(location);
        setLocationAccuracy(accuracy);
        setIsActualLocation(true);
        setLoadingLocation(false);
        
        // Store in sessionStorage for future use
        sessionStorage.setItem('userLocation', JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          accuracy,
          isActual: true,
          timestamp: Date.now()
        }));
        
        // Fetch hospitals immediately
        fetchNearbyHospitals(location);
        
        // Show success message based on accuracy
        if (accuracy < 100) {
          toast({
            title: "Location Found",
            description: `High accuracy: ±${accuracy.toFixed(0)}m`,
          });
        } else if (accuracy < 1000) {
          toast({
            title: "Location Found",
            description: `Approximate location: ±${(accuracy / 1000).toFixed(1)}km`,
          });
        } else {
          toast({
            title: "Location Found",
            description: `Approximate location (IP-based): ±${(accuracy / 1000).toFixed(1)}km`,
          });
        }
        
        // Stop watching after a few seconds (browser geo won't improve much)
        setTimeout(() => {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        }, 3000);
      },
      (error) => {
        setLoadingLocation(false);
        let errorMessage = "Unable to get your location.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      }
    );
    
    watchIdRef.current = watchId;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-background via-background to-primary-50/10 dark:to-primary-950/5">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Emergency Alert */}
        <Card className="border-2 border-red-500/50 bg-gradient-to-r from-red-500/10 to-red-600/5 backdrop-blur-sm shadow-lg shadow-red-500/10">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 shrink-0">
                <AlertCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-red-700 dark:text-red-400">
                  Emergency & Quick Access
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  For life-threatening emergencies, call <strong className="text-red-700 dark:text-red-400">911</strong> immediately
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Emergency Hotlines */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Emergency Hotlines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {emergencyContacts.map((contact) => (
              <Card
                key={contact.id}
                className="hover-elevate cursor-pointer backdrop-blur-sm bg-card/50 border-border/50 transition-all active-elevate-2"
                onClick={() => handleCall(contact.number)}
                data-testid={`card-emergency-${contact.id}`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${contact.color} shadow-md shrink-0`}>
                      <contact.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg">{contact.title}</CardTitle>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {contact.number}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {contact.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Hospital Search */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Nearby Hospitals</h2>
          
          <div className="mb-6 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Search by name, location, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  data-testid="input-search-hospitals"
                  className="pr-10 bg-background/50 border-border/50"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button 
                onClick={handleSearch} 
                className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-md"
                data-testid="button-search"
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            
            {/* GPS Location Button */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border/50"></div>
              <span className="text-sm text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border/50"></div>
            </div>
            
            <Button
              onClick={getUserLocation}
              disabled={loadingLocation}
              variant="outline"
              className="w-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-green-500/20"
              data-testid="button-find-nearby"
            >
              {loadingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Locate className="h-4 w-4 mr-2" />
                  Find Hospitals Near Me
                </>
              )}
            </Button>
            
            {userLocation && isActualLocation && (
              <div className="text-center space-y-1">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium" data-testid="text-user-location">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  Using your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </p>
                {locationAccuracy && (
                  <p className="text-xs text-muted-foreground">
                    {locationAccuracy < 100 
                      ? `High accuracy: ±${locationAccuracy.toFixed(0)}m`
                      : locationAccuracy < 1000
                      ? `Approximate location: ±${(locationAccuracy / 1000).toFixed(1)}km`
                      : `Approximate location (IP-based): ±${(locationAccuracy / 1000).toFixed(1)}km`
                    }
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Hospital Cards */}
          <div className="space-y-4">
            {hospitals.map((hospital) => (
              <Card key={hospital.id} className="hover-elevate backdrop-blur-sm bg-card/50 border-border/50">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{hospital.name}</CardTitle>
                        {hospital.isOpen24Hours && (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 border" data-testid={`badge-24h-${hospital.id}`}>
                            <Clock className="h-3 w-3 mr-1" />
                            24/7
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-start gap-2 text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="text-sm">{hospital.address}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Navigation className="h-4 w-4 text-primary" />
                          <span className="font-medium">{hospital.distance} miles away</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span className="font-medium">{hospital.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {hospital.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline" className="border-border/50 bg-muted/30">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => handleCall(hospital.phoneNumber)}
                      className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                      data-testid={`button-call-${hospital.id}`}
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      Call {hospital.phoneNumber}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setExpandedHospitalId(expandedHospitalId === hospital.id ? null : hospital.id);
                      }}
                      data-testid={`button-directions-${hospital.id}`}
                    >
                      <Navigation className="mr-2 h-4 w-4" />
                      {expandedHospitalId === hospital.id ? 'Hide Map' : 'Get Directions'}
                    </Button>
                  </div>
                  
                  {/* Collapsible Map Section */}
                  <div 
                    className="overflow-hidden transition-all duration-500 ease-in-out"
                    style={{
                      maxHeight: expandedHospitalId === hospital.id ? '500px' : '0px',
                      opacity: expandedHospitalId === hospital.id ? 1 : 0,
                    }}
                  >
                    <div className="pt-4 mt-4 border-t border-border/50">
                      <div className="rounded-lg overflow-hidden shadow-lg bg-muted/30 p-2">
                        <iframe
                          title={`Map to ${hospital.name}`}
                          width="100%"
                          height="400"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={
                            userLocation
                              ? `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${userLocation.lat},${userLocation.lng}&destination=${hospital.latitude},${hospital.longitude}&mode=driving`
                              : `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(hospital.address)}`
                          }
                        ></iframe>
                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const mapsUrl = userLocation
                                ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${hospital.latitude},${hospital.longitude}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.address)}`;
                              window.open(mapsUrl, "_blank");
                            }}
                            className="text-xs"
                          >
                            Open in Google Maps
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {hospitals.length === 0 && (
            <Card className="text-center py-16 px-6 backdrop-blur-sm bg-card/50 border-border/50 border-dashed">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/50">
                <MapPin className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No Hospitals Found</h3>
              <p className="text-muted-foreground mb-8">
                Try adjusting your search or clearing filters
              </p>
              <Button
                variant="outline"
                onClick={clearSearch}
                data-testid="button-clear-search"
              >
                Clear Search
              </Button>
            </Card>
          )}
        </div>

        {/* Disclaimer */}
        <Card className="backdrop-blur-sm bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Important:</strong> In case of a life-threatening emergency, always call 911 first. 
              The information provided here is for reference purposes and may not be up-to-date.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
