from django.contrib.auth import authenticate, login, logout
from django.db.models import Count
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status

from .models import ActivityLog, Device, Ticket
from .serializers import ActivityLogSerializer, DeviceSerializer, TicketSerializer


def get_actor(request):
    if request.user.is_authenticated:
        return request.user.get_username()
    return request.data.get("actor", "") if hasattr(request, "data") else ""


def log_activity(entity_type, entity_id, action, summary, actor=""):
    ActivityLog.objects.create(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        summary=summary,
        actor=actor,
    )


#DEVICES

@api_view(["GET", "POST"])
def devices(request):

    if request.method == "GET":
        devices = Device.objects.all().order_by("name")
        serializer = DeviceSerializer(devices, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = DeviceSerializer(data=request.data)
        if serializer.is_valid():
            device = serializer.save()
            log_activity(
                "device",
                device.id,
                "created",
                f"Created device {device.name}",
                get_actor(request),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
def device_detail(request, pk):

    try:
        device = Device.objects.get(pk=pk)
    except Device.DoesNotExist:
        return Response({"error": "Device not found"}, status=404)

    if request.method == "GET":
        serializer = DeviceSerializer(device)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = DeviceSerializer(device, data=request.data)
        if serializer.is_valid():
            device = serializer.save()
            log_activity(
                "device",
                device.id,
                "updated",
                f"Updated device {device.name}",
                get_actor(request),
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        device_name = device.name
        device_id = device.id
        device.delete()
        log_activity(
            "device",
            device_id,
            "deleted",
            f"Deleted device {device_name}",
            get_actor(request),
        )
        return Response({"message": "Deleted"}, status=204)


#TICKETS

@api_view(["GET", "POST"])
def tickets(request):

    if request.method == "GET":
        tickets = Ticket.objects.all().order_by("-created_at")
        serializer = TicketSerializer(tickets, many=True)
        return Response(serializer.data)

    if request.method == "POST":
        serializer = TicketSerializer(data=request.data)
        if serializer.is_valid():
            ticket = serializer.save()
            log_activity(
                "ticket",
                ticket.id,
                "created",
                f"Created ticket {ticket.title}",
                get_actor(request),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=400)


@api_view(["GET", "PUT", "DELETE"])
def ticket_detail(request, pk):

    try:
        ticket = Ticket.objects.get(pk=pk)
    except Ticket.DoesNotExist:
        return Response({"error": "Ticket not found"}, status=404)

    if request.method == "GET":
        serializer = TicketSerializer(ticket)
        return Response(serializer.data)

    if request.method == "PUT":
        serializer = TicketSerializer(ticket, data=request.data)
        if serializer.is_valid():
            ticket = serializer.save()
            log_activity(
                "ticket",
                ticket.id,
                "updated",
                f"Updated ticket {ticket.title}",
                get_actor(request),
            )
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    if request.method == "DELETE":
        ticket_title = ticket.title
        ticket_id = ticket.id
        ticket.delete()
        log_activity(
            "ticket",
            ticket_id,
            "deleted",
            f"Deleted ticket {ticket_title}",
            get_actor(request),
        )
        return Response({"message": "Deleted"}, status=204)


@api_view(["GET"])
def analytics(request):
    device_statuses = {
        row["status"]: row["count"]
        for row in Device.objects.values("status").annotate(count=Count("id"))
    }
    ticket_statuses = {
        row["status"]: row["count"]
        for row in Ticket.objects.values("status").annotate(count=Count("id"))
    }
    ticket_priorities = {
        row["priority"]: row["count"]
        for row in Ticket.objects.values("priority").annotate(count=Count("id"))
    }

    return Response(
        {
            "total_devices": Device.objects.count(),
            "device_statuses": device_statuses,
            "total_tickets": Ticket.objects.count(),
            "ticket_statuses": ticket_statuses,
            "ticket_priorities": ticket_priorities,
            "recent_activity_count": ActivityLog.objects.count(),
        }
    )


@api_view(["GET"])
def activity_logs(request):
    logs = ActivityLog.objects.all()[:50]
    serializer = ActivityLogSerializer(logs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
def auth_status(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False, "user": None})

    return Response(
        {
            "authenticated": True,
            "user": {
                "username": request.user.get_username(),
                "email": request.user.email,
                "is_staff": request.user.is_staff,
            },
        }
    )


@api_view(["POST"])
def auth_login(request):
    username = request.data.get("username", "")
    password = request.data.get("password", "")
    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response({"detail": "Invalid username or password"}, status=400)

    login(request, user)
    log_activity("auth", user.id, "login", f"{user.get_username()} signed in", user.get_username())
    return Response(
        {
            "authenticated": True,
            "user": {
                "username": user.get_username(),
                "email": user.email,
                "is_staff": user.is_staff,
            },
        }
    )


@api_view(["POST"])
def auth_logout(request):
    actor = request.user.get_username() if request.user.is_authenticated else ""
    logout(request)
    log_activity("auth", None, "logout", f"{actor or 'A user'} signed out", actor)
    return Response({"authenticated": False, "user": None})
