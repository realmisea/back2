const axios = require('axios');
const { DOMParser } = require('xmldom'); // xmldom에서 DOMParser 임포트

const getRouteWeather = async (req, res) => {
    const { start, end } = req.query;

    const calculateIntermediatePoints = (start, end) => {
        const startLat = parseFloat(start.split(',')[0]);
        const startLon = parseFloat(start.split(',')[1]);
        const endLat = parseFloat(end.split(',')[0]);
        const endLon = parseFloat(end.split(',')[1]);

        const oneThirdLat = startLat + (endLat - startLat) / 3;
        const oneThirdLon = startLon + (endLon - startLon) / 3;
        const twoThirdLat = startLat + (2 * (endLat - startLat)) / 3;
        const twoThirdLon = startLon + (2 * (endLon - startLon)) / 3;

        return [{ lat: oneThirdLat, lon: oneThirdLon }, { lat: twoThirdLat, lon: twoThirdLon }];
    };

    const points = calculateIntermediatePoints(start, end);

    try {
        const weatherData = await Promise.all(
            points.map(async (point) => {
                // 한국도로공사 API를 사용해 1/3, 2/3 지점 근처 휴게소 검색
                const restAreaResponse = await axios.get('https://data.ex.co.kr/openapi/locationinfo/locationinfoRest', {
                    params: {
                        key: process.env.HIGHWAY_API_KEY,
                        type: 'json',
                        xValue: point.lon,
                        yValue: point.lat,
                        radius: 5000 // 5km 반경 내 휴게소 검색
                    }
                });

                const restArea = restAreaResponse.data.list[0]; // 가장 가까운 휴게소 선택

                // 기상청 API로 해당 좌표의 날씨 정보 가져오기
                const weatherResponse = await axios.get(`http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst`, {
                    params: {
                        serviceKey: '08ShZLU9W1ERnmtAAHGoWoVoaSo8Y7xLxEjrjm6pBo%2FFR9mhWCod9CeRKrpTdrACHSWnuCernkvYQjqQmuwHvg%3D%3D',
                        numOfRows: 100,
                        pageNo: 1,
                        dataType: 'XML',
                        base_date: '20231014', // 날짜 업데이트 필요
                        base_time: '0600', // 시간 업데이트 필요
                        nx: restArea.xValue, // x 좌표
                        ny: restArea.yValue // y 좌표
                    }
                });

                // 날씨 응답 데이터 확인
                console.log('Weather Response:', weatherResponse.data);

                // XML을 JavaScript 객체로 변환
                const xmlDoc = new DOMParser().parseFromString(weatherResponse.data, "text/xml");

                // 필요한 데이터를 추출
                const items = Array.from(xmlDoc.getElementsByTagName("item")).map(item => {
                    return {
                        category: item.getElementsByTagName("category")[0].textContent,
                        value: item.getElementsByTagName("obsrValue")[0].textContent,
                    };
                });

                return {
                    restAreaName: restArea.unitName,
                    weather: items
                };
            })
        );

        res.status(200).json(weatherData);
    } catch (error) {
        console.error('Error fetching route weather:', error);
        res.status(500).json({ message: 'Route weather fetch failed', error: error.message });
    }
};

module.exports = { getRouteWeather };
