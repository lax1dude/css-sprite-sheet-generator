
var containerElement = null;
var uploadsList = null;
var clearSelectionButton = null;
var zoomFactorField = null;
var maxWidthField = null;
var maxHeightField = null;
var cssPrefixField = null;
var outputImageName = null;
var exportTypeJPEG = null;
var exportJPEGQuality = null;
var exportTypePNG = null;
var renderButton = null;
var progressText = null;
var renderCanvas = null;
var renderCanvasContext = null;
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
				newImage.style.zoom = "" + imgZoomFactor;
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
			newImage.alt = newName.replace(/\.(png|jfif|pjpeg|jpeg|pjp|jpg|webp|gif|ico|bmp|dib|tiff|tif)$/, "");
		}
		clearSelectionButton.style.display = "inline";
		renderButton.disabled = false;
	}
});

function toggleCheckbox(chk, field, def) {
	field.disabled = !chk.checked;
	field.value = def;
}

function toggleIsJPEG(v) {
	var cnm = outputImageName.value;
	if(v && cnm.endsWith(".png")) {
		outputImageName.value = cnm.substring(0, cnm.length - 3) + "jpg";
	}else if(!v && cnm.endsWith(".jpg")) {
		outputImageName.value = cnm.substring(0, cnm.length - 3) + "png";
	}else if(!v && cnm.endsWith(".jpeg")) {
		outputImageName.value = cnm.substring(0, cnm.length - 4) + "png";
	}
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
	exportTypeJPEG = document.getElementById("conf-exp-type-jpg");
	exportJPEGQuality = document.getElementById("conf-exp-jpg-quality");
	exportTypePNG = document.getElementById("conf-exp-type-png");
	renderButton = document.getElementById("render-button");
	progressText = document.getElementById("loading-text");
	renderCanvas = document.getElementById("render-canvas");
	renderCanvas.addEventListener("contextmenu", (e) => {
		e.preventDefault();
		return false;
	});
	renderCanvasContext = renderCanvas.getContext("2d");
	renderResolution = document.getElementById("render-canvas-resolution");
	downloadImageButton = document.getElementById("download-image-button");
	stylesheetOutput = document.getElementById("stylesheet-out");
	downloadStylesheet = document.getElementById("download-stylesheet-button");
	document.getElementById("browse-button").addEventListener("click", uploadClicked);
	clearSelectionButton.addEventListener("click", clearSelectionClicked);
	renderButton.addEventListener("click", renderButtonClicked);
	downloadImageButton.addEventListener("click", downloadImageClicked);
	downloadStylesheet.addEventListener("click", downloadStylesheetClicked);
	document.getElementById("conf-zoom-factor-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, zoomFactorField, "1.0"));
	document.getElementById("conf-max-width-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, maxWidthField, ""));
	document.getElementById("conf-max-height-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, maxHeightField, ""));
	document.getElementById("conf-css-prefix-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, cssPrefixField, "img"));
	document.getElementById("conf-out-img-name-enable").addEventListener("change", (evt) => toggleCheckbox(evt.target, outputImageName, "sheet." + (exportTypeJPEG.checked ? "jpg" : "png")));
	document.getElementById("conf-exp-type-jpg").addEventListener("change", (evt) => {if(evt.target.checked){toggleIsJPEG(true);exportJPEGQuality.enabled=true;}});
	document.getElementById("conf-exp-type-png").addEventListener("change", (evt) => {if(evt.target.checked){toggleIsJPEG(false);exportJPEGQuality.enabled=false;}});
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
	renderButton.disabled = true;
}

function sleepMillis(ms) {
	return new Promise(resolve => {
		setTimeout(() => resolve(), ms);
	});
}

function downloadImageClicked() {
	var nm = outputImageName.value.trim();
	var ext = exportTypeJPEG.checked ? "jpg" : "png";
	if(nm.length == 0) {
		nm = "sheet." + ext;
	}else if(!nm.endsWith("." + ext)) {
		if(exportTypeJPEG.checked && nm.endsWith(".jpeg")) {
			nm = nm.substring(0, nm.length - 5);
		}
		nm = nm + "." + ext;
	}else if(!exportTypeJPEG.checked && nm.endsWith(".jpeg")) {
		nm = nm.substring(0, nm.length - 5) + "." + ext;
	}
	var lnk = document.createElement("a");
	if(exportTypeJPEG.checked) {
		var qlty = parseFloat(exportJPEGQuality.value);
		if(isNaN(qlty)) {
			qlty = 80.0;
		}else if(qlty <= 1.0) {
			qlty *= 100.0;
		}
		lnk.href = renderCanvas.toDataURL("image/jpeg", Math.min(qlty / 100.0, 1.0));
	}else {
		lnk.href = renderCanvas.toDataURL("image/png");
	}
	lnk.download = nm;
	lnk.click();
}

function downloadStylesheetClicked() {
	var ext = exportTypeJPEG.checked ? "jpg" : "png";
	var pfx = cssPrefixField.value.trim();
	if(pfx.length === 0) {
		pfx = "img";
	}
	
	var nm = outputImageName.value.trim();
	if(nm.length === 0) {
		nm = "sheet";
	}
	if(nm.endsWith("." + ext)) {
		nm = nm.substring(0, nm.length - ext.length - 1);
	}else if(!exportTypeJPEG.checked && nm.endsWith(".jpeg")) {
		nm = nm.substring(0, nm.length - 5);
	}
	nm = nm + ".css";
	
	var lnk = document.createElement("a");
	lnk.href = "data:text/css," + encodeURIComponent(stylesheetOutput.value);
	lnk.download = nm;
	lnk.click();
}

async function renderButtonClicked() {
	progressText.innerHTML = "Rendering...";
	downloadImageButton.disabled = true;
	downloadStylesheet.disabled = true;
	
	var ffac = parseFloat(zoomFactorField.value);
	if(isNaN(ffac)) {
		ffac = 1.0;
	}
	
	var mwidth = parseFloat(maxWidthField.value);
	if(isNaN(mwidth)) {
		mwidth = 0.0;
	}
	
	var mheight = parseFloat(maxHeightField.value);
	if(isNaN(mheight)) {
		mheight = 0.0;
	}
	
	var sortedList = [];
	for(var i = 0; i < currentLoadedImages.length; ++i) {
		sortedList.push(currentLoadedImages[i]);
	}
	sortedList.sort((a, b) => {return b.height - a.height;});
	var totalWidth = 0;
	var l = 0;
	for(var i = 0; i < sortedList.length; ++i) {
		var fac = ffac;
		var ww = sortedList[i].width;
		if(mwidth > 0.0) {
			fac = Math.min(fac, mwidth / ww);
		}
		var hh = sortedList[i].height;
		if(mheight > 0.0) {
			fac = Math.min(fac, mheight / hh);
		}
		totalWidth += sortedList[i].width * fac + 16;
		if(sortedList[i].height * fac > l) {
			l = sortedList[i].height * fac + 16;
		}
	}
	
	totalWidth = Math.pow(totalWidth * l, 0.53);
	var outWidth = 0;
	var outHeight = 0;
	var sortedMatrix = [];
	var sortedMatrixRowOffsets = [];
	var sortedMatrixRow = [];
	var cssLines = [];
	
	var pfx = cssPrefixField.value.trim();
	if(pfx.length === 0) {
		pfx = "img";
	}
	
	var ext = exportTypeJPEG.checked ? "jpg" : "png";
	var nm = outputImageName.value.trim();
	if(nm.length == 0) {
		nm = "sheet";
	}else if(nm.endsWith("." + ext)) {
		nm = nm.substring(0, nm.length - ext.length - 1);
	}else if(exportTypeJPEG.checked && nm.endsWith(".jpeg")) {
		nm = nm.substring(0, nm.length - 5);
	}
	
	var j = 0;
	var k = 0;
	for(var i = 0; i < sortedList.length; ++i) {
		var ii = sortedList[i];
		var fac = ffac;
		var ww = ii.width;
		if(mwidth > 0.0) {
			fac = Math.min(fac, mwidth / ww);
		}
		var hh = ii.height;
		if(mheight > 0.0) {
			fac = Math.min(fac, mheight / hh);
		}
		var hw = Math.floor(ww * fac) + 16;
		if(j + hw > totalWidth) {
			sortedMatrix.push(sortedMatrixRow);
			sortedMatrixRowOffsets.push(outHeight);
			sortedMatrixRow = [];
			if(j > outWidth) {
				outWidth = j;
			}
			outHeight += k;
			j = 0;
			k = 0;
		}
		sortedMatrixRow.push({x: j + 8, y: outHeight + 8, img: ii, w: Math.floor(ww * fac), h: Math.floor(hh * fac)});
		j += hw;
		var hi = Math.floor(hh * fac) + 16;
		if(hi > k) {
			k = hi;
		}
	}
	if(sortedMatrixRow.length > 0) {
		sortedMatrix.push(sortedMatrixRow);
		sortedMatrixRowOffsets.push(outHeight);
		if(j > outWidth) {
			outWidth = j;
		}
		outHeight += k;
	}
	var targetCanvasSize = Math.min(400.0 / outWidth, 1.0);
	renderCanvas.style.zoom = "" + targetCanvasSize;
	renderCanvas.width = outWidth;
	renderCanvas.height = outHeight;
	renderCanvasContext.clearRect(0, 0, outWidth, outHeight);
	var cnt = 0;
	for(var y = 0; y < sortedMatrix.length; ++y) {
		var yy = sortedMatrix[y];
		var yyy = sortedMatrixRowOffsets[y];
		for(var x = 0; x < yy.length; ++x) {
			var ii = sortedMatrix[y][x];
			progressText.innerHTML = "Rendering: " + ++cnt + " / " + sortedList.length;
			await sleepMillis(3);
			renderCanvasContext.drawImage(ii.img, 0, 0, ii.img.width, ii.img.height, ii.x, ii.y, ii.w, ii.h);
			
			renderCanvasContext.drawImage(ii.img, 0, 0, ii.img.width, 1, ii.x, ii.y - 1, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, 0, ii.img.width, 1, ii.x, ii.y - 2, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, 0, ii.img.width, 1, ii.x, ii.y - 3, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, 0, ii.img.width, 1, ii.x, ii.y - 4, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, 0, ii.img.width, 1, ii.x, ii.y - 5, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, 0, ii.img.width, 1, ii.x, ii.y - 6, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, 0, ii.img.width, 1, ii.x, ii.y - 7, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, 0, ii.img.width, 1, ii.x, ii.y - 8, ii.w, 1);
			
			renderCanvasContext.drawImage(ii.img, 0, 0, 1, 1, ii.x - 8, ii.y - 8, 8, 8);
			
			renderCanvasContext.drawImage(ii.img, 0, 0, 1, ii.img.height, ii.x - 1, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, 0, 0, 1, ii.img.height, ii.x - 2, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, 0, 0, 1, ii.img.height, ii.x - 3, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, 0, 0, 1, ii.img.height, ii.x - 4, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, 0, 0, 1, ii.img.height, ii.x - 5, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, 0, 0, 1, ii.img.height, ii.x - 6, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, 0, 0, 1, ii.img.height, ii.x - 7, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, 0, 0, 1, ii.img.height, ii.x - 8, ii.y, 1, ii.h);
			
			renderCanvasContext.drawImage(ii.img, 0, ii.img.height - 1, 1, 1, ii.x - 8, ii.y + ii.h, 8, 8);
			
			renderCanvasContext.drawImage(ii.img, 0, ii.img.height - 1, ii.img.width, 1, ii.x, ii.y + ii.h, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, ii.img.height - 1, ii.img.width, 1, ii.x, ii.y + ii.h + 1, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, ii.img.height - 1, ii.img.width, 1, ii.x, ii.y + ii.h + 2, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, ii.img.height - 1, ii.img.width, 1, ii.x, ii.y + ii.h + 3, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, ii.img.height - 1, ii.img.width, 1, ii.x, ii.y + ii.h + 4, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, ii.img.height - 1, ii.img.width, 1, ii.x, ii.y + ii.h + 5, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, ii.img.height - 1, ii.img.width, 1, ii.x, ii.y + ii.h + 6, ii.w, 1);
			renderCanvasContext.drawImage(ii.img, 0, ii.img.height - 1, ii.img.width, 1, ii.x, ii.y + ii.h + 7, ii.w, 1);
			
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, ii.img.height - 1, 1, 1, ii.x + ii.w, ii.y + ii.h, 8, 8);
			
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, 0, 1, ii.img.height, ii.x + ii.w, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, 0, 1, ii.img.height, ii.x + ii.w + 1, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, 0, 1, ii.img.height, ii.x + ii.w + 2, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, 0, 1, ii.img.height, ii.x + ii.w + 3, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, 0, 1, ii.img.height, ii.x + ii.w + 4, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, 0, 1, ii.img.height, ii.x + ii.w + 5, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, 0, 1, ii.img.height, ii.x + ii.w + 6, ii.y, 1, ii.h);
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, 0, 1, ii.img.height, ii.x + ii.w + 7, ii.y, 1, ii.h);
			
			renderCanvasContext.drawImage(ii.img, ii.img.width - 1, 0, 1, 1, ii.x + ii.w, ii.y - 8, 8, 8);
			
			cssLines.push(".sprite_" + pfx + "_" + ii.img.alt + "{width:" + ii.w + "px;height:" + ii.h + "px;" +
				"background-image:url(\"" + nm + "." + ext + "\");background-position:right " + (ii.x + ii.w) + "px top -" + ii.y + "px;}");
		}
	}
	
	stylesheetOutput.value = cssLines.join("\n");
	
	progressText.innerHTML = "Render Complete.";
	
	downloadImageButton.disabled = false;
	downloadStylesheet.disabled = false;
	
	downloadImageButton.innerText = "Download '" + nm + "." + ext + "'";
	downloadStylesheet.innerText = "Download '" + nm + ".css'";
}
