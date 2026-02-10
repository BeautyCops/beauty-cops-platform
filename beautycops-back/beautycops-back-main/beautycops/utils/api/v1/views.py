from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework import mixins, views, viewsets

from beautycops.users.api.v1.serializers import UserRegistrationSerializer


class PasswordResetConfirmRedirect(views.APIView):
    permission_classes = []
    serializer_class = None

    def get(self, request, uidb64, token, *args, **kwargs):
        return HttpResponseRedirect(f"{settings.PASSWORD_RESET_CONFIRM_REDIRECT_BASE_URL}/{uidb64}/{token}/")


class UserRegistrationView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = UserRegistrationSerializer
    permission_classes = []
