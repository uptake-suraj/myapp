import React, { useEffect, useRef, useState } from "react";
import { Button, Typography, Container } from "@mui/material";
import Map from "ola-maps-react";
import axios from "axios";

const MapComponent = () => {
  const mapRef = useRef(null);
  const [tracking, setTracking] = useState(false);
  const [startLocation, setStartLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);

  useEffect(() => {
    // Initialize the map
    const olaMap = new Map({
      container: mapRef.current,
      apiKey: "LgPQl7WnCDP3ppmbfprUHpXgROOR0q6Wb76reivs",
    });

    olaMap.on("load", () => {
      console.log("Ola Map loaded");
      // Removed NavigationControl as it's not available
    });

    return () => {
      olaMap.remove(); // Cleanup the map instance
    };
  }, []);

  const startTracking = () => {
    setTracking(true);
    setTotalDistance(0);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude } = coords;
        setStartLocation({ lat: latitude, lng: longitude });
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => console.error("Error fetching geolocation:", error)
    );
  };

  const stopTracking = () => {
    setTracking(false);
  };

  const fetchDistanceMatrix = async () => {
    if (startLocation && currentLocation) {
      const origins = `${startLocation.lat},${startLocation.lng}`;
      const destinations = `${currentLocation.lat},${currentLocation.lng}`;

      try {
        const response = await axios.get(
          `https://api.ola.maps/routing/v1/distanceMatrix/basic?origins=${origins}&destinations=${destinations}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.REACT_APP_OLA_MAPS_API_KEY}`,
            },
          }
        );
        const { rows } = response.data;
        if (rows && rows.length > 0) {
          const distances = rows[0].elements.map((element) => element.distance);
          console.log("Distance data: ", distances);
          setTotalDistance(distances[0] / 1000); // Distance in kilometers
        }
      } catch (error) {
        console.error("Error fetching distance matrix: ", error);
      }
    }
  };

  useEffect(() => {
    let watchId;
    if (tracking) {
      watchId = navigator.geolocation.watchPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => console.error("Error watching position:", error)
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [tracking]);

  return (
    <Container>
      <Typography variant="h4">Ola Maps Tracker</Typography>
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
      <Button
        variant="contained"
        onClick={fetchDistanceMatrix}
        disabled={!startLocation || !currentLocation}
      >
        Fetch Distance
      </Button>
      <div
        ref={mapRef}
        style={{ width: "100%", height: "500px", marginTop: "20px" }}
      ></div>
      <Typography variant="h6" style={{ marginTop: "20px" }}>
        Total Distance: {totalDistance.toFixed(2)} km
      </Typography>
    </Container>
  );
};

export default MapComponent;
