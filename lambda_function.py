import io
import json
import logging
import os
from urllib.parse import unquote_plus

import boto3
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client("s3")

DESTINATION_BUCKET = os.environ["DESTINATION_BUCKET"]
RESIZED_WIDTH = int(os.environ.get("RESIZED_WIDTH", "500"))
RESIZED_HEIGHT = int(os.environ.get("RESIZED_HEIGHT", "500"))

SUPPORTED_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


def get_output_format(filename):
    extension = os.path.splitext(filename)[1].lower()

    if extension in (".jpg", ".jpeg"):
        return "JPEG", "image/jpeg"

    if extension == ".png":
        return "PNG", "image/png"

    if extension == ".webp":
        return "WEBP", "image/webp"

    raise ValueError(f"Unsupported image extension: {extension}")


def lambda_handler(event, context):
    logger.info("Received event: %s", json.dumps(event))

    processed_images = []

    for record in event.get("Records", []):
        source_bucket = record["s3"]["bucket"]["name"]
        source_key = unquote_plus(record["s3"]["object"]["key"])

        if not source_key.lower().endswith(SUPPORTED_EXTENSIONS):
            logger.warning("Skipping unsupported file: %s", source_key)
            continue

        try:
            response = s3.get_object(
                Bucket=source_bucket,
                Key=source_key
            )

            original_data = response["Body"].read()

            with Image.open(io.BytesIO(original_data)) as image:
                image = ImageOps.exif_transpose(image)

                image.thumbnail(
                    (RESIZED_WIDTH, RESIZED_HEIGHT),
                    Image.Resampling.LANCZOS
                )

                image_format, content_type = get_output_format(source_key)

                if image_format == "JPEG" and image.mode not in ("RGB", "L"):
                    image = image.convert("RGB")

                output_buffer = io.BytesIO()

                save_options = {
                    "format": image_format,
                    "optimize": True
                }

                if image_format == "JPEG":
                    save_options["quality"] = 85

                image.save(output_buffer, **save_options)
                output_buffer.seek(0)

                destination_key = f"resized-{source_key}"

                s3.put_object(
                    Bucket=DESTINATION_BUCKET,
                    Key=destination_key,
                    Body=output_buffer.getvalue(),
                    ContentType=content_type
                )

                processed_images.append({
                    "source": f"s3://{source_bucket}/{source_key}",
                    "destination": f"s3://{DESTINATION_BUCKET}/{destination_key}",
                    "width": image.width,
                    "height": image.height
                })

                logger.info(
                    "Resized image saved: s3://%s/%s",
                    DESTINATION_BUCKET,
                    destination_key
                )

        except UnidentifiedImageError:
            logger.exception(
                "The uploaded file is not a valid image: %s",
                source_key
            )
            raise

        except Exception:
            logger.exception(
                "Image resizing failed for: %s",
                source_key
            )
            raise

    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Image processing completed",
            "processedImages": processed_images
        })
    }
