\# AWS Serverless Image Resizer



A serverless image resizing web application built using AWS services.



Users can upload an image from a modern web interface. The image is securely uploaded to Amazon S3 using a presigned URL, automatically resized by AWS Lambda using Pillow, and made available for download.



\## Live Demo



https://d19wmjuhhphaa5.cloudfront.net



\## Architecture



User  

↓  

Amazon CloudFront  

↓  

Amazon S3 Frontend  

↓  

Amazon API Gateway  

↓  

API Lambda  

↓  

Presigned S3 Upload URL  

↓  

Original Images S3 Bucket  

↓  

S3 Event Trigger  

↓  

Image Resizer Lambda + Pillow  

↓  

Resized Images S3 Bucket  

↓  

Download Resized Image



\## AWS Services Used



\- Amazon S3

\- AWS Lambda

\- Amazon API Gateway

\- Amazon CloudFront

\- AWS IAM

\- Amazon CloudWatch



\## Technologies



\- Python

\- Pillow

\- HTML

\- CSS

\- JavaScript

\- PowerShell

\- AWS CLI



\## Features



\- Modern responsive frontend

\- Image preview before upload

\- Secure S3 uploads using presigned URLs

\- Automatic serverless image resizing

\- Supports JPG, JPEG, PNG and WEBP

\- Automatic S3 event trigger

\- Download resized image

\- CloudFront public deployment

\- CloudWatch logging

\- No AWS credentials stored in frontend



\## Project Structure



```text

aws-image-resizer/

│

├── frontend/

│   ├── index.html

│   ├── style.css

│   └── script.js

│

├── lambda/

│   ├── api/

│   │   └── lambda\_function.py

│   └── resizer/

│       └── lambda\_function.py

│

├── architecture.md

├── README.md

└── .gitignore

