from django import forms
from django.forms import TextInput

from KrillApp.models import Image

class ImageForm(forms.ModelForm):
    class Meta:
        model = Image
        fields = ('image_file',)
        widgets = {
            'user': TextInput(attrs={'readonly': 'readonly'})
        }
