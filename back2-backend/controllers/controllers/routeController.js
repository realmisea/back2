const axios = require('axios');
const xml2js = require('xml2js');

// 1/3, 2/3 지점 계산 함수
const calculateIntermediatePoints = (start, end) => {
    const latitudeDiff = end.latitude - start.latitude;
    const longitudeDiff = end.longitude - start.longitude;

    return [
        {
            latitude: start.latitude + latitudeDiff / 3,
            longitude: start.longitude + longitudeDiff / 3
        },
        {
            latitude: start.latitude + (2 * latitudeDiff) / 3,
            longitude: start.longitude + (2 * longitudeDiff) / 3
        }
    ];
};

// 두 지점 간의 거리 계산 함수 (위도/경도로 계산)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // km
    return distance;
};

// 1/3, 2/3 지점에 가장 가까운 휴게소를 찾는 함수
const findClosestRestArea = (restAreas, point) => {
    let closestRestArea = null;
    let minDistance = Infinity;

    restAreas.forEach(restArea => {
        const distance = calculateDistance(
            point.latitude,
            point.longitude,
            parseFloat(restArea.yValue),
            parseFloat(restArea.xValue)
        );

        if (distance < minDistance) {
            closestRestArea = restArea;
            minDistance = distance;
        }
    });

    return closestRestArea;
};

// 시간대별로 여러 개의 데이터를 저장할 수 있도록 수정된 fetchWeatherData 함수
const fetchWeatherData = async (latitude, longitude) => {
    const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst';

    const getCurrentDateAndTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const time = hour >= '01' ? String(hour - 1).padStart(2, '0') + '30' : '2330';
        return { date: `${year}${month}${day}`, time };
    };

    const { date, time } = getCurrentDateAndTime();

    try {
        const response = await axios.get(url, {
            params: {
                serviceKey: process.env.KMA_API_KEY,
                numOfRows: 100,  // 충분한 데이터 수 설정
                pageNo: 1,
                base_date: date,
                base_time: time,
                nx: Math.round(latitude),
                ny: Math.round(longitude)
            }
        });

        const parser = new xml2js.Parser({ explicitArray: false });
        const parsedData = await parser.parseStringPromise(response.data);

        if (!parsedData.response.body || !parsedData.response.body.items || !parsedData.response.body.items.item) {
            throw new Error("기상청 API 응답에 items 데이터가 포함되지 않았습니다.");
        }

        const items = parsedData.response.body.items.item;

        // 시간대별로 온도, 하늘 상태, 강수 확률 그룹화
        const weather = {
            temperature: [],
            sky: [],
            precipitation: []
        };

        items.forEach(item => {
            const time = `${item.fcstTime}`;
            if (item.category === 'T1H') {  // 기온
                weather.temperature.push({ time, value: item.fcstValue });
            } else if (item.category === 'SKY') {  // 하늘 상태
                weather.sky.push({
                    time,
                    value: item.fcstValue,
                    baseDate: item.baseDate,
                    baseTime: item.baseTime,
                    category: item.category,
                    fcstDate: item.fcstDate,
                    fcstTime: item.fcstTime,
                    nx: item.nx,
                    ny: item.ny
                });
            } else if (item.category === 'PTY') {  // 강수
                weather.precipitation.push({ time, value: item.fcstValue });
            }
        });

        // 반환할 결과
        return weather;
    } catch (error) {
        console.error("날씨 정보 오류:", error.message);
        throw new Error("날씨 데이터를 가져오는 데 실패했습니다.");
    }
};


// 라우터 핸들러 함수
const getRouteInfo = async (req, res) => {
    const startPoint = req.body.startPoint;
    const endPoint = req.body.endPoint;

    const [point1, point2] = calculateIntermediatePoints(startPoint, endPoint);

    try {
        // 고속도로 휴게소 정보 조회
        const restAreaResponse1 = await axios.get('https://data.ex.co.kr/openapi/locationinfo/locationinfoRest', {
            params: {
                key: process.env.HIGHWAY_API_KEY,
                type: 'json',
                xValue: point1.longitude,
                yValue: point1.latitude
            }
        });

        const restAreaResponse2 = await axios.get('https://data.ex.co.kr/openapi/locationinfo/locationinfoRest', {
            params: {
                key: process.env.HIGHWAY_API_KEY,
                type: 'json',
                xValue: point2.longitude,
                yValue: point2.latitude
            }
        });

        // 각 중간 지점의 날씨 데이터 조회 (시간대별 5개 데이터)
        const weatherData1 = await fetchWeatherData(point1.latitude, point1.longitude);
        const weatherData2 = await fetchWeatherData(point2.latitude, point2.longitude);

        // 가장 가까운 휴게소만 추출 (unitName, xValue, yValue만)
        const closestRestArea1 = findClosestRestArea(restAreaResponse1.data.list, point1);
        const closestRestArea2 = findClosestRestArea(restAreaResponse2.data.list, point2);

        const simplifiedRestArea1 = {
            unitName: closestRestArea1.unitName,
            xValue: closestRestArea1.xValue,
            yValue: closestRestArea1.yValue
        };

        const simplifiedRestArea2 = {
            unitName: closestRestArea2.unitName,
            xValue: closestRestArea2.xValue,
            yValue: closestRestArea2.yValue
        };

        const routeInfo = {
            startPoint,
            endPoint,
            intermediatePoints: [
                { ...point1, restArea: simplifiedRestArea1, weather: weatherData1 },
                { ...point2, restArea: simplifiedRestArea2, weather: weatherData2 }
            ]
        };

        res.status(200).json(routeInfo);
    } catch (error) {
        console.error('Error fetching route info:', error.message);
        res.status(500).json({ message: '경로 정보를 불러오는 데 실패했습니다.', error: error.message });
    }
};

module.exports = { getRouteInfo };
