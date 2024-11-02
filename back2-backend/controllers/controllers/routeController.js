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
        const weatherData = [];

        for (const point of points) {
            const restAreaResponse = await axios.get('https://data.ex.co.kr/openapi/locationinfo/locationinfoRest', {
                params: {
                    key: process.env.HIGHWAY_API_KEY,
                    type: 'json',
                    xValue: point.lon,
                    yValue: point.lat,
                    radius: 2000 // 2km 반경 내 휴게소 검색으로 조정
                }
            });

            const restAreas = restAreaResponse.data.list;
            const restArea = restAreas.find((ra) => {
                return !weatherData.some(wd => wd.restAreaName === ra.unitName);
            }) || restAreas[0]; // 중복되지 않는 휴게소가 없으면 첫 번째 선택

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

            const xmlDoc = new DOMParser().parseFromString(weatherResponse.data, "text/xml");
            const items = Array.from(xmlDoc.getElementsByTagName("item")).map(item => {
                return {
                    category: item.getElementsByTagName("category")[0].textContent,
                    value: item.getElementsByTagName("obsrValue")[0].textContent,
                };
            });

            weatherData.push({
                restAreaName: restArea.unitName,
                weather: items
            });
        }

        res.status(200).json(weatherData);
    } catch (error) {
        console.error('Error fetching route weather:', error);
        res.status(500).json({ message: 'Route weather fetch failed', error: error.message });
    }
};

module.exports = { getRouteWeather };
