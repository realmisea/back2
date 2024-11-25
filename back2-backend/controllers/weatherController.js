const axios = require('axios');

// 경유지 계산 (1/3, 2/3 지점)
function calculateIntermediatePoints(start, end) {
    const lat1 = start.latitude;
    const lon1 = start.longitude;
    const lat2 = end.latitude;
    const lon2 = end.longitude;

    // 1/3, 2/3 지점 계산
    const lat1_3 = lat1 + (lat2 - lat1) * 1 / 3;
    const lon1_3 = lon1 + (lon2 - lon1) * 1 / 3;

    const lat2_3 = lat1 + (lat2 - lat1) * 2 / 3;
    const lon2_3 = lon1 + (lon2 - lon1) * 2 / 3;

    return {
        firstPoint: { lat: lat1_3, lon: lon1_3 },
        secondPoint: { lat: lat2_3, lon: lon2_3 }
    };
}

// 날씨 정보 요청 함수
async function getWeatherForPoint(location) {
    const { lat, lon } = location;
    try {
        const weatherResponse = await axios.get('https://apis.data.go.kr/1360000/VilageFcstInfoService/getVilageFcst', {
            params: {
                serviceKey: process.env.KMA_API_KEY,
                pageNo: 1,
                numOfRows: 10,
                dataType: 'JSON',
                base_date: new Date().toISOString().slice(0, 10), // 오늘 날짜
                base_time: '0600', // 기준 시간
                nx: Math.round(lon), // X 좌표
                ny: Math.round(lat), // Y 좌표
            }
        });

        // 날씨 데이터 추출
        const weatherData = weatherResponse.data.response.body.items.item;
        const hourlyWeather = weatherData.map(item => ({
            time: item.fcstTime,
            temperature: item.temp,
            precipitationProbability: item.pop,
            skyCondition: item.sky,
        }));

        return hourlyWeather;
    } catch (error) {
        console.error('날씨 정보 요청 실패:', error.message);
        throw new Error('날씨 정보 요청 실패');
    }
}

// 경로 정보와 날씨 정보 함께 반환하는 함수
exports.getRouteWithWeather = async (req, res) => {
    const { startPoint, endPoint } = req.body;

    // 경로의 1/3, 2/3 지점 계산
    const { firstPoint, secondPoint } = calculateIntermediatePoints(startPoint, endPoint);

    try {
        // 각 지점에 대한 날씨 정보 요청
        const weather1 = await getWeatherForPoint(firstPoint);
        const weather2 = await getWeatherForPoint(secondPoint);

        res.status(200).json({
            firstPointWeather: weather1,
            secondPointWeather: weather2
        });
    } catch (error) {
        res.status(500).json({ message: '날씨 정보 요청 실패', error: error.message });
    }
};
