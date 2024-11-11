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

// 날씨 데이터 요청 함수
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
                numOfRows: 100,
                pageNo: 1,
                base_date: date,
                base_time: time,
                nx: Math.round(latitude),
                ny: Math.round(longitude)
            }
        });

        const parser = new xml2js.Parser({ explicitArray: false });
        const parsedData = await parser.parseStringPromise(response.data);

        if (!parsedData.response || !parsedData.response.body || !parsedData.response.body.items || !parsedData.response.body.items.item) {
            throw new Error("기상청 API 응답에 items 데이터가 포함되지 않았습니다.");
        }

        const items = parsedData.response.body.items.item;

        const weather = {
            temperature: [],
            sky: [],
            precipitation: []
        };

        items.forEach(item => {
            const time = item.fcstTime;
            if (item.category === 'T1H') {  // 기온
                weather.temperature.push({ time, value: item.fcstValue });
            } else if (item.category === 'SKY') {  // 하늘 상태
                weather.sky.push({
                    time,
                    value: item.fcstValue
                });
            } else if (item.category === 'PTY') {  // 강수
                weather.precipitation.push({ time, value: item.fcstValue });
            }
        });

        return weather;
    } catch (error) {
        console.error("날씨 정보 오류:", error.message);
        throw new Error("날씨 데이터를 가져오는 데 실패했습니다.");
    }
};

// getRestAreas 함수에서 각 페이지 응답 상태 확인
const getRestAreas = async (point, retries = 3) => {
    let restAreaResponse = null;
    for (let page = 1; page <= retries; page++) {
        try {
            restAreaResponse = await axios.get('https://data.ex.co.kr/openapi/locationinfo/locationinfoRest', {
                params: {
                    key: process.env.HIGHWAY_API_KEY,  // 실제 API 키를 사용하세요
                    type: 'json',
                    numOfRows: 99,
                    pageNo: page
                }
            });
            
            // API 응답 내용 로깅 추가
            console.log(`페이지 ${page} 응답:`, restAreaResponse.data);
            
            if (restAreaResponse.data.list && restAreaResponse.data.list.length > 0) {
                return restAreaResponse.data.list;
            } else {
                console.log(`페이지 ${page}에서 휴게소 데이터 없음`);
            }
        } catch (error) {
            console.error(`페이지 ${page} 요청 실패:`, error.message);
        }
    }
    return [];
};

// 경로 정보 요청 함수
const getRouteInfo = async (req, res) => {
    const startPoint = req.body.startPoint;
    const endPoint = req.body.endPoint;

    const [point1, point2] = calculateIntermediatePoints(startPoint, endPoint);

    try {
        const restAreaList1 = await getRestAreas(point1);
        const restAreaList2 = await getRestAreas(point2);

        if (restAreaList1.length === 0 || restAreaList2.length === 0) {
            throw new Error("휴게소 데이터를 찾을 수 없습니다.");
        }

        const closestRestArea1 = findClosestRestArea(restAreaList1, point1);
        const closestRestArea2 = findClosestRestArea(restAreaList2, point2);

        if (!closestRestArea1 || !closestRestArea2) {
            throw new Error("가장 가까운 휴게소를 찾을 수 없습니다.");
        }

        // 각 휴게소의 위치와 날씨 데이터를 리스트에 포함
        const intermediatePoints = [
            {
                ...point1,
                restArea: {
                    unitName: closestRestArea1.unitName,
                    xValue: closestRestArea1.xValue,
                    yValue: closestRestArea1.yValue
                },
                weather: await fetchWeatherData(parseFloat(closestRestArea1.yValue), parseFloat(closestRestArea1.xValue))
            },
            {
                ...point2,
                restArea: {
                    unitName: closestRestArea2.unitName,
                    xValue: closestRestArea2.xValue,
                    yValue: closestRestArea2.yValue
                },
                weather: await fetchWeatherData(parseFloat(closestRestArea2.yValue), parseFloat(closestRestArea2.xValue))
            }
        ];

        const routeInfo = {
            startPoint,
            endPoint,
            intermediatePoints
        };

        res.status(200).json(routeInfo);
    } catch (error) {
        console.error('Error fetching route info:', error.message);
        res.status(500).json({ message: '경로 정보를 불러오는 데 실패했습니다.', error: error.message });
    }
};

module.exports = { getRouteInfo };
