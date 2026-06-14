from django.contrib import admin
from .models import ActivityLog, Device, Ticket

admin.site.register(Device)
admin.site.register(Ticket)
admin.site.register(ActivityLog)
