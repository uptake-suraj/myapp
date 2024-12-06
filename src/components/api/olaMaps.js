const BASE_URL = "https://api.olamaps.io";

export const getRoute = async (origin, destination) => {
    const apiKey = process.env.REACT_APP_OLA_MAPS_API_KEY;

    try {
        const response = await fetch(
            `https://api.olamaps.io/routing/v1/directions/basic?origin=${origin}&destination=${destination}&api_key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Request-Id": "your-request-id",
                },
            }
        );

        if (!response.ok) {
            console.error("Response Status:", response.status, response.statusText);
            const errorText = await response.text();
            throw new Error(`API Error: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching route data:", error.message);
        throw error;
    }
};
