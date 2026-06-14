from django.urls import path
from .views import (
    activity_logs,
    analytics,
    auth_login,
    auth_logout,
    auth_status,
    devices,
    device_detail,
    tickets,
    ticket_detail,
)

urlpatterns = [
    # Devices
    path("devices/", devices),
    path("devices/<int:pk>/", device_detail),

    # Tickets
    path("tickets/", tickets),
    path("tickets/<int:pk>/", ticket_detail),

    # Analytics and activity
    path("analytics/", analytics),
    path("activity/", activity_logs),

    # Auth
    path("auth/status/", auth_status),
    path("auth/login/", auth_login),
    path("auth/logout/", auth_logout),
]
