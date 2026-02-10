from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Now add the HTTP status code to the response.
    if response is not None:
        error = response.data
        field = None
        while True:
            if isinstance(error, dict):
                field = list(error.keys())[0]
                error = error.pop(field)
                continue
            elif isinstance(error, list):
                error = f"{error[0]}"
                continue
            break

        if "ErrorDetail" in error:
            error = error[error.index("=") + 2 : error.index(",") - 1]

        response.data["status_code"] = response.status_code
        response.data["field"] = field
        response.data["message"] = error

    return response
