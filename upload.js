/**
 * 图片上传插件
 */
(function () {

var global = this;

var Tools = {
    extend: function (a, b) {
        var k;
        for (k in b) {
            a[k] = b[k]
        }
        return a
    },
    rotate: function (canvasTarget, image, w, h, orientation) {
        if (orientation == 6 || orientation == 8) {
            canvasTarget.width = h;
            canvasTarget.height = w
        } else {
            canvasTarget.width = w;
            canvasTarget.height = h
        }
        var ctxtarget = canvasTarget.getContext("2d");
        if (orientation == 6) {
            ctxtarget.translate(h, 0);
            ctxtarget.rotate(Math.PI / 2)
        } else {
            if (orientation == 8) {
                ctxtarget.translate(0, w);
                ctxtarget.rotate(270 * Math.PI / 180)
            } else {
                if (orientation == 3) {
                    ctxtarget.translate(w, h);
                    ctxtarget.rotate(Math.PI)
                }
            }
        }
    ctxtarget.drawImage(image, 0, 0)
    }
};

var CUI = function(params) {
    var def = {
        maxWidth : 0,
        maxHeight : 0,
        imageQuality: 100,
    };
    this.params = Tools.extend(def, params);
}

CUI.prototype.set_file_name = function(filename) {
    
}

CUI.prototype.upload = function() {

};

CUI.prototype.compress = function() {

}

}).call(this);

(function () {
    function detectSubsampling(img) {
        var iw = img.naturalWidth,
            ih = img.naturalHeight;
        if (iw * ih > 1024 * 1024) {
            var canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, -iw + 1, 0);
            return ctx.getImageData(0, 0, 1, 1).data[3] === 0
        } else {
            return false
        }
    }
    function detectVerticalSquash(img, iw, ih) {
        var canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = ih;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, 1, ih).data;
        var sy = 0;
        var ey = ih;
        var py = ih;
        while (py > sy) {
            var alpha = data[(py - 1) * 4 + 3];
            if (alpha === 0) {
                ey = py
            } else {
                sy = py
            }
            py = (ey + sy) >> 1
        }
        var ratio = (py / ih);
        return (ratio === 0) ? 1 : ratio
    }
    function renderImageToDataURL(img, options, doSquash) {
        var canvas = document.createElement("canvas");
        renderImageToCanvas(img, canvas, options, doSquash);
        return canvas.toDataURL("image/jpeg", options.quality || 0.8)
    }
    function renderImageToCanvas(img, canvas, options, doSquash) {
        var iw = img.naturalWidth,
            ih = img.naturalHeight;
        var width = options.width,
            height = options.height;
        var ctx = canvas.getContext("2d");
        ctx.save();
        transformCoordinate(canvas, width, height, options.orientation);
        var subsampled = detectSubsampling(img);
        if (subsampled) {
            iw /= 2;
            ih /= 2
        }
        var d = 1024;
        var tmpCanvas = document.createElement("canvas");
        tmpCanvas.width = tmpCanvas.height = d;
        var tmpCtx = tmpCanvas.getContext("2d");
        var vertSquashRatio = doSquash ? detectVerticalSquash(img, iw, ih) : 1;
        var dw = Math.ceil(d * width / iw);
        var dh = Math.ceil(d * height / ih / vertSquashRatio);
        var sy = 0;
        var dy = 0;
        while (sy < ih) {
            var sx = 0;
            var dx = 0;
            while (sx < iw) {
                tmpCtx.clearRect(0, 0, d, d);
                tmpCtx.drawImage(img, -sx, -sy);
                ctx.drawImage(tmpCanvas, 0, 0, d, d, dx, dy, dw, dh);
                sx += d;
                dx += dw
            }
            sy += d;
            dy += dh
        }
        ctx.restore();
        tmpCanvas = tmpCtx = null
    }
    function transformCoordinate(canvas, width, height, orientation) {
        switch (orientation) {
        case 5:
        case 6:
        case 7:
        case 8:
            canvas.width = height;
            canvas.height = width;
            break;
        default:
            canvas.width = width;
            canvas.height = height
        }
        var ctx = canvas.getContext("2d");
        switch (orientation) {
        case 2:
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
            break;
        case 3:
            ctx.translate(width, height);
            ctx.rotate(Math.PI);
            break;
        case 4:
            ctx.translate(0, height);
            ctx.scale(1, -1);
            break;
        case 5:
            ctx.rotate(0.5 * Math.PI);
            ctx.scale(1, -1);
            break;
        case 6:
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(0, -height);
            break;
        case 7:
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(width, -height);
            ctx.scale(-1, 1);
            break;
        case 8:
            ctx.rotate(-0.5 * Math.PI);
            ctx.translate(-width, 0);
            break;
        default:
            break
        }
    }
    function MegaPixImage(srcImage) {
        if (window.Blob && srcImage instanceof Blob) {
            var img = new Image();
            var URL = window.URL && window.URL.createObjectURL ? window.URL : window.webkitURL && window.webkitURL.createObjectURL ?
                window.webkitURL : null;
            if (!URL) {
                throw Error("No createObjectURL function found to create blob url")
            }
            img.src = URL.createObjectURL(srcImage);
            this.blob = srcImage;
            srcImage = img
        }
        if (!srcImage.naturalWidth && !srcImage.naturalHeight) {
            var _this = this;
            srcImage.onload = function () {
                var listeners = _this.imageLoadListeners;
                if (listeners) {
                    _this.imageLoadListeners = null;
                    for (var i = 0, len = listeners.length; i < len; i++) {
                        listeners[i]()
                    }
                }
            };
            this.imageLoadListeners = []
        }
        this.srcImage = srcImage
    }
    MegaPixImage.prototype.render = function (target, options) {
        if (this.imageLoadListeners) {
            var _this = this;
            this.imageLoadListeners.push(function () {
                _this.render(target, options)
            });
            return
        }
        options = options || {};
        var imgWidth = this.srcImage.naturalWidth,
            imgHeight = this.srcImage.naturalHeight,
            width = options.width,
            height = options.height,
            maxWidth = options.maxWidth,
            maxHeight = options.maxHeight,
            doSquash = !this.blob || this.blob.type === "image/jpeg";
        if (width && !height) {
            height = (imgHeight * width / imgWidth) << 0
        } else {
            if (height && !width) {
                width = (imgWidth * height / imgHeight) << 0
            } else {
                width = imgWidth;
                height = imgHeight
            }
        } if (maxWidth && width > maxWidth) {
            width = maxWidth;
            height = (imgHeight * width / imgWidth) << 0
        }
        if (maxHeight && height > maxHeight) {
            height = maxHeight;
            width = (imgWidth * height / imgHeight) << 0
        }
        var opt = {
            width: width,
            height: height
        };
        for (var k in options) {
            opt[k] = options[k]
        }
        var tagName = target.tagName.toLowerCase();
        if (tagName === "img") {
            target.src = renderImageToDataURL(this.srcImage, opt, doSquash)
        } else {
            if (tagName === "canvas") {
                renderImageToCanvas(this.srcImage, target, opt, doSquash)
            }
        } if (typeof this.onrender === "function") {
            this.onrender(target)
        }
    };
    if (typeof define === "function" && define.amd) {
        define([], function () {
            return MegaPixImage
        })
    } else {
        this.MegaPixImage = MegaPixImage
    }
})();
var EXIF = (function () {
    var debug = false;
    var ExifTags = {
        36864: "ExifVersion",
        40960: "FlashpixVersion",
        40961: "ColorSpace",
        40962: "PixelXDimension",
        40963: "PixelYDimension",
        37121: "ComponentsConfiguration",
        37122: "CompressedBitsPerPixel",
        37500: "MakerNote",
        37510: "UserComment",
        40964: "RelatedSoundFile",
        36867: "DateTimeOriginal",
        36868: "DateTimeDigitized",
        37520: "SubsecTime",
        37521: "SubsecTimeOriginal",
        37522: "SubsecTimeDigitized",
        33434: "ExposureTime",
        33437: "FNumber",
        34850: "ExposureProgram",
        34852: "SpectralSensitivity",
        34855: "ISOSpeedRatings",
        34856: "OECF",
        37377: "ShutterSpeedValue",
        37378: "ApertureValue",
        37379: "BrightnessValue",
        37380: "ExposureBias",
        37381: "MaxApertureValue",
        37382: "SubjectDistance",
        37383: "MeteringMode",
        37384: "LightSource",
        37385: "Flash",
        37396: "SubjectArea",
        37386: "FocalLength",
        41483: "FlashEnergy",
        41484: "SpatialFrequencyResponse",
        41486: "FocalPlaneXResolution",
        41487: "FocalPlaneYResolution",
        41488: "FocalPlaneResolutionUnit",
        41492: "SubjectLocation",
        41493: "ExposureIndex",
        41495: "SensingMethod",
        41728: "FileSource",
        41729: "SceneType",
        41730: "CFAPattern",
        41985: "CustomRendered",
        41986: "ExposureMode",
        41987: "WhiteBalance",
        41988: "DigitalZoomRation",
        41989: "FocalLengthIn35mmFilm",
        41990: "SceneCaptureType",
        41991: "GainControl",
        41992: "Contrast",
        41993: "Saturation",
        41994: "Sharpness",
        41995: "DeviceSettingDescription",
        41996: "SubjectDistanceRange",
        40965: "InteroperabilityIFDPointer",
        42016: "ImageUniqueID"
    };
    var TiffTags = {
        256: "ImageWidth",
        257: "ImageHeight",
        34665: "ExifIFDPointer",
        34853: "GPSInfoIFDPointer",
        40965: "InteroperabilityIFDPointer",
        258: "BitsPerSample",
        259: "Compression",
        262: "PhotometricInterpretation",
        274: "Orientation",
        277: "SamplesPerPixel",
        284: "PlanarConfiguration",
        530: "YCbCrSubSampling",
        531: "YCbCrPositioning",
        282: "XResolution",
        283: "YResolution",
        296: "ResolutionUnit",
        273: "StripOffsets",
        278: "RowsPerStrip",
        279: "StripByteCounts",
        513: "JPEGInterchangeFormat",
        514: "JPEGInterchangeFormatLength",
        301: "TransferFunction",
        318: "WhitePoint",
        319: "PrimaryChromaticities",
        529: "YCbCrCoefficients",
        532: "ReferenceBlackWhite",
        306: "DateTime",
        270: "ImageDescription",
        271: "Make",
        272: "Model",
        305: "Software",
        315: "Artist",
        33432: "Copyright"
    };
    var GPSTags = {
        0: "GPSVersionID",
        1: "GPSLatitudeRef",
        2: "GPSLatitude",
        3: "GPSLongitudeRef",
        4: "GPSLongitude",
        5: "GPSAltitudeRef",
        6: "GPSAltitude",
        7: "GPSTimeStamp",
        8: "GPSSatellites",
        9: "GPSStatus",
        10: "GPSMeasureMode",
        11: "GPSDOP",
        12: "GPSSpeedRef",
        13: "GPSSpeed",
        14: "GPSTrackRef",
        15: "GPSTrack",
        16: "GPSImgDirectionRef",
        17: "GPSImgDirection",
        18: "GPSMapDatum",
        19: "GPSDestLatitudeRef",
        20: "GPSDestLatitude",
        21: "GPSDestLongitudeRef",
        22: "GPSDestLongitude",
        23: "GPSDestBearingRef",
        24: "GPSDestBearing",
        25: "GPSDestDistanceRef",
        26: "GPSDestDistance",
        27: "GPSProcessingMethod",
        28: "GPSAreaInformation",
        29: "GPSDateStamp",
        30: "GPSDifferential"
    };
    var StringValues = {
        ExposureProgram: {
            0: "Not defined",
            1: "Manual",
            2: "Normal program",
            3: "Aperture priority",
            4: "Shutter priority",
            5: "Creative program",
            6: "Action program",
            7: "Portrait mode",
            8: "Landscape mode"
        },
        MeteringMode: {
            0: "Unknown",
            1: "Average",
            2: "CenterWeightedAverage",
            3: "Spot",
            4: "MultiSpot",
            5: "Pattern",
            6: "Partial",
            255: "Other"
        },
        LightSource: {
            0: "Unknown",
            1: "Daylight",
            2: "Fluorescent",
            3: "Tungsten (incandescent light)",
            4: "Flash",
            9: "Fine weather",
            10: "Cloudy weather",
            11: "Shade",
            12: "Daylight fluorescent (D 5700 - 7100K)",
            13: "Day white fluorescent (N 4600 - 5400K)",
            14: "Cool white fluorescent (W 3900 - 4500K)",
            15: "White fluorescent (WW 3200 - 3700K)",
            17: "Standard light A",
            18: "Standard light B",
            19: "Standard light C",
            20: "D55",
            21: "D65",
            22: "D75",
            23: "D50",
            24: "ISO studio tungsten",
            255: "Other"
        },
        Flash: {
            0: "Flash did not fire",
            1: "Flash fired",
            5: "Strobe return light not detected",
            7: "Strobe return light detected",
            9: "Flash fired, compulsory flash mode",
            13: "Flash fired, compulsory flash mode, return light not detected",
            15: "Flash fired, compulsory flash mode, return light detected",
            16: "Flash did not fire, compulsory flash mode",
            24: "Flash did not fire, auto mode",
            25: "Flash fired, auto mode",
            29: "Flash fired, auto mode, return light not detected",
            31: "Flash fired, auto mode, return light detected",
            32: "No flash function",
            65: "Flash fired, red-eye reduction mode",
            69: "Flash fired, red-eye reduction mode, return light not detected",
            71: "Flash fired, red-eye reduction mode, return light detected",
            73: "Flash fired, compulsory flash mode, red-eye reduction mode",
            77: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
            79: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
            89: "Flash fired, auto mode, red-eye reduction mode",
            93: "Flash fired, auto mode, return light not detected, red-eye reduction mode",
            95: "Flash fired, auto mode, return light detected, red-eye reduction mode"
        },
        SensingMethod: {
            1: "Not defined",
            2: "One-chip color area sensor",
            3: "Two-chip color area sensor",
            4: "Three-chip color area sensor",
            5: "Color sequential area sensor",
            7: "Trilinear sensor",
            8: "Color sequential linear sensor"
        },
        SceneCaptureType: {
            0: "Standard",
            1: "Landscape",
            2: "Portrait",
            3: "Night scene"
        },
        SceneType: {
            1: "Directly photographed"
        },
        CustomRendered: {
            0: "Normal process",
            1: "Custom process"
        },
        WhiteBalance: {
            0: "Auto white balance",
            1: "Manual white balance"
        },
        GainControl: {
            0: "None",
            1: "Low gain up",
            2: "High gain up",
            3: "Low gain down",
            4: "High gain down"
        },
        Contrast: {
            0: "Normal",
            1: "Soft",
            2: "Hard"
        },
        Saturation: {
            0: "Normal",
            1: "Low saturation",
            2: "High saturation"
        },
        Sharpness: {
            0: "Normal",
            1: "Soft",
            2: "Hard"
        },
        SubjectDistanceRange: {
            0: "Unknown",
            1: "Macro",
            2: "Close view",
            3: "Distant view"
        },
        FileSource: {
            3: "DSC"
        },
        Components: {
            0: "",
            1: "Y",
            2: "Cb",
            3: "Cr",
            4: "R",
            5: "G",
            6: "B"
        }
    };
 
    function addEvent(element, event, handler) {
        if (element.addEventListener) {
            element.addEventListener(event, handler, false)
        } else {
            if (element.attachEvent) {
                element.attachEvent("on" + event, handler)
            }
        }
    }
    function imageHasData(img) {
        return !!(img.exifdata)
    }
    function getImageData(img, callback) {
        function handleBinaryFile(binFile) {
            var data = findEXIFinJPEG(binFile);
            img.exifdata = data || {};
            if (callback) {
                callback.call(img)
            }
        }
        if (img instanceof Image || img instanceof HTMLImageElement) {
            BinaryAjax(img.src, function (http) {
                handleBinaryFile(http.binaryResponse)
            })
        } else {
            if (window.FileReader && img instanceof window.File) {
                var fileReader = new FileReader();
                fileReader.onload = function (e) {
                    if (debug) {
                        console.log("Got file of length " + e.target.result.byteLength)
                    }
                    handleBinaryFile(e.target.result)
                };
                fileReader.readAsArrayBuffer(img)
            }
        }
    }
    function findEXIFinJPEG(file) {
        var dataView = new DataView(file);
        if (debug) {
            console.log("Got file of length " + file.byteLength)
        }
        if ((dataView.getUint8(0) != 255) || (dataView.getUint8(1) != 216)) {
            if (debug) {
                console.log("Not a valid JPEG")
            }
            return false
        }
        var offset = 2,
            length = file.byteLength,
            marker;
        while (offset < length) {
            if (dataView.getUint8(offset) != 255) {
                if (debug) {
                    console.log("Not a valid marker at offset " + offset + ", found: " + file.getByteAt(offset))
                }
                return false
            }
            marker = dataView.getUint8(offset + 1);
            if (debug) {
                console.log(marker)
            }
            if (marker == 225) {
                if (debug) {
                    console.log("Found 0xFFE1 marker")
                }
                return readEXIFData(dataView, offset + 4, dataView.getUint16(offset + 2) - 2)
            } else {
                offset += 2 + dataView.getUint16(offset + 2)
            }
        }
    }
    function readTags(file, tiffStart, dirStart, strings, bigEnd) {
        var entries = file.getUint16(dirStart, !bigEnd),
            tags = {}, entryOffset, tag, i;
        for (i = 0; i < entries; i++) {
            entryOffset = dirStart + i * 12 + 2;
            tag = strings[file.getUint16(entryOffset, !bigEnd)];
            if (!tag && debug) {
                console.log("Unknown tag: " + file.getUint16(entryOffset, !bigEnd))
            }
            tags[tag] = readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd)
        }
        return tags
    }
    function readTagValue(file, entryOffset, tiffStart, dirStart, bigEnd) {
        var type = file.getUint16(entryOffset + 2, !bigEnd),
            numValues = file.getUint32(entryOffset + 4, !bigEnd),
            valueOffset = file.getUint32(entryOffset + 8, !bigEnd) + tiffStart,
            offset, vals, val, n, numerator, denominator;
        switch (type) {
        case 1:
        case 7:
            if (numValues == 1) {
                return file.getUint8(entryOffset + 8, !bigEnd)
            } else {
                offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                vals = [];
                for (n = 0; n < numValues; n++) {
                    vals[n] = file.getUint8(offset + n)
                }
                return vals
            }
        case 2:
            offset = numValues > 4 ? valueOffset : (entryOffset + 8);
            return getStringFromDB(file, offset, numValues - 1);
        case 3:
            if (numValues == 1) {
                return file.getUint16(entryOffset + 8, !bigEnd)
            } else {
                offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                vals = [];
                for (n = 0; n < numValues; n++) {
                    vals[n] = file.getUint16(offset + 2 * n, !bigEnd)
                }
                return vals
            }
        case 4:
            if (numValues == 1) {
                return file.getUint32(entryOffset + 8, !bigEnd)
            } else {
                vals = [];
                for (var n = 0; n < numValues; n++) {
                    vals[n] = file.getUint32(valueOffset + 4 * n, !bigEnd)
                }
                return vals
            }
        case 5:
            if (numValues == 1) {
                numerator = file.getUint32(valueOffset, !bigEnd);
                denominator = file.getUint32(valueOffset + 4, !bigEnd);
                val = new Number(numerator / denominator);
                val.numerator = numerator;
                val.denominator = denominator;
                return val
            } else {
                vals = [];
                for (n = 0; n < numValues; n++) {
                    numerator = file.getUint32(valueOffset + 8 * n, !bigEnd);
                    denominator = file.getUint32(valueOffset + 4 + 8 * n, !bigEnd);
                    vals[n] = new Number(numerator / denominator);
                    vals[n].numerator = numerator;
                    vals[n].denominator = denominator
                }
                return vals
            }
        case 9:
            if (numValues == 1) {
                return file.getInt32(entryOffset + 8, !bigEnd)
            } else {
                vals = [];
                for (n = 0; n < numValues; n++) {
                    vals[n] = file.getInt32(valueOffset + 4 * n, !bigEnd)
                }
                return vals
            }
        case 10:
            if (numValues == 1) {
                return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset + 4, !bigEnd)
            } else {
                vals = [];
                for (n = 0; n < numValues; n++) {
                    vals[n] = file.getInt32(valueOffset + 8 * n, !bigEnd) / file.getInt32(valueOffset + 4 + 8 * n, !
                        bigEnd)
                }
                return vals
            }
        }
    }
    function getStringFromDB(buffer, start, length) {
        var outstr = "";
        for (n = start; n < start + length; n++) {
            outstr += String.fromCharCode(buffer.getUint8(n))
        }
        return outstr
    }
    function readEXIFData(file, start) {
        if (getStringFromDB(file, start, 4) != "Exif") {
            if (debug) {
                console.log("Not valid EXIF data! " + getStringFromDB(file, start, 4))
            }
            return false
        }
        var bigEnd, tags, tag, exifData, gpsData, tiffOffset = start + 6;
        if (file.getUint16(tiffOffset) == 18761) {
            bigEnd = false
        } else {
            if (file.getUint16(tiffOffset) == 19789) {
                bigEnd = true
            } else {
                if (debug) {
                    console.log("Not valid TIFF data! (no 0x4949 or 0x4D4D)")
                }
                return false
            }
        } if (file.getUint16(tiffOffset + 2, !bigEnd) != 42) {
            if (debug) {
                console.log("Not valid TIFF data! (no 0x002A)")
            }
            return false
        }
        if (file.getUint32(tiffOffset + 4, !bigEnd) != 8) {
            if (debug) {
                console.log("Not valid TIFF data! (First offset not 8)", file.getUint16(tiffOffset + 4, !bigEnd))
            }
            return false
        }
        tags = readTags(file, tiffOffset, tiffOffset + 8, TiffTags, bigEnd);
        if (tags.ExifIFDPointer) {
            exifData = readTags(file, tiffOffset, tiffOffset + tags.ExifIFDPointer, ExifTags, bigEnd);
            for (tag in exifData) {
                switch (tag) {
                case "LightSource":
                case "Flash":
                case "MeteringMode":
                case "ExposureProgram":
                case "SensingMethod":
                case "SceneCaptureType":
                case "SceneType":
                case "CustomRendered":
                case "WhiteBalance":
                case "GainControl":
                case "Contrast":
                case "Saturation":
                case "Sharpness":
                case "SubjectDistanceRange":
                case "FileSource":
                    exifData[tag] = StringValues[tag][exifData[tag]];
                    break;
                case "ExifVersion":
                case "FlashpixVersion":
                    exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[
                        tag][3]);
                    break;
                case "ComponentsConfiguration":
                    exifData[tag] = StringValues.Components[exifData[tag][0]] + StringValues.Components[exifData[tag][1]] +
                        StringValues.Components[exifData[tag][2]] + StringValues.Components[exifData[tag][3]];
                    break
                }
                tags[tag] = exifData[tag]
            }
        }
        if (tags.GPSInfoIFDPointer) {
            gpsData = readTags(file, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, GPSTags, bigEnd);
            for (tag in gpsData) {
                switch (tag) {
                case "GPSVersionID":
                    gpsData[tag] = gpsData[tag][0] + "." + gpsData[tag][1] + "." + gpsData[tag][2] + "." + gpsData[tag][
                            3];
                    break
                }
                tags[tag] = gpsData[tag]
            }
        }
        return tags
    }
    function getData(img, callback) {
        if ((img instanceof Image || img instanceof HTMLImageElement) && !img.complete) {
            return false
        }
        if (!imageHasData(img)) {
            getImageData(img, callback)
        } else {
            if (callback) {
                callback.call(img)
            }
        }
        return true
    }
    function getTag(img, tag) {
        if (!imageHasData(img)) {
            return
        }
        return img.exifdata[tag]
    }
    function getAllTags(img) {
        if (!imageHasData(img)) {
            return {}
        }
        var a, data = img.exifdata,
            tags = {};
        for (a in data) {
            if (data.hasOwnProperty(a)) {
                tags[a] = data[a]
            }
        }
        return tags
    }
    function pretty(img) {
        if (!imageHasData(img)) {
            return ""
        }
        var a, data = img.exifdata,
            strPretty = "";
        for (a in data) {
            if (data.hasOwnProperty(a)) {
                if (typeof data[a] == "object") {
                    if (data[a] instanceof Number) {
                        strPretty += a + " : " + data[a] + " [" + data[a].numerator + "/" + data[a].denominator +
                            "]\r\n"
                    } else {
                        strPretty += a + " : [" + data[a].length + " values]\r\n"
                    }
                } else {
                    strPretty += a + " : " + data[a] + "\r\n"
                }
            }
        }
        return strPretty
    }
    function readFromBinaryFile(file) {
        return findEXIFinJPEG(file)
    }
    return {
        readFromBinaryFile: readFromBinaryFile,
        pretty: pretty,
        getTag: getTag,
        getAllTags: getAllTags,
        getData: getData,
        Tags: ExifTags,
        TiffTags: TiffTags,
        GPSTags: GPSTags,
        StringValues: StringValues
    }
})();
 
function JPEGEncoder(quality) {
    var self = this;
    var fround = Math.round;
    var ffloor = Math.floor;
    var YTable = new Array(64);
    var UVTable = new Array(64);
    var fdtbl_Y = new Array(64);
    var fdtbl_UV = new Array(64);
    var YDC_HT;
    var UVDC_HT;
    var YAC_HT;
    var UVAC_HT;
    var bitcode = new Array(65535);
    var category = new Array(65535);
    var outputfDCTQuant = new Array(64);
    var DU = new Array(64);
    var byteout = [];
    var bytenew = 0;
    var bytepos = 7;
    var YDU = new Array(64);
    var UDU = new Array(64);
    var VDU = new Array(64);
    var clt = new Array(256);
    var RGB_YUV_TABLE = new Array(2048);
    var currentQuality;
    var ZigZag = [0, 1, 5, 6, 14, 15, 27, 28, 2, 4, 7, 13, 16, 26, 29, 42, 3, 8, 12, 17, 25, 30, 41, 43, 9, 11, 18, 24,
            31, 40, 44, 53, 10, 19, 23, 32, 39, 45, 52, 54, 20, 22, 33, 38, 46, 51, 55, 60, 21, 34, 37, 47, 50, 56, 59,
            61, 35, 36, 48, 49, 57, 58, 62, 63];
    var std_dc_luminance_nrcodes = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
    var std_dc_luminance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var std_ac_luminance_nrcodes = [0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 125];
    var std_ac_luminance_values = [1, 2, 3, 0, 4, 17, 5, 18, 33, 49, 65, 6, 19, 81, 97, 7, 34, 113, 20, 50, 129, 145,
            161, 8, 35, 66, 177, 193, 21, 82, 209, 240, 36, 51, 98, 114, 130, 9, 10, 22, 23, 24, 25, 26, 37, 38, 39, 40,
            41, 42, 52, 53, 54, 55, 56, 57, 58, 67, 68, 69, 70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89, 90, 99, 100,
            101, 102, 103, 104, 105, 106, 115, 116, 117, 118, 119, 120, 121, 122, 131, 132, 133, 134, 135, 136, 137,
            138, 146, 147, 148, 149, 150, 151, 152, 153, 154, 162, 163, 164, 165, 166, 167, 168, 169, 170, 178, 179,
            180, 181, 182, 183, 184, 185, 186, 194, 195, 196, 197, 198, 199, 200, 201, 202, 210, 211, 212, 213, 214,
            215, 216, 217, 218, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 241, 242, 243, 244, 245, 246, 247,
            248, 249, 250];
    var std_dc_chrominance_nrcodes = [0, 0, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
    var std_dc_chrominance_values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    var std_ac_chrominance_nrcodes = [0, 0, 2, 1, 2, 4, 4, 3, 4, 7, 5, 4, 4, 0, 1, 2, 119];
    var std_ac_chrominance_values = [0, 1, 2, 3, 17, 4, 5, 33, 49, 6, 18, 65, 81, 7, 97, 113, 19, 34, 50, 129, 8, 20,
            66, 145, 161, 177, 193, 9, 35, 51, 82, 240, 21, 98, 114, 209, 10, 22, 36, 52, 225, 37, 241, 23, 24, 25, 26,
            38, 39, 40, 41, 42, 53, 54, 55, 56, 57, 58, 67, 68, 69, 70, 71, 72, 73, 74, 83, 84, 85, 86, 87, 88, 89, 90,
            99, 100, 101, 102, 103, 104, 105, 106, 115, 116, 117, 118, 119, 120, 121, 122, 130, 131, 132, 133, 134, 135,
            136, 137, 138, 146, 147, 148, 149, 150, 151, 152, 153, 154, 162, 163, 164, 165, 166, 167, 168, 169, 170,
            178, 179, 180, 181, 182, 183, 184, 185, 186, 194, 195, 196, 197, 198, 199, 200, 201, 202, 210, 211, 212,
            213, 214, 215, 216, 217, 218, 226, 227, 228, 229, 230, 231, 232, 233, 234, 242, 243, 244, 245, 246, 247,
            248, 249, 250];
 
    function initQuantTables(sf) {
        var YQT = [16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16, 24, 40, 57, 69, 56, 14,
                17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109, 103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64,
                78, 87, 103, 121, 120, 101, 72, 92, 95, 98, 112, 100, 103, 99];
        for (var i = 0; i < 64; i++) {
            var t = ffloor((YQT[i] * sf + 50) / 100);
            if (t < 1) {
                t = 1
            } else {
                if (t > 255) {
                    t = 255
                }
            }
            YTable[ZigZag[i]] = t
        }
        var UVQT = [17, 18, 24, 47, 99, 99, 99, 99, 18, 21, 26, 66, 99, 99, 99, 99, 24, 26, 56, 99, 99, 99, 99, 99, 47,
                66, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99,
                99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99, 99];
        for (var j = 0; j < 64; j++) {
            var u = ffloor((UVQT[j] * sf + 50) / 100);
            if (u < 1) {
                u = 1
            } else {
                if (u > 255) {
                    u = 255
                }
            }
            UVTable[ZigZag[j]] = u
        }
        var aasf = [1, 1.387039845, 1.306562965, 1.175875602, 1, 0.785694958, 0.5411961, 0.275899379];
        var k = 0;
        for (var row = 0; row < 8; row++) {
            for (var col = 0; col < 8; col++) {
                fdtbl_Y[k] = (1 / (YTable[ZigZag[k]] * aasf[row] * aasf[col] * 8));
                fdtbl_UV[k] = (1 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8));
                k++
            }
        }
    }
    function computeHuffmanTbl(nrcodes, std_table) {
        var codevalue = 0;
        var pos_in_table = 0;
        var HT = new Array();
        for (var k = 1; k <= 16; k++) {
            for (var j = 1; j <= nrcodes[k]; j++) {
                HT[std_table[pos_in_table]] = [];
                HT[std_table[pos_in_table]][0] = codevalue;
                HT[std_table[pos_in_table]][1] = k;
                pos_in_table++;
                codevalue++
            }
            codevalue *= 2
        }
        return HT
    }
    function initHuffmanTbl() {
        YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes, std_dc_luminance_values);
        UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes, std_dc_chrominance_values);
        YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes, std_ac_luminance_values);
        UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes, std_ac_chrominance_values)
    }
    function initCategoryNumber() {
        var nrlower = 1;
        var nrupper = 2;
        for (var cat = 1; cat <= 15; cat++) {
            for (var nr = nrlower; nr < nrupper; nr++) {
                category[32767 + nr] = cat;
                bitcode[32767 + nr] = [];
                bitcode[32767 + nr][1] = cat;
                bitcode[32767 + nr][0] = nr
            }
            for (var nrneg = -(nrupper - 1); nrneg <= -nrlower; nrneg++) {
                category[32767 + nrneg] = cat;
                bitcode[32767 + nrneg] = [];
                bitcode[32767 + nrneg][1] = cat;
                bitcode[32767 + nrneg][0] = nrupper - 1 + nrneg
            }
            nrlower <<= 1;
            nrupper <<= 1
        }
    }
    function initRGBYUVTable() {
        for (var i = 0; i < 256; i++) {
            RGB_YUV_TABLE[i] = 19595 * i;
            RGB_YUV_TABLE[(i + 256) >> 0] = 38470 * i;
            RGB_YUV_TABLE[(i + 512) >> 0] = 7471 * i + 32768;
            RGB_YUV_TABLE[(i + 768) >> 0] = -11059 * i;
            RGB_YUV_TABLE[(i + 1024) >> 0] = -21709 * i;
            RGB_YUV_TABLE[(i + 1280) >> 0] = 32768 * i + 8421375;
            RGB_YUV_TABLE[(i + 1536) >> 0] = -27439 * i;
            RGB_YUV_TABLE[(i + 1792) >> 0] = -5329 * i
        }
    }
    function writeBits(bs) {
        var value = bs[0];
        var posval = bs[1] - 1;
        while (posval >= 0) {
            if (value & (1 << posval)) {
                bytenew |= (1 << bytepos)
            }
            posval--;
            bytepos--;
            if (bytepos < 0) {
                if (bytenew == 255) {
                    writeByte(255);
                    writeByte(0)
                } else {
                    writeByte(bytenew)
                }
                bytepos = 7;
                bytenew = 0
            }
        }
    }
    function writeByte(value) {
        byteout.push(clt[value])
    }
    function writeWord(value) {
        writeByte((value >> 8) & 255);
        writeByte((value) & 255)
    }
    function fDCTQuant(data, fdtbl) {
        var d0, d1, d2, d3, d4, d5, d6, d7;
        var dataOff = 0;
        var i;
        const I8 = 8;
        const I64 = 64;
        for (i = 0; i < I8; ++i) {
            d0 = data[dataOff];
            d1 = data[dataOff + 1];
            d2 = data[dataOff + 2];
            d3 = data[dataOff + 3];
            d4 = data[dataOff + 4];
            d5 = data[dataOff + 5];
            d6 = data[dataOff + 6];
            d7 = data[dataOff + 7];
            var tmp0 = d0 + d7;
            var tmp7 = d0 - d7;
            var tmp1 = d1 + d6;
            var tmp6 = d1 - d6;
            var tmp2 = d2 + d5;
            var tmp5 = d2 - d5;
            var tmp3 = d3 + d4;
            var tmp4 = d3 - d4;
            var tmp10 = tmp0 + tmp3;
            var tmp13 = tmp0 - tmp3;
            var tmp11 = tmp1 + tmp2;
            var tmp12 = tmp1 - tmp2;
            data[dataOff] = tmp10 + tmp11;
            data[dataOff + 4] = tmp10 - tmp11;
            var z1 = (tmp12 + tmp13) * 0.707106781;
            data[dataOff + 2] = tmp13 + z1;
            data[dataOff + 6] = tmp13 - z1;
            tmp10 = tmp4 + tmp5;
            tmp11 = tmp5 + tmp6;
            tmp12 = tmp6 + tmp7;
            var z5 = (tmp10 - tmp12) * 0.382683433;
            var z2 = 0.5411961 * tmp10 + z5;
            var z4 = 1.306562965 * tmp12 + z5;
            var z3 = tmp11 * 0.707106781;
            var z11 = tmp7 + z3;
            var z13 = tmp7 - z3;
            data[dataOff + 5] = z13 + z2;
            data[dataOff + 3] = z13 - z2;
            data[dataOff + 1] = z11 + z4;
            data[dataOff + 7] = z11 - z4;
            dataOff += 8
        }
        dataOff = 0;
        for (i = 0; i < I8; ++i) {
            d0 = data[dataOff];
            d1 = data[dataOff + 8];
            d2 = data[dataOff + 16];
            d3 = data[dataOff + 24];
            d4 = data[dataOff + 32];
            d5 = data[dataOff + 40];
            d6 = data[dataOff + 48];
            d7 = data[dataOff + 56];
            var tmp0p2 = d0 + d7;
            var tmp7p2 = d0 - d7;
            var tmp1p2 = d1 + d6;
            var tmp6p2 = d1 - d6;
            var tmp2p2 = d2 + d5;
            var tmp5p2 = d2 - d5;
            var tmp3p2 = d3 + d4;
            var tmp4p2 = d3 - d4;
            var tmp10p2 = tmp0p2 + tmp3p2;
            var tmp13p2 = tmp0p2 - tmp3p2;
            var tmp11p2 = tmp1p2 + tmp2p2;
            var tmp12p2 = tmp1p2 - tmp2p2;
            data[dataOff] = tmp10p2 + tmp11p2;
            data[dataOff + 32] = tmp10p2 - tmp11p2;
            var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781;
            data[dataOff + 16] = tmp13p2 + z1p2;
            data[dataOff + 48] = tmp13p2 - z1p2;
            tmp10p2 = tmp4p2 + tmp5p2;
            tmp11p2 = tmp5p2 + tmp6p2;
            tmp12p2 = tmp6p2 + tmp7p2;
            var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433;
            var z2p2 = 0.5411961 * tmp10p2 + z5p2;
            var z4p2 = 1.306562965 * tmp12p2 + z5p2;
            var z3p2 = tmp11p2 * 0.707106781;
            var z11p2 = tmp7p2 + z3p2;
            var z13p2 = tmp7p2 - z3p2;
            data[dataOff + 40] = z13p2 + z2p2;
            data[dataOff + 24] = z13p2 - z2p2;
            data[dataOff + 8] = z11p2 + z4p2;
            data[dataOff + 56] = z11p2 - z4p2;
            dataOff++
        }
        var fDCTQuant;
        for (i = 0; i < I64; ++i) {
            fDCTQuant = data[i] * fdtbl[i];
            outputfDCTQuant[i] = (fDCTQuant > 0) ? ((fDCTQuant + 0.5) | 0) : ((fDCTQuant - 0.5) | 0)
        }
        return outputfDCTQuant
    }
    function writeAPP0() {
        writeWord(65504);
        writeWord(16);
        writeByte(74);
        writeByte(70);
        writeByte(73);
        writeByte(70);
        writeByte(0);
        writeByte(1);
        writeByte(1);
        writeByte(0);
        writeWord(1);
        writeWord(1);
        writeByte(0);
        writeByte(0)
    }
    function writeSOF0(width, height) {
        writeWord(65472);
        writeWord(17);
        writeByte(8);
        writeWord(height);
        writeWord(width);
        writeByte(3);
        writeByte(1);
        writeByte(17);
        writeByte(0);
        writeByte(2);
        writeByte(17);
        writeByte(1);
        writeByte(3);
        writeByte(17);
        writeByte(1)
    }
    function writeDQT() {
        writeWord(65499);
        writeWord(132);
        writeByte(0);
        for (var i = 0; i < 64; i++) {
            writeByte(YTable[i])
        }
        writeByte(1);
        for (var j = 0; j < 64; j++) {
            writeByte(UVTable[j])
        }
    }
    function writeDHT() {
        writeWord(65476);
        writeWord(418);
        writeByte(0);
        for (var i = 0; i < 16; i++) {
            writeByte(std_dc_luminance_nrcodes[i + 1])
        }
        for (var j = 0; j <= 11; j++) {
            writeByte(std_dc_luminance_values[j])
        }
        writeByte(16);
        for (var k = 0; k < 16; k++) {
            writeByte(std_ac_luminance_nrcodes[k + 1])
        }
        for (var l = 0; l <= 161; l++) {
            writeByte(std_ac_luminance_values[l])
        }
        writeByte(1);
        for (var m = 0; m < 16; m++) {
            writeByte(std_dc_chrominance_nrcodes[m + 1])
        }
        for (var n = 0; n <= 11; n++) {
            writeByte(std_dc_chrominance_values[n])
        }
        writeByte(17);
        for (var o = 0; o < 16; o++) {
            writeByte(std_ac_chrominance_nrcodes[o + 1])
        }
        for (var p = 0; p <= 161; p++) {
            writeByte(std_ac_chrominance_values[p])
        }
    }
    function writeSOS() {
        writeWord(65498);
        writeWord(12);
        writeByte(3);
        writeByte(1);
        writeByte(0);
        writeByte(2);
        writeByte(17);
        writeByte(3);
        writeByte(17);
        writeByte(0);
        writeByte(63);
        writeByte(0)
    }
    function processDU(CDU, fdtbl, DC, HTDC, HTAC) {
        var EOB = HTAC[0];
        var M16zeroes = HTAC[240];
        var pos;
        const I16 = 16;
        const I63 = 63;
        const I64 = 64;
        var DU_DCT = fDCTQuant(CDU, fdtbl);
        for (var j = 0; j < I64; ++j) {
            DU[ZigZag[j]] = DU_DCT[j]
        }
        var Diff = DU[0] - DC;
        DC = DU[0];
        if (Diff == 0) {
            writeBits(HTDC[0])
        } else {
            pos = 32767 + Diff;
            writeBits(HTDC[category[pos]]);
            writeBits(bitcode[pos])
        }
        var end0pos = 63;
        for (;
        (end0pos > 0) && (DU[end0pos] == 0); end0pos--) {}
        if (end0pos == 0) {
            writeBits(EOB);
            return DC
        }
        var i = 1;
        var lng;
        while (i <= end0pos) {
            var startpos = i;
            for (;
            (DU[i] == 0) && (i <= end0pos); ++i) {}
            var nrzeroes = i - startpos;
            if (nrzeroes >= I16) {
                lng = nrzeroes >> 4;
                for (var nrmarker = 1; nrmarker <= lng; ++nrmarker) {
                    writeBits(M16zeroes)
                }
                nrzeroes = nrzeroes & 15
            }
            pos = 32767 + DU[i];
            writeBits(HTAC[(nrzeroes << 4) + category[pos]]);
            writeBits(bitcode[pos]);
            i++
        }
        if (end0pos != I63) {
            writeBits(EOB)
        }
        return DC
    }
    function initCharLookupTable() {
        var sfcc = String.fromCharCode;
        for (var i = 0; i < 256; i++) {
            clt[i] = sfcc(i)
        }
    }
    this.encode = function (image, quality) {
        var time_start = new Date().getTime();
        if (quality) {
            setQuality(quality)
        }
        byteout = new Array();
        bytenew = 0;
        bytepos = 7;
        writeWord(65496);
        writeAPP0();
        writeDQT();
        writeSOF0(image.width, image.height);
        writeDHT();
        writeSOS();
        var DCY = 0;
        var DCU = 0;
        var DCV = 0;
        bytenew = 0;
        bytepos = 7;
        this.encode.displayName = "_encode_";
        var imageData = image.data;
        var width = image.width;
        var height = image.height;
        var quadWidth = width * 4;
        var tripleWidth = width * 3;
        var x, y = 0;
        var r, g, b;
        var start, p, col, row, pos;
        while (y < height) {
            x = 0;
            while (x < quadWidth) {
                start = quadWidth * y + x;
                p = start;
                col = -1;
                row = 0;
                for (pos = 0; pos < 64; pos++) {
                    row = pos >> 3;
                    col = (pos & 7) * 4;
                    p = start + (row * quadWidth) + col;
                    if (y + row >= height) {
                        p -= (quadWidth * (y + 1 + row - height))
                    }
                    if (x + col >= quadWidth) {
                        p -= ((x + col) - quadWidth + 4)
                    }
                    r = imageData[p++];
                    g = imageData[p++];
                    b = imageData[p++];
                    YDU[pos] = ((RGB_YUV_TABLE[r] + RGB_YUV_TABLE[(g + 256) >> 0] + RGB_YUV_TABLE[(b + 512) >> 0]) >>
                        16) - 128;
                    UDU[pos] = ((RGB_YUV_TABLE[(r + 768) >> 0] + RGB_YUV_TABLE[(g + 1024) >> 0] + RGB_YUV_TABLE[(b +
                        1280) >> 0]) >> 16) - 128;
                    VDU[pos] = ((RGB_YUV_TABLE[(r + 1280) >> 0] + RGB_YUV_TABLE[(g + 1536) >> 0] + RGB_YUV_TABLE[(b +
                        1792) >> 0]) >> 16) - 128
                }
                DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
                DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
                DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
                x += 32
            }
            y += 8
        }
        if (bytepos >= 0) {
            var fillbits = [];
            fillbits[1] = bytepos + 1;
            fillbits[0] = (1 << (bytepos + 1)) - 1;
            writeBits(fillbits)
        }
        writeWord(65497);
        var jpegDataUri = "data:image/jpeg;base64," + btoa(byteout.join(""));
        byteout = [];
        var duration = new Date().getTime() - time_start;
        console.log("Encoding time: " + duration + "ms");
        return jpegDataUri
    };
 
    function setQuality(quality) {
        if (quality <= 0) {
            quality = 1
        }
        if (quality > 100) {
            quality = 100
        }
        if (currentQuality == quality) {
            return
        }
        var sf = 0;
        if (quality < 50) {
            sf = Math.floor(5000 / quality)
        } else {
            sf = Math.floor(200 - quality * 2)
        }
        initQuantTables(sf);
        currentQuality = quality;
        console.log("Quality set to: " + quality + "%")
    }
    function init() {
        var time_start = new Date().getTime();
        if (!quality) {
            quality = 50
        }
        initCharLookupTable();
        initHuffmanTbl();
        initCategoryNumber();
        initRGBYUVTable();
        setQuality(quality);
        var duration = new Date().getTime() - time_start;
        console.log("Initialization " + duration + "ms")
    }
    init()
}
function getImageDataFromImage(idOrElement) {
    var theImg = (typeof (idOrElement) == "string") ? document.getElementById(idOrElement) : idOrElement;
    var cvs = document.createElement("canvas");
    cvs.width = theImg.width;
    cvs.height = theImg.height;
    var ctx = cvs.getContext("2d");
    ctx.drawImage(theImg, 0, 0);
    return (ctx.getImageData(0, 0, cvs.width, cvs.height))
};
var BinaryFile = function (strData, iDataOffset, iDataLength) {
    var data = strData;
    var dataOffset = iDataOffset || 0;
    var dataLength = 0;
    this.getRawData = function () {
        return data
    };
    if (typeof strData == "string") {
        dataLength = iDataLength || data.length;
        this.getByteAt = function (iOffset) {
            return data.charCodeAt(iOffset + dataOffset) & 255
        };
        this.getBytesAt = function (iOffset, iLength) {
            var aBytes = [];
            for (var i = 0; i < iLength; i++) {
                aBytes[i] = data.charCodeAt((iOffset + i) + dataOffset) & 255
            }
            return aBytes
        }
    } else {
        if (typeof strData == "unknown") {
            dataLength = iDataLength || IEBinary_getLength(data);
            this.getByteAt = function (iOffset) {
                return IEBinary_getByteAt(data, iOffset + dataOffset)
            };
            this.getBytesAt = function (iOffset, iLength) {
                return new VBArray(IEBinary_getBytesAt(data, iOffset + dataOffset, iLength)).toArray()
            }
        }
    }
    this.getLength = function () {
        return dataLength
    };
    this.getSByteAt = function (iOffset) {
        var iByte = this.getByteAt(iOffset);
        if (iByte > 127) {
            return iByte - 256
        } else {
            return iByte
        }
    };
    this.getShortAt = function (iOffset, bBigEndian) {
        var iShort = bBigEndian ? (this.getByteAt(iOffset) << 8) + this.getByteAt(iOffset + 1) : (this.getByteAt(
            iOffset + 1) << 8) + this.getByteAt(iOffset);
        if (iShort < 0) {
            iShort += 65536
        }
        return iShort
    };
    this.getSShortAt = function (iOffset, bBigEndian) {
        var iUShort = this.getShortAt(iOffset, bBigEndian);
        if (iUShort > 32767) {
            return iUShort - 65536
        } else {
            return iUShort
        }
    };
    this.getLongAt = function (iOffset, bBigEndian) {
        var iByte1 = this.getByteAt(iOffset),
            iByte2 = this.getByteAt(iOffset + 1),
            iByte3 = this.getByteAt(iOffset + 2),
            iByte4 = this.getByteAt(iOffset + 3);
        var iLong = bBigEndian ? (((((iByte1 << 8) + iByte2) << 8) + iByte3) << 8) + iByte4 : (((((iByte4 << 8) +
            iByte3) << 8) + iByte2) << 8) + iByte1;
        if (iLong < 0) {
            iLong += 4294967296
        }
        return iLong
    };
    this.getSLongAt = function (iOffset, bBigEndian) {
        var iULong = this.getLongAt(iOffset, bBigEndian);
        if (iULong > 2147483647) {
            return iULong - 4294967296
        } else {
            return iULong
        }
    };
    this.getStringAt = function (iOffset, iLength) {
        var aStr = [];
        var aBytes = this.getBytesAt(iOffset, iLength);
        for (var j = 0; j < iLength; j++) {
            aStr[j] = String.fromCharCode(aBytes[j])
        }
        return aStr.join("")
    };
    this.getCharAt = function (iOffset) {
        return String.fromCharCode(this.getByteAt(iOffset))
    };
    this.toBase64 = function () {
        return window.btoa(data)
    };
    this.fromBase64 = function (strBase64) {
        data = window.atob(strBase64)
    }
};
var BinaryAjax = (function () {
    function createRequest() {
        var oHTTP = null;
        if (window.ActiveXObject) {
            oHTTP = new ActiveXObject("Microsoft.XMLHTTP")
        } else {
            if (window.XMLHttpRequest) {
                oHTTP = new XMLHttpRequest()
            }
        }
        return oHTTP
    }
    function getHead(strURL, fncCallback, fncError) {
        var oHTTP = createRequest();
        if (oHTTP) {
            if (fncCallback) {
                if (typeof (oHTTP.onload) != "undefined") {
                    oHTTP.onload = function () {
                        if (oHTTP.status == "200") {
                            fncCallback(this)
                        } else {
                            if (fncError) {
                                fncError()
                            }
                        }
                        oHTTP = null
                    }
                } else {
                    oHTTP.onreadystatechange = function () {
                        if (oHTTP.readyState == 4) {
                            if (oHTTP.status == "200") {
                                fncCallback(this)
                            } else {
                                if (fncError) {
                                    fncError()
                                }
                            }
                            oHTTP = null
                        }
                    }
                }
            }
            oHTTP.open("HEAD", strURL, true);
            oHTTP.send(null)
        } else {
            if (fncError) {
                fncError()
            }
        }
    }
    function sendRequest(strURL, fncCallback, fncError, aRange, bAcceptRanges, iFileSize) {
        var oHTTP = createRequest();
        if (oHTTP) {
            var iDataOffset = 0;
            if (aRange && !bAcceptRanges) {
                iDataOffset = aRange[0]
            }
            var iDataLen = 0;
            if (aRange) {
                iDataLen = aRange[1] - aRange[0] + 1
            }
            if (fncCallback) {
                if (typeof (oHTTP.onload) != "undefined") {
                    oHTTP.onload = function () {
                        if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
                            oHTTP.binaryResponse = new BinaryFile(oHTTP.responseText, iDataOffset, iDataLen);
                            oHTTP.fileSize = iFileSize || oHTTP.getResponseHeader("Content-Length");
                            fncCallback(oHTTP)
                        } else {
                            if (fncError) {
                                fncError()
                            }
                        }
                        oHTTP = null
                    }
                } else {
                    oHTTP.onreadystatechange = function () {
                        if (oHTTP.readyState == 4) {
                            if (oHTTP.status == "200" || oHTTP.status == "206" || oHTTP.status == "0") {
                                var oRes = {
                                    status: oHTTP.status,
                                    binaryResponse: new BinaryFile(typeof oHTTP.responseBody == "unknown" ? oHTTP.responseBody :
                                        oHTTP.responseText, iDataOffset, iDataLen),
                                    fileSize: iFileSize || oHTTP.getResponseHeader("Content-Length")
                                };
                                fncCallback(oRes)
                            } else {
                                if (fncError) {
                                    fncError()
                                }
                            }
                            oHTTP = null
                        }
                    }
                }
            }
            oHTTP.open("GET", strURL, true);
            if (oHTTP.overrideMimeType) {
                oHTTP.overrideMimeType("text/plain; charset=x-user-defined")
            }
            if (aRange && bAcceptRanges) {
                oHTTP.setRequestHeader("Range", "bytes=" + aRange[0] + "-" + aRange[1])
            }
            oHTTP.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 1970 00:00:00 GMT");
            oHTTP.send(null)
        } else {
            if (fncError) {
                fncError()
            }
        }
    }
    return function (strURL, fncCallback, fncError, aRange) {
        if (aRange) {
            getHead(strURL, function (oHTTP) {
                var iLength = parseInt(oHTTP.getResponseHeader("Content-Length"), 10);
                var strAcceptRanges = oHTTP.getResponseHeader("Accept-Ranges");
                var iStart, iEnd;
                iStart = aRange[0];
                if (aRange[0] < 0) {
                    iStart += iLength
                }
                iEnd = iStart + aRange[1] - 1;
                sendRequest(strURL, fncCallback, fncError, [iStart, iEnd], (strAcceptRanges == "bytes"), iLength)
            })
        } else {
            sendRequest(strURL, fncCallback, fncError)
        }
    }
}());
document.write("<script type='text/vbscript'>\r\n" + "Function IEBinary_getByteAt(strBinary, iOffset)\r\n" +
    "   IEBinary_getByteAt = AscB(MidB(strBinary, iOffset + 1, 1))\r\n" + "End Function\r\n" +
    "Function IEBinary_getBytesAt(strBinary, iOffset, iLength)\r\n" + "  Dim aBytes()\r\n" +
    "  ReDim aBytes(iLength - 1)\r\n" + "  For i = 0 To iLength - 1\r\n" +
    "   aBytes(i) = IEBinary_getByteAt(strBinary, iOffset + i)\r\n" + "  Next\r\n" +
    "  IEBinary_getBytesAt = aBytes\r\n" + "End Function\r\n" + "Function IEBinary_getLength(strBinary)\r\n" +
    "   IEBinary_getLength = LenB(strBinary)\r\n" + "End Function\r\n" + "<\/script>\r\n");