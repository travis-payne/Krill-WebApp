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

class Image(models.Model):
    user = models.ForeignKey(User,on_delete = models.CASCADE,null=True)
    image_file = models.ImageField(upload_to=user_directory_path) 
    user_name = models.CharField(max_length=30, default = "")
    time_uploaded = models.DateTimeField(default=datetime.now)