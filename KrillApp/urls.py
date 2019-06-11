


"""Krill URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path, include
from django.views.generic.base import TemplateView # new
from django.conf import settings
from django.conf.urls.static import static
from KrillApp import views


urlpatterns = [
    path("", TemplateView.as_view(template_name='home.html'), name='home'),
    path("images_view/", views.Get_User_Images, name='images_view'),
    path("images_upload/", views.Upload_Image, name='images_upload'),
    path("acccounts/", include('django.contrib.auth.urls')),
    path("images_successful/", TemplateView.as_view(template_name='images_successful.html'), name='images_successful'),
    path("delete_image/",views.Delete_User_Image,name='delete_image'),
    path("create_trip/",views.Create_Trip,name='create_trip'),
    path("view_trips/",views.Get_User_Trips,name='view_trips'),
    path("get_trip_image_list/",views.Get_Trip_Image_List,name='get_trip_image_list'),
    path("upload_image_to_trip/",views.Upload_Image_To_Trip,name='upload_image_to_trip'),
    path("view_trip_image/",views.View_Trip_Image,name='view_trip_image'),
    path("delete_trip/",views.Delete_Trip,name='delete_trip'),
    path("via/",views.Load_VIA,name='via'),
    path("basic-upload/",views.BasicUploadView.as_view(),name='basic_upload'),
    path("save_image_annotations/",views.Save_Image_Annotations,name='save_image_annotations'),
    path("load_image_annotations/",views.Load_Image_Annotations,name='load_image_annotations'),
    path("detect_krill/",views.Detect_Krill,name='detect_krill'),
    path("pull_from_csv/",views.Pull_From_CSV,name='pull_from_csv'),
    path("export_to_csv/",views.Export_To_CSV,name='export_to_csv'),
    path("sort_boxes/",views.Sort_Boxes,name='sort_boxes'),

] + static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static("/Javascript/", document_root=settings.STATIC_ROOT)

