
var containerElement = null;
var uploadsList = null;
var clearSelectionButton = null;
var zoomFactorField = null;
var maxWidthField = null;
var maxHeightField = null;
var cssPrefixField = null;
var outputImageName = null;
var renderButton = null;
var renderCanvas = null;
var renderResolution = null;
var downloadImageButton = null;
var stylesheetOutput = null;
var downloadStylesheet = null;

const uploadFileChooser = document.createElement("input");
uploadFileChooser.type = "file";
uploadFileChooser.multiple = true;
uploadFileChooser.accept = "image/png, image/jpeg, image/webp, image/gif, image/x-icon, image/bmp, image/tiff";

const currentLoadedImages = [];

uploadFileChooser.addEventListener("change", (evt) => {
	var f = uploadFileChooser.files;
	if(f.length > 0) {
		for(var i = 0; i < f.length; ++i) {
			const newImage = document.createElement("img");
			const newName = f[i].name;
			newImage.addEventListener("load", () => {
				var w = newImage.width;
				var h = newImage.height;
				var imgZoomFactor = 1.0;
				if(w > 100) {
					imgZoomFactor = 100.0 / w;
				}
				if(h * imgZoomFactor > 65) {
					imgZoomFactor = 65.0 / h;
				}
				newImage.style.width = "" + (w * imgZoomFactor) + "px";
				newImage.style.height = "" + (h * imgZoomFactor) + "px";
				const newIndex = currentLoadedImages.length;
				currentLoadedImages.push(newImage);
				uploadsList.appendChild(newImage);
				newImage.addEventListener("click", () => {
					if(confirm("Do you want to remove '" + newName + "'?")) {
						URL.revokeObjectURL(newImage.src);
						currentLoadedImages.splice(newIndex, 1);
						newImage.parentElement.removeChild(newImage);
					}
				});
			});
			newImage.src = URL.createObjectURL(f[i]);
		}
		clearSelectionButton.style.display = "inline";
	}
});

function toggleCheckbox(chk, field, def) {
	field.disabled = !chk.checked;
	field.value = def;
}

window.addEventListener("load", () => {
	containerElement = document.getElementById("container");
	uploadsList = document.getElementById("files-uploaded");
	clearSelectionButton = document.getElementById("clear-selection");
	zoomFactorField = document.getElementById("conf-zoom-factor");
	maxWidthField = document.getElementById("conf-max-width");
	maxHeightField = document.getElementById("conf-max-height");
	cssPrefixField = document.getElementById("conf-css-prefix");
	outputImageName = document.getElementById("conf-out-img-name");
	renderButton = document.getElementById("render-button");
	renderCanvas = document.getElementById("render-canvas");
	renderResolution = document.getElementById("render-canvas-resolution");
	downloadImageButton = document.getElementById("download-image-button");
	stylesheetOutput = document.getElementById("stylesheet-out");
	downloadStylesheet = document.getElementById("download-stylesheet-button");
	document.getElementById("browse-button").addEventListener("click", uploadClicked);
	clearSelectionButton.addEventListener("click", clearSelectionClicked);
	document.getElementById("conf-zoom-factor-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, zoomFactorField, "1.0"));
	document.getElementById("conf-max-width-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, maxWidthField, ""));
	document.getElementById("conf-max-height-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, maxHeightField, ""));
	document.getElementById("conf-css-prefix-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, cssPrefixField, "img"));
	document.getElementById("conf-out-img-name-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, outputImageName, "sheet.png"));
});

function uploadClicked() {
	uploadFileChooser.click();
}

function clearSelectionClicked() {
	uploadsList.innerHTML = "";
	for(var i = 0; i < currentLoadedImages.length; ++i) {
		URL.revokeObjectURL(currentLoadedImages[i].src);
	}
	currentLoadedImages.length = 0;
	clearSelectionButton.style.display = "none";
}
