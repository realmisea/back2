const axios = require('axios');

// 기상청 API를 사용한 날씨 정보 가져오기
const getWeatherFromKMA = async (req, res) => {
    const { location } = req.params;
    try {
        const response = await axios.get(`https://api.kma.go.kr/data/forecast`, {
            params: {
                location: location
            },
            headers: {
                Authorization: `KMA_API_KEY` // 프론트엔드에서 처리
            }
        });

        const weatherData = response.data;
        res.json(weatherData);
    } catch (error) {
        console.error('Error fetching weather data from KMA:', error);
        res.status(500).send('Failed to fetch weather data');
    }
};

// 에어코리아 API를 사용한 공기질 정보 가져오기
const getAirQuality = async (req, res) => {
    const { location } = req.params;
    try {
        const response = await axios.get(`https://api.airkorea.or.kr`, {
            params: {
                location: location
            },
            headers: {
                Authorization: `AirKorea_API_KEY` // 프론트엔드에서 처리
            }
        });

        const airQualityData = response.data;
        res.json(airQualityData);
    } catch (error) {
        console.error('Error fetching air quality from AirKorea API:', error);
        res.status(500).send('Failed to fetch air quality data');
    }
};

module.exports = { getWeatherFromKMA, getAirQuality };