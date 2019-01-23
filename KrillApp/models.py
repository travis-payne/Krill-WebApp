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
    image_file = models.ImageField(upload_to=user_directory_path) 
    user_name = models.CharField(max_length=30, default = "")
    time_uploaded = models.DateTimeField(default=datetime.now)
    trip_name = models.ForeignKey(Trip, to_field='trip_name',on_delete = models.CASCADE)

