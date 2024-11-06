const axios = require('axios');
const { getSkyCondition } = require('./weatherController'); // skyCondition 가져오기

// 1/3, 2/3 지점의 좌표 계산 함수
function calculateIntermediatePoints(startCoords, endCoords) {
    const lat1 = startCoords.lat;
    const lon1 = startCoords.lon;
    const lat2 = endCoords.lat;
    const lon2 = endCoords.lon;

    // 1/3 지점
    const lat1_3 = lat1 + (lat2 - lat1) / 3;
    const lon1_3 = lon1 + (lon2 - lon1) / 3;

    // 2/3 지점
    const lat2_3 = lat1 + (lat2 - lat1) * 2 / 3;
    const lon2_3 = lon1 + (lon2 - lon1) * 2 / 3;

    return {
        firstPoint: { lat: lat1_3, lon: lon1_3 },
        secondPoint: { lat: lat2_3, lon: lon2_3 }
    };
}

// 휴게소 정보 요청
async function getRestAreas(coords) {
    const restAreaUrl = `https://api.example.com/restareas?lat=${coords.lat}&lon=${coords.lon}`;
    try {
        const response = await axios.get(restAreaUrl);
        return response.data;
    } catch (error) {
        console.error('휴게소 정보 요청 실패:', error.message);
        throw new Error('휴게소 정보 요청 실패');
    }
}

// 날씨 정보 요청 (기본 날씨)
async function getSimpleWeather(location) {
    const [latitude, longitude] = location.split(',');

    try {
        const weatherResponse = await axios.get(`https://api.weather.com/v3/wx/conditions/current?geocode=${latitude},${longitude}&language=ko-KR&format=json&apiKey=${process.env.KMA_API_KEY}`);
        const weatherData = weatherResponse.data;

        const airQualityResponse = await axios.get(`http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty`, {
            params: {
                stationName: 'YOUR_STATION_NAME',
                dataTerm: 'DAILY',
                pageNo: 1,
                numOfRows: 1,
                returnType: 'json',
                serviceKey: process.env.AIRKOREA_API_KEY
            }
        });
        const airQualityData = airQualityResponse.data.response.body.items[0];

        const skyCondition = getSkyCondition(weatherData.sky);

        const tips = [];
        if (weatherData.temperature >= 28) tips.push("날씨가 덥습니다. 썬크림을 챙기세요.");
        if (weatherData.precipitationProbability >= 30) tips.push("비가 올 가능성이 높습니다. 우산을 챙기세요.");
        if (airQualityData.khaiGrade >= 3) tips.push("대기질이 나쁩니다. 마스크를 착용하세요.");

        return {
            temperature: weatherData.temperature,
            precipitation_probability: weatherData.precipitationProbability,
            air_quality_level: airQualityData.khaiGrade,
            sky_condition: skyCondition,
            tips
        };
    } catch (error) {
        console.error('날씨 정보 요청 실패:', error.message);
        throw new Error('날씨 정보 요청 실패');
    }
}

// 경로 정보 처리하는 함수 (출발지, 목적지)
exports.getRouteInfo = async (req, res) => {
    const { start, end } = req.body;
    const startCoords = { lat: start.lat, lon: start.lon };
    const endCoords = { lat: end.lat, lon: end.lon };

    // 1/3, 2/3 지점 계산
    const { firstPoint, secondPoint } = calculateIntermediatePoints(startCoords, endCoords);

    try {
        // 각 지점에 대해 휴게소 정보 요청
        const restArea1 = await getRestAreas(firstPoint);
        const restArea2 = await getRestAreas(secondPoint);

        // 각 지점에 대한 날씨 정보 요청
        const weather1 = await getSimpleWeather(`${firstPoint.lat},${firstPoint.lon}`);
        const weather2 = await getSimpleWeather(`${secondPoint.lat},${secondPoint.lon}`);

        // 응답 데이터 반환
        res.status(200).json({
            restArea1,
            restArea2,
            weather1,
            weather2
        });
    } catch (error) {
        res.status(500).json({ message: '정보를 불러오는 데 실패했습니다.', error: error.message });
    }
};
