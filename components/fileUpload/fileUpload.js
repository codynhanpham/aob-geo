// Drag and drop file upload
preventDragDefault = function(event) {
    event.preventDefault();
};
uploadFilesDragged = function(event, element) {
    event.preventDefault();
    const parent = element.parentElement.parentElement.parentElement;
    const thisUploadFieldID = parent.id;

    const files = event.dataTransfer.files;
    handleUploadedFiles(files, thisUploadFieldID);
};

// On click file upload
uploadFiles = function(event, element) {
    const files = event.target.files;
    const parent = element.parentElement.parentElement;
    const thisUploadFieldID = parent.id;
    handleUploadedFiles(files, thisUploadFieldID);
};

// Keyboard navigation for file upload
triggerFileInput = function(element) {
    const fileInput = element.querySelector('input[type="file"]');
    fileInput.click();
};
// Listening for the Enter or Space key to trigger the file upload
window.onload = function() {
    const fileUploadInputFields = document.querySelectorAll('.uploadfield-wrapper');
    fileUploadInputFields.forEach((fileUploadInputField) => {
        fileUploadInputField.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                triggerFileInput(fileUploadInputField);
            }
        });
    });
};



function handleUploadedFiles(files, uploadFieldID) {
    // Do something with the files
    console.log(files);
    console.log(uploadFieldID);
    alert(`You uploaded ${files.length} files, using the upload field with ID: #${uploadFieldID}`)
}