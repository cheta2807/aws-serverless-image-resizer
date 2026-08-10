const API_URL = "https://l3oc1z6fz5.execute-api.ap-south-1.amazonaws.com";

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const preview = document.getElementById("preview");
const statusText = document.getElementById("statusText");
const downloadBtn = document.getElementById("downloadBtn");

let selectedFile = null;

fileInput.addEventListener("change", () => {
    selectedFile = fileInput.files[0];

    if (!selectedFile) return;

    const previewUrl = URL.createObjectURL(selectedFile);

    preview.src = previewUrl;
    preview.style.display = "block";

    statusText.textContent = "Image ready to upload";
});

uploadBtn.addEventListener("click", async () => {

    if (!selectedFile) {
        statusText.textContent = "Please select an image first.";
        return;
    }

    try {

        uploadBtn.disabled = true;
        downloadBtn.style.display = "none";

        statusText.textContent = "Generating secure upload URL...";

        const response = await fetch(
            `${API_URL}/upload-url`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    filename: selectedFile.name,
                    contentType: selectedFile.type
                })
            }
        );

        if (!response.ok) {
            throw new Error("Unable to generate upload URL");
        }

        const data = await response.json();

        statusText.textContent = "Uploading original image...";

        const uploadResponse = await fetch(
            data.uploadUrl,
            {
                method: "PUT",
                headers: {
                    "Content-Type": selectedFile.type
                },
                body: selectedFile
            }
        );

        if (!uploadResponse.ok) {
            throw new Error("Image upload failed");
        }

        statusText.textContent =
            "Image uploaded. AWS Lambda is resizing it...";

        await waitForResizedImage(data.resizedKey);

    } catch (error) {

        console.error(error);

        statusText.textContent =
            "Something went wrong. Check API or AWS configuration.";

    } finally {

        uploadBtn.disabled = false;
    }
});


async function waitForResizedImage(resizedKey) {

    for (let attempt = 1; attempt <= 15; attempt++) {

        statusText.textContent =
            `Processing image... (${attempt}/15)`;

        const response = await fetch(
            `${API_URL}/download-url?key=${encodeURIComponent(resizedKey)}`
        );

        const data = await response.json();

        if (data.ready) {

            statusText.textContent =
                "Image resized successfully!";

            downloadBtn.href = data.downloadUrl;

            downloadBtn.style.display = "inline-flex";

            return;
        }

        await sleep(2000);
    }

    statusText.textContent =
        "Processing is taking longer than expected.";
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}