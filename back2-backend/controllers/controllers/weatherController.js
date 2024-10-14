const axios = require('axios');

// 하늘 상태 변환 함수 (아이콘 상태 전달을 위한 간단한 함수)
const getSkyCondition = (skyCode) => {
    if (skyCode === 1 || skyCode === 2) {
        return 'clear'; // 맑음 또는 구름조금
    } else if (skyCode === 3) {
        return 'mostly_cloudy'; // 구름많음
    } else if (skyCode === 4) {
        return 'cloudy'; // 흐림
    } else {
        return 'unknown'; // 알 수 없는 상태
    }
};

// 간단한 날씨 정보 제공 함수
const getSimpleWeather = async (req, res) => {
    const location = req.params.location;
    const [latitude, longitude] = location.split(',');

    try {
        // 기상청 API 호출 (기온, 강수 확률, 하늘 상태 등)
        const weatherResponse = await axios.get(`https://api.weather.com/v3/wx/conditions/current?geocode=${latitude},${longitude}&language=ko-KR&format=json&apiKey=${process.env.KMA_API_KEY}`);
        const weatherData = weatherResponse.data;

        // 에어코리아 API 호출 (대기질 정보)
        const airQualityResponse = await axios.get(`http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?stationName=YOUR_STATION_NAME&dataTerm=DAILY&pageNo=1&numOfRows=1&serviceKey=${process.env.AIRKOREA_API_KEY}&returnType=json`);
        const airQualityData = airQualityResponse.data.response.body.items[0];

        // 하늘 상태 코드 처리 (1: 맑음, 3: 구름많음, 4: 흐림)
        const skyCondition = getSkyCondition(weatherData.sky);

        // 팁 제공 로직
        const tips = [];
        if (weatherData.temperature >= 28) tips.push("날씨가 덥습니다. 썬크림을 챙기세요.");
        if (weatherData.precipitationProbability >= 30) tips.push("비가 올 가능성이 높습니다. 우산을 챙기세요.");
        if (airQualityData.khaiGrade >= 3) tips.push("대기질이 나쁩니다. 마스크를 착용하세요.");

        // 간단한 날씨 정보 구성
        const simpleWeatherDetails = {
            location: location,
            temperature: weatherData.temperature, // 현재 기온
            precipitation_probability: weatherData.precipitationProbability, // 강수 확률
            air_quality_level: airQualityData.khaiGrade, // 통합 대기 수준
            sky_condition: skyCondition, // 하늘 상태
            tips // 조건에 따른 팁
        };

        res.status(200).json(simpleWeatherDetails);

    } catch (error) {
        res.status(500).json({ message: '날씨 정보를 불러오는 데 실패했습니다.', error: error.message });
    }
};

// 상세 날씨 정보 제공 함수 (시간대별 정보)
const getDetailedWeather = async (req, res) => {
    const location = req.params.location;
    const [latitude, longitude] = location.split(',');

    try {
        // 기상청 API 시간대별 호출 (시간대별 기온, 강수량, 하늘 상태)
        const hourlyWeatherResponse = await axios.get(`https://api.weather.com/v3/wx/forecast/hourly?geocode=${latitude},${longitude}&format=json&apiKey=${process.env.KMA_API_KEY}`);
        const hourlyWeatherData = hourlyWeatherResponse.data;

        // 에어코리아 API 호출 (대기질 정보)
        const airQualityResponse = await axios.get(`http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?stationName=YOUR_STATION_NAME&dataTerm=DAILY&pageNo=1&numOfRows=1&serviceKey=${process.env.AIRKOREA_API_KEY}&returnType=json`);
        const airQualityData = airQualityResponse.data.response.body.items[0];

        // 시간대별 상세 날씨 정보 구성 (기온, 강수량, 하늘 상태, 대기질)
        const detailedWeather = {
            location: location,
            hourly: hourlyWeatherData.hourlyTemperature.map((temp, index) => ({
                time: hourlyWeatherData.hourlyTime[index],
                temperature: temp,
                precipitation: hourlyWeatherData.hourlyPrecipitation[index],
                sky_condition: getSkyCondition(hourlyWeatherData.hourlySky[index]), // 시간대별 하늘 상태
                air_quality_level: airQualityData.khaiGrade // 통합 대기 수준
            }))
        };

        res.status(200).json(detailedWeather);

    } catch (error) {
        console.error('Error:', error.message); // 오류 메시지를 콘솔에 출력
        res.status(500).json({ message: '상세 날씨 정보를 불러오는 데 실패했습니다.', error: error.message });
    }
};

module.exports = { getSimpleWeather, getDetailedWeather };
