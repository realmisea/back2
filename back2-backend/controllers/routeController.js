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
const getRestAreas = async (point, retries = 3) => {
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
        // 중복 방지: 이전에 선택된 휴게소는 제외
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
