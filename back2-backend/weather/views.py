from django.shortcuts import render
import requests
from rest_framework.response import Response
from rest_framework.decorators import api_view

# 1. 고속도로 휴게소 현황 API 호출
def call_rest_area_api(lat, lon):
    rest_area_api_url = f"https://api.example.com/restarea?lat={lat}&lon={lon}&key=3242404939"
    response = requests.get(rest_area_api_url)
    
    if response.status_code == 200:
        return response.json()  # 실제 응답 데이터 구조에 맞게 처리
    return {'error': 'Failed to fetch rest area data'}


# 2. 기상청 API 호출
def call_kma_weather_api(lat, lon):
    # 기상청 API URL (위도, 경도 기반)
    api_key = 'YOUR_KMA_API_KEY'  # 기상청 API 키
    weather_url = f"http://apis.data.go.kr/1360000/VilageFcstInfoService/getVilageFcst?serviceKey={api_key}&numOfRows=10&pageNo=1&dataType=JSON&base_date=20230915&base_time=0500&nx={lat}&ny={lon}"
    weather_response = requests.get(weather_url)
    
    if weather_response.status_code == 200:
        weather_data = weather_response.json()
        # 기상 데이터 처리 (실제 데이터 구조에 맞게 가공)
        return {
            'temperature': weather_data.get('response', {}).get('body', {}).get('items', {}).get('item', [{}])[0].get('temp'),
            'description': weather_data.get('response', {}).get('body', {}).get('items', {}).get('item', [{}])[0].get('wfKor')
        }
    return {'error': 'Failed to fetch weather data'}

@api_view(['POST'])  # POST 요청 허용
def get_rest_area_and_weather(request):
    point_one_lat = request.data.get('point_one_lat')
    point_one_lon = request.data.get('point_one_lon')
    point_two_lat = request.data.get('point_two_lat')
    point_two_lon = request.data.get('point_two_lon')

    if not all([point_one_lat, point_one_lon, point_two_lat, point_two_lon]):
        return Response({'error': 'Two points are required'}, status=400)

    # 1. 고속도로 휴게소 현황 API 호출
    rest_area_one_data = call_rest_area_api(point_one_lat, point_one_lon)
    rest_area_two_data = call_rest_area_api(point_two_lat, point_two_lon)
    
    rest_area_one = rest_area_one_data.get('name', 'N/A')
    rest_area_two = rest_area_two_data.get('name', 'N/A')

    # 2. 기상청 API 호출해서 날씨 정보 가져오기
    weather_one = call_kma_weather_api(point_one_lat, point_one_lon)
    weather_two = call_kma_weather_api(point_two_lat, point_two_lon)

    result = {
        'rest_area_one': {"name": rest_area_one},
        'rest_area_two': {"name": rest_area_two},
        'weather_one': {
            'temperature': weather_one.get('temperature', 'N/A'),
            'description': weather_one.get('description', 'N/A')
        },
        'weather_two': {
            'temperature': weather_two.get('temperature', 'N/A'),
            'description': weather_two.get('description', 'N/A')
        }
    }

    return Response(result)




