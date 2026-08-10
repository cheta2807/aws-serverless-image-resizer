import boto3
import os
import io
import urllib.parse
from PIL import Image, ImageOps

s3 = boto3.client("s3")

DESTINATION_BUCKET = os.environ["DESTINATION_BUCKET"]
RESIZED_WIDTH = int(os.environ.get("RESIZED_WIDTH", "800"))
RESIZED_HEIGHT = int(os.environ.get("RESIZED_HEIGHT", "800"))


def lambda_handler(event, context):

    print("Image Resizer Lambda started")

    for record in event.get("Records", []):

        source_bucket = record["s3"]["bucket"]["name"]
        source_key = urllib.parse.unquote_plus(
            record["s3"]["object"]["key"]
        )

        print(f"Source bucket: {source_bucket}")
        print(f"Source key: {source_key}")

        extension = os.path.splitext(source_key)[1].lower()

        if extension not in [".jpg", ".jpeg", ".png", ".webp"]:
            print("Unsupported file type. Skipping.")
            continue

        response = s3.get_object(
            Bucket=source_bucket,
            Key=source_key
        )

        image_data = response["Body"].read()

        with Image.open(io.BytesIO(image_data)) as image:

            image = ImageOps.exif_transpose(image)

            image.thumbnail(
                (RESIZED_WIDTH, RESIZED_HEIGHT),
                Image.Resampling.LANCZOS
            )

            output = io.BytesIO()

            if extension in [".jpg", ".jpeg"]:

                if image.mode not in ("RGB", "L"):
                    image = image.convert("RGB")

                image.save(
                    output,
                    format="JPEG",
                    quality=85,
                    optimize=True
                )

                content_type = "image/jpeg"

            elif extension == ".png":

                image.save(
                    output,
                    format="PNG",
                    optimize=True
                )

                content_type = "image/png"

            else:

                image.save(
                    output,
                    format="WEBP",
                    quality=85
                )

                content_type = "image/webp"

            output.seek(0)

            destination_key = f"resized-{os.path.basename(source_key)}"

            s3.put_object(
                Bucket=DESTINATION_BUCKET,
                Key=destination_key,
                Body=output.getvalue(),
                ContentType=content_type
            )

            print(
                f"Successfully created "
                f"s3://{DESTINATION_BUCKET}/{destination_key}"
            )

    return {
        "statusCode": 200,
        "body": "Image resizing completed"
    }