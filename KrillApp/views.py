from django.http import HttpResponse ,HttpResponseRedirect ,JsonResponse
from django.template.loader import render_to_string
from django.shortcuts import render
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from KrillApp.forms import ImageForm ,TripForm
from KrillApp.models import Image, Trip
from django.views import View


def Upload_Image(request):
    if request.method == 'POST':
        form = ImageForm(request.POST ,request.FILES)
        if form.is_valid():
            instance = form.save(commit=False)
            instance.user_name = request.user.username
            instance.user=request.user
            instance.save()
            return HttpResponseRedirect('/images_successful')
    else:
        form = ImageForm()
    return render(request, 'images_upload.html', {'form':form})

def Create_Trip(request):
    if request.method == 'POST':
        form  = TripForm(request.POST)
        if form.is_valid():
            instance = form.save(commit=False)
            instance.user=request.user
            instance.save()
            return HttpResponseRedirect('/view_trips')
    else:
        form = TripForm()
    return render(request,'create_trip.html', {'form':form})


def Get_User_Images(request):
    sql = 'SELECT * FROM Krillapp_image WHERE user_id="' + str(request.user.id) + '";'
    urls = []
    images = Image.objects.raw(sql)
    for image in images:
        urls.append(str(image.image_file).replace("user_"+str(request.user.id),""))
    return render(request ,'images_view.html', {'images':images,'urls':urls})

def Get_User_Trips(request):
    sql = 'SELECT * FROM Krillapp_trip;'
    trip_list = []
    trips = Trip.objects.raw(sql)
    for trip in trips:
        trip_list.append(str(trip.trip_name))
    return render(request ,'view_trips.html', {'trip_list':trip_list})

def Get_Trip_Image_List(request):
    sql = 'SELECT * FROM Krillapp_image WHERE trip_name_id="' + str(request.POST['trip_to_get']) + '";'
    trip_image_list = []
    images = Image.objects.raw(sql)
    for image in images:
        trip_image_list.append(str(image.image_file))
    return JsonResponse({
        'trip_image_list':trip_image_list,
    })

def Delete_Trip(request):
    Trip.objects.filter(trip_name=request.POST['trip_to_delete']).delete()
    return HttpResponseRedirect('/view_trips')



def Upload_Image_To_Trip(request):
    trips = Trip.objects.all()
    return render(request,'upload_image_to_trip.html',{'trips':trips})



#todo fix lmao
def Delete_User_Image(request):
    print(request.POST['image_url'])
    Image.objects.filter(image_file=request.POST['image_url']).delete()
    return HttpResponseRedirect('/view_trips')

def Delete_User_Image(request):
    print(request.POST['image_url'])
    print(Image.objects.filter(image_file=request.POST['image_url']).delete())
    return HttpResponse('/via')
    


def View_Trip_Image(request):
    html = render_to_string('view_trip_image.html',{'image_url':request.POST['image_url'],'raw_url':request.POST['stripped_url']},request=request)
    return HttpResponse(html)

class BasicUploadView(View):
    def get(self, request):
        photos_list = Image.objects.all()
        return render(self.request, 'upload_image_to_trip.html', {'photos': photos_list})

    def post(self, request):
        form = ImageForm(self.request.POST, self.request.FILES)
        if form.is_valid():
            instance = form.save(commit=False)
            instance.trip_name = Trip.objects.get(trip_name__exact=request.POST['trip_name'])
            instance.user_name = request.user.username
            instance.user=request.user
            instance.save()
            print(instance.image_file)
            data = {'is_valid': True, 'url': str(instance.image_file)}
        else:
            data = {'is_valid': False}
        return JsonResponse(data)

def Load_VIA(request):
    sql = 'SELECT * FROM Krillapp_trip;'
    trip_list = []
    trips = Trip.objects.raw(sql)
    for trip in trips:
        trip_list.append(str(trip.trip_name))
    return render(request ,'via.html', {'trips':trips})


def Save_Image_Annotations(request):
    print(request.POST)
    sql = 'UPDATE Krillapp_image SET image_annotations = ' + request.POST['image_annotations'] + ' WHERE image_file = '+request.POST['image_name']+';'
    responce = Image.objects.raw(sql)
    print(responce)
    return HttpResponse('/via')