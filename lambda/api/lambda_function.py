import boto3
from botocore.config import Config
import json
import os
import uuid

REGION = os.environ.get("AWS_REGION", "ap-south-1")

s3 = boto3.client(
    "s3",
    region_name=REGION,
    endpoint_url=f"https://s3.{REGION}.amazonaws.com",
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "virtual"}
    )
)

ORIGINAL_BUCKET = os.environ["ORIGINAL_BUCKET"]
RESIZED_BUCKET = os.environ["RESIZED_BUCKET"]


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
        },
        "body": json.dumps(body)
    }


def lambda_handler(event, context):

    method = (
        event.get("requestContext", {})
        .get("http", {})
        .get("method", "GET")
    )

    path = event.get("rawPath", "/")

    if method == "OPTIONS":
        return response(200, {})

    # Generate upload URL
    if path == "/upload-url" and method == "POST":

        try:
            body = json.loads(event.get("body") or "{}")

            filename = body.get("filename")
            content_type = body.get(
                "contentType",
                "image/jpeg"
            )

            if not filename:
                return response(
                    400,
                    {"message": "filename is required"}
                )

            extension = os.path.splitext(filename)[1].lower()

            allowed_extensions = [
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            ]

            if extension not in allowed_extensions:
                return response(
                    400,
                    {"message": "Unsupported image format"}
                )

            unique_name = (
                f"{uuid.uuid4().hex}-{filename}"
            )

            upload_url = s3.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": ORIGINAL_BUCKET,
                    "Key": unique_name,
                    "ContentType": content_type
                },
                ExpiresIn=300
            )

            resized_key = (
                f"resized-{unique_name}"
            )

            return response(
                200,
                {
                    "uploadUrl": upload_url,
                    "key": unique_name,
                    "resizedKey": resized_key
                }
            )

        except Exception as error:

            print(error)

            return response(
                500,
                {
                    "message":
                    "Failed to generate upload URL"
                }
            )

    # Check resized image
    if path == "/download-url" and method == "GET":

        params = (
            event.get("queryStringParameters")
            or {}
        )

        key = params.get("key")

        if not key:
            return response(
                400,
                {"message": "key is required"}
            )

        try:

            s3.head_object(
                Bucket=RESIZED_BUCKET,
                Key=key
            )

            download_url = s3.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": RESIZED_BUCKET,
                    "Key": key
                },
                ExpiresIn=300
            )

            return response(
                200,
                {
                    "ready": True,
                    "downloadUrl": download_url
                }
            )

        except Exception:

            return response(
                200,
                {"ready": False}
            )

    return response(
        404,
        {"message": "Route not found"}
    )