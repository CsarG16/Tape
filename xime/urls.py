from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('mensaje/', views.mensaje, name='mensaje'),
    path('generar-qr-secreto-amor/', views.qr_gen, name='qr_gen'),
]
