from drf_spectacular.openapi import AutoSchema
from drf_spectacular.utils import OpenApiParameter


class DefaultAutoSchema(AutoSchema):
    global_params = [
        OpenApiParameter(
            name="Accept-Language",
            type=str,
            location=OpenApiParameter.HEADER,
            description="Locale header. Default: en",
            default="en",
        )
    ]

    def get_override_parameters(self):
        params = super().get_override_parameters()
        return params + self.global_params
