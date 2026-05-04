from django.shortcuts import render

# Create your views here.

def index(request):
    return render(request, 'index.html')

def mensaje(request):
    return render(request, 'mensaje.html')

def qr_gen(request):
    return render(request, 'qr_gen.html')
