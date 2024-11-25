const axios = require('axios');
const xml2js = require('xml2js');

// Kakao 지도 URL 생성 함수
const generateMapUrl = (latitude, longitude, name = '') => {
    return name
        ? `https://map.kakao.com/link/map/${encodeURIComponent(name)},${latitude},${longitude}`
        : `https://map.kakao.com/link/map/${latitude},${longitude}`;
};

const generateDirectionsUrl = (latitude, longitude, name = '') => {
    return name
        ? `https://map.kakao.com/link/to/${encodeURIComponent(name)},${latitude},${longitude}`
        : `https://map.kakao.com/link/to/${latitude},${longitude}`;
};

const generateIntermediatePointMapUrl = (latitude, longitude) => {
    return `https://map.kakao.com/link/map/IntermediatePoint,${latitude},${longitude}`;
};

// 카카오 길찾기 API 요청 함수
const fetchDrivingRoute = async (start, end) => {
    try {
        const response = await axios.get('https://apis-navi.kakaomobility.com/v1/directions', {
            params: {
                origin: `${start.longitude},${start.latitude}`,
                destination: `${end.longitude},${end.latitude}`,
                waypoints: '',
                priority: 'RECOMMEND'
            },
            headers: {
                Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`
            }
        });

        const routes = response.data.routes;
        if (!routes || routes.length === 0) {
            throw new Error('경로 정보를 찾을 수 없습니다.');
        }

        return routes[0];
    } catch (error) {
        console.error('카카오 길찾기 API 요청 오류:', error.message);
        throw new Error('카카오 길찾기 API 호출에 실패했습니다.');
    }
};

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

// 두 지점 간의 거리 계산 함수
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// 휴게소 데이터 가져오기
const getRestAreas = async (retries = 3) => {
    let restAreas = [];
    for (let page = 1; page <= retries; page++) {
        try {
            const response = await axios.get('https://data.ex.co.kr/openapi/locationinfo/locationinfoRest', {
                params: {
                    key: process.env.HIGHWAY_API_KEY,
                    type: 'json',
                    numOfRows: 99,
                    pageNo: page
                }
            });

            if (response.data.list && response.data.list.length > 0) {
                restAreas = restAreas.concat(response.data.list);
            }
        } catch (error) {
            console.error(`페이지 ${page} 요청 실패:`, error.message);
        }
    }

    return restAreas;
};

// 가장 가까운 휴게소 찾기
const findClosestRestArea = (restAreas, point, exclude = null) => {
    let closestRestArea = null;
    let minDistance = Infinity;

    restAreas.forEach(restArea => {
        if (exclude && restArea.unitName === exclude.unitName) {
            return;
        }

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

// 날씨 정보 가져오기
const fetchWeatherData = async (latitude, longitude) => {
    try {
        const response = await axios.get('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst', {
            params: {
                serviceKey: process.env.KMA_API_KEY,
                pageNo: 1,
                numOfRows: 100,
                dataType: 'JSON',
                base_date: getBaseDate(), // 기준 날짜
                base_time: getBaseTime(), // 기준 시간
                nx: Math.round(longitude), // X 좌표 (정수값)
                ny: Math.round(latitude)  // Y 좌표 (정수값)
            }
        });

        const weatherData = response.data.response.body.items.item;

        // 필요한 카테고리만 필터링
        const filteredData = weatherData.filter(item =>
            ['T1H', 'RN1', 'SKY'].includes(item.category)
        );

        // 카테고리별로 정리된 데이터를 반환
        const formattedData = {};
        filteredData.forEach(item => {
            formattedData[item.category] = {
                baseDate: item.baseDate,
                baseTime: item.baseTime,
                fcstDate: item.fcstDate,
                fcstTime: item.fcstTime,
                value: item.fcstValue,
                nx: item.nx,
                ny: item.ny
            };
        });

        return formattedData;
    } catch (error) {
        console.error('날씨 데이터 요청 실패:', error.response ? error.response.data : error.message);
        return null;
    }
};

// 날짜와 시간 계산 함수
const getBaseDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - 30); // 데이터 갱신 기준
    return now.toISOString().slice(0, 10).replace(/-/g, '');
};

const getBaseTime = () => {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // 30분 단위로 기준 시간 설정
    if (minutes < 30) {
        return String(hour - 1).padStart(2, '0') + '30';
    }
    return String(hour).padStart(2, '0') + '30';
};

// 경로 정보 요청 처리 함수
const getRouteInfoWithKakao = async (req, res) => {
    const { startPoint, endPoint } = req.body;

    if (!startPoint || !endPoint || !startPoint.latitude || !startPoint.longitude || !endPoint.latitude || !endPoint.longitude) {
        return res.status(400).json({ message: 'startPoint와 endPoint가 정확히 전달되지 않았습니다.' });
    }

    try {
        // 카카오 길찾기 API 경로 가져오기
        const drivingRoute = await fetchDrivingRoute(startPoint, endPoint);

        // 1/3, 2/3 지점 계산
        const [point1, point2] = calculateIntermediatePoints(startPoint, endPoint);

        // 휴게소 데이터 가져오기
        const restAreas = await getRestAreas();

        // 두 지점에 가장 가까운 휴게소 찾기 (중복 방지)
        const closestRestArea1 = findClosestRestArea(restAreas, point1);
        const closestRestArea2 = findClosestRestArea(restAreas, point2, closestRestArea1);

        // 각 지점에 대한 날씨 정보 가져오기
        const weather1 = await fetchWeatherData(point1.latitude, point1.longitude);
        const weather2 = await fetchWeatherData(point2.latitude, point2.longitude);
        const destinationWeather = await fetchWeatherData(endPoint.latitude, endPoint.longitude);

        // 응답 데이터 구성
        const routeInfo = {
            startPoint,
            endPoint,
            intermediatePoints: [
                {
                    ...point1,
                    restArea: {
                        name: closestRestArea1.unitName,
                        coordinates: {
                            latitude: closestRestArea1.yValue,
                            longitude: closestRestArea1.xValue
                        },
                        mapUrl: generateMapUrl(closestRestArea1.yValue, closestRestArea1.xValue, closestRestArea1.unitName)
                    },
                    weather: weather1,
                    intermediatePointMapUrl: generateIntermediatePointMapUrl(closestRestArea1.yValue, closestRestArea1.xValue)  // 1/3 지점
                },
                {
                    ...point2,
                    restArea: {
                        name: closestRestArea2.unitName,
                        coordinates: {
                            latitude: closestRestArea2.yValue,
                            longitude: closestRestArea2.xValue
                        },
                        mapUrl: generateMapUrl(closestRestArea2.yValue, closestRestArea2.xValue, closestRestArea2.unitName)
                    },
                    weather: weather2,
                    intermediatePointMapUrl: generateIntermediatePointMapUrl(closestRestArea2.yValue, closestRestArea2.xValue)  // 2/3 지점
                }
            ],
            destinationWeather,
            mapUrl: generateMapUrl(endPoint.latitude, endPoint.longitude)
        };

        return res.status(200).json(routeInfo);
    } catch (error) {
        console.error('경로 정보 요청 처리 중 오류:', error.message);
        return res.status(500).json({ message: error.message });
    }
};


module.exports = {
    getRouteInfoWithKakao
};
