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

// 카카오 길찾기 API 요청 함수
const fetchDrivingRoute = async (start, end) => {
    try {
        const response = await axios.get('https://apis-navi.kakaomobility.com/v1/directions', {
            params: {
                origin: `${start.longitude},${start.latitude}`, // 출발지 좌표
                destination: `${end.longitude},${end.latitude}`, // 도착지 좌표
                waypoints: '', // 경유지 좌표(없으면 빈 문자열)
                priority: 'RECOMMEND' // 추천 경로 (자동차 경로를 고려)
            },
            headers: {
                Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` // 카카오 API 키
            }
        });

        // 카카오 길찾기 API 응답 확인
        console.log('카카오 길찾기 API 응답:', response.data);

        // 경로가 존재하는지 확인
        const routes = response.data.routes;
        if (!routes || routes.length === 0) {
            throw new Error("경로 정보를 찾을 수 없습니다.");
        }

        const route = routes[0];
        const sections = route.sections;

        // sections가 존재하지 않으면 오류 처리
        if (!sections || sections.length === 0) {
            throw new Error("경로의 섹션 정보를 찾을 수 없습니다.");
        }

        return route; // sections를 사용해 경로를 나누어 추가적인 처리 가능
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
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // 거리(km)
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

// 경로 정보 요청 처리 함수
const getRouteInfoWithKakao = async (req, res) => {
    const { startPoint, endPoint } = req.body;

    if (!startPoint || !endPoint || !startPoint.latitude || !startPoint.longitude || !endPoint.latitude || !endPoint.longitude) {
        return res.status(400).json({ message: 'startPoint와 endPoint가 정확히 전달되지 않았습니다.' });
    }

    try {
        // 카카오 길찾기 API 경로 가져오기
        const drivingRoute = await fetchDrivingRoute(startPoint, endPoint);

        // sections 정보 확인
        const sections = drivingRoute.sections;
        console.log('경로 sections:', sections); // 디버깅용 로그 추가

        // 1/3, 2/3 지점 계산
        const [point1, point2] = calculateIntermediatePoints(startPoint, endPoint);

        // 휴게소 데이터 가져오기
        const restAreas = await getRestAreas();

        // 두 지점에 가장 가까운 휴게소 찾기 (중복 방지)
        const closestRestArea1 = findClosestRestArea(restAreas, point1);
        const closestRestArea2 = findClosestRestArea(restAreas, point2, closestRestArea1);

        // 응답 데이터 구성
        const routeInfo = {
            startPoint,
            endPoint,
           // drivingRoute, // 카카오 길찾기 API에서 반환된 도로 경로
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
                    }
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
                    }
                }
            ]
        };

        res.status(200).json(routeInfo);
    } catch (error) {
        console.error('경로 정보 요청 실패:', error.message);
        res.status(500).json({ message: '경로 정보를 가져오는 데 실패했습니다.', error: error.message });
    }
};

module.exports = { getRouteInfoWithKakao };