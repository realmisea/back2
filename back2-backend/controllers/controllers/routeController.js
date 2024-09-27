const axios = require('axios');

// KakaoMap API를 사용한 경로 계산 함수
const getRoute = async (req, res) => {
    const { start, end } = req.body;
    try {
        const response = await axios.get('https://apis.map.kakao.com/v1/directions', {
            params: {
                origin: start,
                destination: end
            },
            headers: {
                Authorization: `KakaoAK YOUR_KAKAOMAP_API_KEY` // 프론트엔드에서 처리
            }
        });

        const route = response.data.routes[0];  // 첫 번째 경로
        res.json({
            distance: route.distance,
            duration: route.duration,
            waypoints: route.waypoints
        });
    } catch (error) {
        console.error('Error fetching route from KakaoMap API:', error);
        res.status(500).send('Failed to fetch route data');
    }
};

// 한국도로공사 API를 사용한 휴게소 정보 가져오기
const getRestStops = async (req, res) => {
    const { highwayCode } = req.params;  // 프론트엔드에서 고속도로 코드를 보낸다고 가정
    try {
        const response = await axios.get(`https://api.road.or.kr/rest-areas?highway=${highwayCode}`, {
            headers: {
                Authorization: `Bearer YOUR_HIGHWAY_API_KEY` // 안지유가 처리
            }
        });
        const restStops = response.data.rest_areas;
        res.json(restStops);
    } catch (error) {
        console.error('Error fetching rest stops from Road API:', error);
        res.status(500).send('Failed to fetch rest stop data');
    }
};

module.exports = { getRoute, getRestStops };