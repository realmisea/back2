from django.shortcuts import render
from django.conf import settings
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
    api_key = settings.KMA_API_KEY  # 기상청 API 키
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

# 3. KakaoMap API를 통해 경로 가져오기
def call_kakao_route_api(start_location, end_location):
    kakao_api_key = settings.KAKAO_API_KEY  # 자신의 Kakao API 키로 변경
    headers = {
        'Authorization': f'KakaoAK {kakao_api_key}'
    }

    route_url = f'https://apis.kakao.com/v1/routes?start={start_location}&end={end_location}'
    response = requests.get(route_url, headers=headers)
    
    if response.status_code == 200:
        return response.json()  # 실제 응답 데이터 구조에 맞게 처리
    return {'error': 'Failed to fetch route data'}

@api_view(['POST'])  # POST 요청 허용
def get_rest_area_and_weather(request):
    start_location = request.data.get('start_location')
    end_location = request.data.get('end_location')

    if not all([start_location, end_location]):
        return Response({'error': 'Start and end locations are required'}, status=400)

    # 1. KakaoMap API를 통해 경로 가져오기
    route_data = call_kakao_route_api(start_location, end_location)

    if 'error' in route_data:
        return Response({'error': route_data['error']}, status=500)

    # 경로 데이터에서 중간 지점 추출
    try:
        mid_point_one = route_data['points'][len(route_data['points']) // 3]
        mid_point_two = route_data['points'][2 * len(route_data['points']) // 3]
    except IndexError:
        return Response({'error': 'Route data is not sufficient'}, status=400)

    # 2. 고속도로 휴게소 API 호출
    rest_area_one_data = call_rest_area_api(mid_point_one['lat'], mid_point_one['lon'])
    rest_area_two_data = call_rest_area_api(mid_point_two['lat'], mid_point_two['lon'])

    rest_area_one = rest_area_one_data.get('name', 'N/A')
    rest_area_two = rest_area_two_data.get('name', 'N/A')

    # 3. 기상청 API 호출해서 날씨 정보 가져오기
    weather_one = call_kma_weather_api(mid_point_one['lat'], mid_point_one['lon'])
    weather_two = call_kma_weather_api(mid_point_two['lat'], mid_point_two['lon'])

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
