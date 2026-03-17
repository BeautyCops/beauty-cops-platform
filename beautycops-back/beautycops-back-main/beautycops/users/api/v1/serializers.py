from dj_rest_auth.serializers import LoginSerializer
from django.core.validators import MaxLengthValidator, MinLengthValidator, RegexValidator
from django.db.models import Q
from django.utils.crypto import salted_hmac
from django.utils.translation import gettext_lazy as _
from phonenumber_field.phonenumber import to_python
from rest_framework import serializers

from beautycops.users.models import User


class SignInSerializer(LoginSerializer):
    username = None
    login = serializers.CharField(write_only=True, required=True)

    # validate if the user is active
    def validate(self, attrs):
        login = (attrs.pop("login", "") or "").strip()
        if not login:
            raise serializers.ValidationError({"login": ["الرجاء إدخال البريد الإلكتروني أو رقم الجوال"]})

        if "@" in login:
            # Use email login
            attrs["email"] = login
        else:
            # Use phone login (parse as Saudi: 05..., 5..., 966..., +966..., 00966...)
            phone_obj = to_python(login, region="SA")
            if not phone_obj or not getattr(phone_obj, "is_valid", lambda: False)():
                raise serializers.ValidationError({"login": ["رقم الجوال غير صحيح"]})

            user = (
                User.objects.filter(Q(phone=phone_obj))
                .only("email", "is_active", "is_deleted")
                .first()
            )
            if not user or not user.email:
                raise serializers.ValidationError({"detail": ["بيانات الدخول غير صحيحة"]})

            attrs["email"] = user.email

        data = super().validate(attrs)
        user = data.get("user")
        if user and user.is_deleted:
            raise serializers.ValidationError({"detail": ["هذا الحساب تم تعطيله."]})
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", required=True)
    email_or_phone = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[
            MinLengthValidator(8),
            MaxLengthValidator(100),
            RegexValidator(
                # at least one letter, one digit, allowed specials, no spaces
                r"^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@!#$%^&*()_+\-=\[\]{};':\"\\|,.<>/?]+$",
                _("Password must contain at least one letter, one number, and may include special characters"),
            ),
        ],
    )

    class Meta:
        model = User
        fields = (
            "name",
            "email_or_phone",
            "password",
            "skin_type",
        )

    @staticmethod
    def _synthetic_email_from_phone(raw_phone: str) -> str:
        # Stable, non-deliverable email used only to satisfy the User model's
        # email-as-username requirement when user registers with phone only.
        digest = salted_hmac("phone-login", raw_phone).hexdigest()[:24]
        return f"phone.{digest}@local.invalid"

    def validate_email_or_phone(self, value: str) -> str:
        v = (value or "").strip()
        if not v:
            raise serializers.ValidationError("الرجاء إدخال البريد الإلكتروني أو رقم الجوال")

        if "@" in v:
            # Validate email format
            serializers.EmailField().run_validation(v)
        else:
            phone_obj = to_python(v, region="SA")
            if not phone_obj or not getattr(phone_obj, "is_valid", lambda: False)():
                raise serializers.ValidationError("رقم الجوال غير صحيح")
        return v

    def create(self, validated_data):
        login = validated_data.pop("email_or_phone").strip()

        if "@" in login:
            email = login
            phone = None
        else:
            phone_obj = to_python(login, region="SA")
            phone = phone_obj
            email = self._synthetic_email_from_phone(str(phone_obj))

        # Uniqueness checks with clear Arabic messages
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email_or_phone": ["هذا البريد الإلكتروني مستخدم بالفعل"]})
        if phone and User.objects.filter(phone=phone).exists():
            raise serializers.ValidationError({"email_or_phone": ["رقم الجوال مستخدم بالفعل"]})

        # Map name -> first_name already handled by source
        user = User.objects.create_user(email=email, phone=phone, **validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", read_only=True)

    class Meta:
        model = User
        fields = (
            "uid",
            "email",
            "name",
            "skin_type",
            "phone",
        )
