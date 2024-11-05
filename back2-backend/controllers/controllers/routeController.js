const axios = require('axios');

// 기상청 API로 날씨 정보를 요청하는 함수
async function fetchWeather(nx, ny) {
    const baseDate = getBaseDate(); // 현재 날짜를 가져오는 함수
    const baseTime = getBaseTime(); // 현재 시간을 가져오는 함수

    try {
        const response = await axios.get(`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`, {
            params: {
                serviceKey: process.env.KMA_API_KEY, // 환경변수에서 API 키 가져오기
                baseDate: baseDate,
                baseTime: baseTime,
                nx: nx,
                ny: ny,
                dataType: 'XML'
            }
        });

        // 응답 데이터에서 필요한 정보 파싱
        const weatherData = parseWeatherData(response.data);
        return weatherData; // 파싱된 날씨 데이터 반환
    } catch (error) {
        console.error('기상청 API 요청 오류:', error);
        return []; // 오류 발생 시 빈 배열 반환
    }
}

// 날짜를 동적으로 설정하는 함수
function getBaseDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
    const date = String(today.getDate()).padStart(2, '0');
    return `${year}${month}${date}`; // YYYYMMDD 형식 반환
}

// 시간을 동적으로 설정하는 함수
function getBaseTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    // 현재 시간을 기준으로 API에서 요구하는 baseTime 결정
    if (hours === '00' && minutes < '40') {
        return '2300'; // 0시~1시 전까지는 전날 23시 데이터
    }
    return `${hours}00`; // 정시로 반환
}

// 응답 데이터에서 필요한 날씨 정보를 파싱하는 함수
function parseWeatherData(data) {
    const parser = new (require('xml2js')).Parser();
    let weatherItems = [];

    parser.parseString(data, (err, result) => {
        if (err) {
            console.error('XML 파싱 오류:', err);
            return;
        }

        const items = result.response.body[0].items[0].item;

        // 필요한 날씨 정보 추출
        items.forEach(item => {
            const category = item.category[0];
            const value = item.fcstValue[0];

            // 특정 카테고리에 따른 데이터 추출
            if (category === 'T1H') { // 기온
                weatherItems.push({ type: 'temperature', value: value });
            } else if (category === 'RN1') { // 강수량
                weatherItems.push({ type: 'precipitation', value: value });
            }
            // 필요 시 추가 카테고리 처리
        });
    });

    return weatherItems;
}

// 출발지와 도착지 사이의 날씨 정보를 가져오는 함수
async function getRouteWeather(req, res) {
    const { start, end } = req.query;

    // 휴게소 좌표를 임의로 설정 (예시)
    const restAreas = [
        { name: '서울만남(부산)휴게소', nx: 60, ny: 127 },
        { name: '죽전(서울)휴게소', nx: 60, ny: 128 }
    ];

    const results = await Promise.all(restAreas.map(async (area) => {
        const weather = await fetchWeather(area.nx, area.ny);
        return {
            restAreaName: area.name,
            weather: weather // 기온, 강수량 정보
        };
    }));

    res.status(200).json(results);
}

module.exports = {
    getRouteWeather
};
