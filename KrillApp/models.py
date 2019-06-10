from datetime import datetime    
from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.forms import ModelForm
from django.conf import settings



# Create your models here.
def user_directory_path(instance, filename):
    # file will be uploaded to MEDIA_ROOT/user_<id>/<filename>
    return 'user_{0}/{1}'.format(instance.user.id, filename)

class Trip(models.Model):
    trip_name = models.CharField(primary_key=True,max_length=100,unique=True)
    user = models.ForeignKey(User, on_delete = models.CASCADE, null=False)
    created_on = models.DateTimeField(default=datetime.now)
    def __str__(self):
        return '%s' % (self.trip_name)

class Image(models.Model):
    image = models.ImageField(unique = True,upload_to=user_directory_path) 
    file_name = models.TextField(primary_key=True)
    user_name = models.CharField(max_length=30, default = "")
    trip_name = models.ForeignKey(Trip, to_field='trip_name',on_delete = models.CASCADE)
    image_annotations = models.TextField(default="")


class Krill(models.Model):
    image_file = models.ForeignKey(Image,on_delete= models.CASCADE,blank=True, null=True)
    length = models.CharField(blank=True, null=True,max_length=30,default="")
    maturity = models.CharField(blank=True, null=True,max_length=30,default="")
    image_annotation = models.TextField(default="")
    bounding_box_num = models.CharField(blank=False,null=True,max_length=30)
    unique_krill_id = models.CharField(primary_key=True, blank=False,null=False,unique=True,max_length=50)
    x= models.CharField(max_length=50,default="")
    y= models.CharField(max_length=50,default="")
    height= models.CharField(max_length=50,default="")
    width= models.CharField(max_length=50,default="")

