const axios = require('axios');

// 간단한 날씨 정보 제공 함수
const getSimpleWeather = async (req, res) => {
    const location = req.params.location;
    const [latitude, longitude] = location.split(',');

    try {
        // 1. 기상청 API 호출 (기온, 강수 확률 등)
        const weatherResponse = await axios.get(`https://api.weather.com/v3/wx/conditions/current?geocode=${latitude},${longitude}&language=ko-KR&format=json&apiKey=YOUR_KMA_API_KEY`);
        const weatherData = weatherResponse.data;

        // 2. 에어코리아 API 호출 (대기질 정보)
        const airQualityResponse = await axios.get(`http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?stationName=YOUR_STATION_NAME&dataTerm=DAILY&pageNo=1&numOfRows=1&serviceKey=YOUR_AIRKOREA_API_KEY&returnType=json`);
        const airQualityData = airQualityResponse.data.response.body.items[0];

        // 간단한 날씨 정보 구성
        const simpleWeatherDetails = {
            location: location,
            temperature: weatherData.temperature,    // 현재 기온
            precipitation_probability: weatherData.precipitationProbability, // 강수 확률
            air_quality_level: airQualityData.khaiGrade // 통합 대기 수준
        };

        res.status(200).json(simpleWeatherDetails);

    } catch (error) {
        res.status(500).json({ message: '상세 날씨 정보를 불러오는 데 실패했습니다.', error: error.message });
    }
};

// 상세 날씨 정보 제공 함수 (시간대별 정보)
const getDetailedWeather = async (req, res) => {
    const location = req.params.location;
    const [latitude, longitude] = location.split(',');

    try {
        // 1. 기상청 API 시간대별 호출 (시간대별 기온, 강수량)
        const hourlyWeatherResponse = await axios.get(`https://api.weather.com/v3/wx/forecast/hourly?geocode=${latitude},${longitude}&format=json&apiKey=YOUR_KMA_API_KEY`);
        const hourlyWeatherData = hourlyWeatherResponse.data;

        // 2. 에어코리아 API 호출 (시간대별 대기질 정보는 없으므로 통합 대기 수준 유지)
        const airQualityResponse = await axios.get(`http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?stationName=YOUR_STATION_NAME&dataTerm=DAILY&pageNo=1&numOfRows=1&serviceKey=YOUR_AIRKOREA_API_KEY&returnType=json`);
        const airQualityData = airQualityResponse.data.response.body.items[0];

        // 상세 날씨 정보 구성 (시간대별)
        const detailedWeather = {
            location: location,
            hourly: hourlyWeatherData.hourlyTemperature.map((temp, index) => ({
                time: hourlyWeatherData.hourlyTime[index],
                temperature: temp,
                precipitation: hourlyWeatherData.hourlyPrecipitation[index],
                air_quality_level: airQualityData.khaiGrade // 통합 대기 수준
            }))
        };

        res.status(200).json(detailedWeather);

    } catch (error) {
        res.status(500).json({ message: '상세 날씨 정보를 불러오는 데 실패했습니다.', error: error.message });
    }
};

module.exports = { getSimpleWeather, getDetailedWeather };
