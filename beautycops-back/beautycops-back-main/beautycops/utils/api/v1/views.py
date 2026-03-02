from django.conf import settings
from django.http import HttpResponseRedirect
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

from beautycops.users.models import PhoneOTP
from beautycops.users.api.v1.serializers import (
    SendOTPSerializer,
    VerifyOTPSerializer,
)

User = get_user_model()


class PasswordResetConfirmRedirect(APIView):
    permission_classes = []

    def get(self, request, uidb64, token, *args, **kwargs):
        return HttpResponseRedirect(
            f"{settings.PASSWORD_RESET_CONFIRM_REDIRECT_BASE_URL}/{uidb64}/{token}/"
        )


class SendOTPView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = SendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = str(serializer.validated_data["phone"])

        otp_obj, _ = PhoneOTP.objects.get_or_create(phone=phone)
        code = otp_obj.generate_code()

        # مؤقت للتطوير
        print(f"OTP for {phone}: {code}")

        return Response(
            {"message": "OTP sent"},
            status=status.HTTP_200_OK,
        )


class VerifyOTPView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = str(serializer.validated_data["phone"])
        code = serializer.validated_data["code"]

        try:
            otp_obj = PhoneOTP.objects.get(phone=phone)
        except PhoneOTP.DoesNotExist:
            return Response(
                {"error": "OTP not found"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not otp_obj.is_valid() or otp_obj.code != code:
            return Response(
                {"error": "Invalid or expired code"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user, _ = User.objects.get_or_create(phone=phone)

        refresh = RefreshToken.for_user(user)

        otp_obj.delete()

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )