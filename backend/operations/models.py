from django.db import models


class Device(models.Model):
    STATUS_CHOICES = [
        ("online", "Online"),
        ("warning", "Warning"),
        ("maintenance", "Maintenance"),
    ]

    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="online"
    )
    location = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Ticket(models.Model):
    STATUS_CHOICES = [
        ("open", "Open"),
        ("in_progress", "In Progress"),
        ("resolved", "Resolved"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="open"
    )

    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="medium"
    )

    assigned_to = models.CharField(
        max_length=100,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ("created", "Created"),
        ("updated", "Updated"),
        ("deleted", "Deleted"),
        ("login", "Login"),
        ("logout", "Logout"),
    ]

    entity_type = models.CharField(max_length=50)
    entity_id = models.PositiveIntegerField(null=True, blank=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    summary = models.CharField(max_length=255)
    actor = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.summary
