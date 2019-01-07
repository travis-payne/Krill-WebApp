from django.http import HttpResponseRedirect
from django.shortcuts import render
from django.conf import settings
from django.core.files.storage import FileSystemStorage
from KrillApp.forms import ImageForm
from KrillApp.models import Image

def Upload_Image(request):

    if request.method == 'POST':
        form = ImageForm(request.POST ,request.FILES)
        if form.is_valid():
            instance = form.save(commit=False)
            instance.user_name = request.user.username
            instance.user=request.user
            instance.save()
            return HttpResponseRedirect('/ImagesSuccessful')
    else:
        form = ImageForm()
    return render(request, 'ImagesUpload.html', {'form':form})


def Get_User_Images(request):
    sql = 'SELECT * FROM Krillapp_image WHERE user_id="' + str(request.user.id) + '";'
    urls = []
    images = Image.objects.raw(sql)
    for image in images:
        urls.append(str(image.image_file).replace("user_"+str(request.user.id),""))
    return render(request ,'ImagesView.html', {'images':images,'urls':urls})

def Delete_User_Image(request):
    Image.objects.filter(image_file=request.POST['image_url']).delete()
    return HttpResponseRedirect('/ImagesView')