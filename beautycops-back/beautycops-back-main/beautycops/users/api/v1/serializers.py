from dj_rest_auth.serializers import LoginSerializer
from django.core.validators import MaxLengthValidator, MinLengthValidator, RegexValidator
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from beautycops.users.models import User


class SignInSerializer(LoginSerializer):
    username = None

    # validate if the user is active
    def validate(self, attrs):
        data = super().validate(attrs)
        user = data.get("user")
        if user and user.is_deleted:
            raise serializers.ValidationError("This user account is deactivated.")
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", required=True)
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
            "email",
            "phone",
            "password",
            "skin_type",
        )

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
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
