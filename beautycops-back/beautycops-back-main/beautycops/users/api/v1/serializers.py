from rest_framework import serializers
from phonenumber_field.serializerfields import PhoneNumberField
from django.core.validators import RegexValidator


class SendOTPSerializer(serializers.Serializer):
    phone = PhoneNumberField()

    def validate_phone(self, value):
        """
        يمكن إضافة شروط إضافية هنا لاحقًا
        مثل منع أرقام معينة أو فحص الدولة
        """
        return value


class VerifyOTPSerializer(serializers.Serializer):
    phone = PhoneNumberField()
    code = serializers.CharField(
        min_length=6,
        max_length=6,
        validators=[
            RegexValidator(
                regex=r"^\d{6}$",
                message="OTP must be exactly 6 digits."
            )
        ]
    )