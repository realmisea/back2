from django.urls import path
from .views import get_rest_area_and_weather

urlpatterns = [
    path('rest_area_and_weather/', get_rest_area_and_weather, name='rest_area_and_weather'),
]
