from django.urls import path
from .views import get_weather  # views.py에서 작성할 get_weather 함수 연결

urlpatterns = [
    path('weather/', get_weather, name='get_weather'),  # /api/weather/ 엔드포인트 설정
]