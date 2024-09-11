from django.shortcuts import render

# Create your views here.
import requests
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET'])  # GET 요청만 허용
def get_weather(request):
    city = request.GET.get('city')  # URL에서 'city' 파라미터를 가져옴
    if not city:
        return Response({'error': 'City parameter is required'}, status=400)

    # OpenWeatherMap API 호출
    api_key = 'YOUR_OPENWEATHERMAP_API_KEY'  # OpenWeatherMap API 키
    weather_url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}"
    weather_response = requests.get(weather_url)

    if weather_response.status_code != 200:
        return Response({'error': 'Failed to fetch weather data'}, status=weather_response.status_code)

    return Response(weather_response.json())