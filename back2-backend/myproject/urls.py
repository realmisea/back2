from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home_view(request):
    return HttpResponse("Welcome to the Django project!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view),  # 기본 경로에 대한 뷰 추가
    path('api/', include('weather.urls')),  # weather 앱의 URL 패턴 포함
]
