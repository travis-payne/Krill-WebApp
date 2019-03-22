from django import forms
from django.forms import TextInput

from KrillApp.models import Image
from KrillApp.models import Trip

class ImageForm(forms.ModelForm):
    class Meta:
        model = Image
        fields = ('image','trip_name')
        widgets = {
            'user': TextInput(attrs={'readonly': 'readonly'})
        }

class TripForm(forms.ModelForm):
    class Meta:
        model = Trip
        fields = ['trip_name']
