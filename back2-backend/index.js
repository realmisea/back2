// app.js 또는 index.js
const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
require('dotenv').config();
const app = require('./app');
const app = express();
const PORT = process.env.PORT || 5173;

// 라우터 모듈 가져오기
const routeRoutes = require('./controllers/routes/routeRoutes');

// 미들웨어 설정
app.use(express.json()); // JSON 바디 파싱
app.use('/api', routeRoutes);


app.get('/route-info', async (req, res) => {
    const startPoint = { latitude: 37.5665, longitude: 126.9780 }; // 서울 좌표
    const endPoint = { latitude: 37.7519, longitude: 128.8761 }; // 강릉 좌표

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

        const fetchWeatherData = async (latitude, longitude) => {
            const url = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst';
        
            // 현재 날짜와 시간 계산 함수
            const getCurrentDateAndTime = () => {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hour = String(now.getHours()).padStart(2, '0');
                
                // 예보 시간이 매 시각 30분 기준이므로, 1시간 전의 시각을 사용하는 것이 좋습니다.
                const time = hour >= '01' ? String(hour - 1).padStart(2, '0') + '30' : '2330';
        
                return {
                    date: `${year}${month}${day}`,
                    time
                };
            };
        
            const { date, time } = getCurrentDateAndTime();
        
            const response = await axios.get(url, {
                params: {
                    serviceKey: process.env.KMA_API_KEY,
                    numOfRows: 10,
                    pageNo: 1,
                    base_date: date,  // 동적으로 설정된 날짜
                    base_time: time,  // 동적으로 설정된 시간
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
            const weatherData = items.map(item => ({
                baseDate: item.baseDate,
                baseTime: item.baseTime,
                category: item.category,
                forecastDate: item.fcstDate,
                forecastTime: item.fcstTime,
                forecastValue: item.fcstValue,
                nx: item.nx,
                ny: item.ny
            }));
        
            return weatherData;
        };
        
        
        // 각 중간 지점의 날씨 데이터 조회
        const weatherData1 = await fetchWeatherData(point1.latitude, point1.longitude);
        const weatherData2 = await fetchWeatherData(point2.latitude, point2.longitude);

        const routeInfo = {
            startPoint,
            endPoint,
            intermediatePoints: [
                { ...point1, restAreas: restAreaResponse1.data.list, weather: weatherData1 },
                { ...point2, restAreas: restAreaResponse2.data.list, weather: weatherData2 }
            ]
        };

        res.status(200).json(routeInfo);
    } catch (error) {
        console.error('Error fetching route info:', error.message);
        res.status(500).json({ message: '경로 정보를 불러오는 데 실패했습니다.', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
