import React, { useEffect, useState } from "react";
import { Map, Marker } from "ola-maps-react";
import {
  Button,
  Typography,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import axios from "axios";

const MapComponent = () => {
  const [tracking, setTracking] = useState(false);
  const [locationPermissionOpen, setLocationPermissionOpen] = useState(false);
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const [markers, setMarkers] = useState([]);
  const [locationHistory, setLocationHistory] = useState([]);

  // Request location permission on component mount
  useEffect(() => {
    // Check if geolocation is supported
    if ("geolocation" in navigator) {
      setLocationPermissionOpen(true);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  // Handle location permission
  const handleLocationPermission = (allowed) => {
    setLocationPermissionOpen(false);

    if (allowed) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const initialLocation = {
            lat: coords.latitude,
            lng: coords.longitude,
          };
          setCurrentLocation(initialLocation);
        },
        (error) => {
          console.error("Error getting initial location:", error);
          alert("Could not retrieve your location. Please try again.");
        }
      );
    }
  };

  // Calculate distance using Distance Matrix Basic API
  const calculateTotalDistance = async () => {
    if (locationHistory.length < 2) {
      alert("Not enough locations to calculate distance");
      return;
    }

    try {
      // Prepare origins and destinations
      const origins = locationHistory
        .map((loc) => `${loc.lat},${loc.lng}`)
        .join("|");
      const destinations = locationHistory
        .map((loc) => `${loc.lat},${loc.lng}`)
        .join("|");

      const response = await axios.post(
        "https://api.olamaps.io/routing/v1/distanceMatrix/basic",
        {
          origins: origins,
          destinations: destinations,
          api_key: process.env.REACT_APP_OLA_MAPS_API_KEY,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": `tracking_${Date.now()}`, // Unique request ID
          },
        }
      );

      // Calculate total distance
      let totalKm = 0;
      const rows = response.data.rows;

      rows.forEach((row, rowIndex) => {
        row.elements.forEach((element, colIndex) => {
          // Avoid calculating distance to same point
          if (rowIndex !== colIndex) {
            totalKm += element.distance / 1000; // Convert meters to kilometers
          }
        });
      });

      setTotalDistance(totalKm);
    } catch (error) {
      console.error("Distance calculation error:", error);
      alert("Failed to calculate distance. Please try again.");
    }
  };

  // Start tracking locations
  const startTracking = () => {
    setTracking(true);
    setTotalDistance(0);
    setLocationHistory([]);
    setMarkers([]);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const startLocation = {
          lat: coords.latitude,
          lng: coords.longitude,
          timestamp: new Date().toISOString(),
        };

        setStartLocation(startLocation);
        setCurrentLocation(startLocation);
        setLocationHistory([startLocation]);
        setMarkers([{ position: startLocation }]);
      },
      (error) => console.error("Tracking start error:", error)
    );
  };

  // Stop tracking and calculate total distance
  const stopTracking = () => {
    setTracking(false);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const endLocation = {
          lat: coords.latitude,
          lng: coords.longitude,
          timestamp: new Date().toISOString(),
        };

        setEndLocation(endLocation);

        // Add end location to history and markers
        const updatedHistory = [...locationHistory, endLocation];
        setLocationHistory(updatedHistory);
        setMarkers((prev) => [...prev, { position: endLocation }]);

        // Calculate total distance
        calculateTotalDistance();
      },
      (error) => console.error("Tracking stop error:", error)
    );
  };

  return (
    <Container>
      {/* Location Permission Dialog */}
      <Dialog
        open={locationPermissionOpen}
        onClose={() => handleLocationPermission(false)}
      >
        <DialogTitle>Enable Location</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Allow this app to access your location to track your travel
            distance?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => handleLocationPermission(false)}
            color="primary"
          >
            Decline
          </Button>
          <Button
            onClick={() => handleLocationPermission(true)}
            color="primary"
            autoFocus
          >
            Allow
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h4">Ola Maps Tracker</Typography>

      <div style={{ width: "100%", height: "500px", marginTop: "20px" }}>
        <Map
          zoom={15}
          center={currentLocation || { lat: 28.7041, lng: 77.1025 }}
          apiKey={process.env.REACT_APP_OLA_MAPS_API_KEY}
        >
          {markers.map((marker, index) => (
            <Marker
              key={index}
              position={marker.position}
              title={index === 0 ? "Start" : "End"}
            />
          ))}
        </Map>
      </div>

      <div style={{ marginTop: "20px" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={startTracking}
          disabled={tracking}
          style={{ margin: "10px" }}
        >
          Start Tracking
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={stopTracking}
          disabled={!tracking}
          style={{ margin: "10px" }}
        >
          Stop Tracking
        </Button>

        <Typography variant="h6">
          Total Distance: {totalDistance.toFixed(2)} km
        </Typography>

        {/* Location History (Optional) */}
        <div style={{ marginTop: "20px" }}>
          <Typography variant="subtitle1">Location History:</Typography>
          {locationHistory.map((location, index) => (
            <Typography key={index} variant="body2">
              Location {index + 1}: Lat {location.lat.toFixed(4)}, Lng{" "}
              {location.lng.toFixed(4)}
              {location.timestamp &&
                ` - ${new Date(location.timestamp).toLocaleString()}`}
            </Typography>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default MapComponent;
