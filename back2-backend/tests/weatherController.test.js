const request = require('supertest');
const express = require('express');
const { getSimpleWeather, getDetailedWeather } = require('../controllers/controllers/weatherController'); // 경로 수정

const app = express();
app.get('/weather/simple/:location', getSimpleWeather);
app.get('/weather/detailed/:location', getDetailedWeather);

describe('Weather Controller Tests', () => {
    it('should get simple weather data', async () => {
        const response = await request(app).get('/weather/simple/37.5665,126.978');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('temperature');
        expect(response.body).toHaveProperty('precipitation_probability');
        expect(response.body).toHaveProperty('air_quality_level');
    });

    it('should get detailed weather data', async () => {
        const response = await request(app).get('/weather/detailed/37.5665,126.978');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('hourly');
    });
});
