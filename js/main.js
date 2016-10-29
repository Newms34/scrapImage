var imgData = null;
var app = angular.module('scrapp', ['ngAnimate']).controller('scrcontroller', function($scope, $http) {
    $scope.scrapbloo = 'None yet!';
    var pik = document.createElement('img');
    $scope.showHelp = false;
    pik.crossOrigin = 'Anonymous';
    $scope.statsShow = true;
    $scope.imRat = 6;
    $scope.toggleInfo = function() {
        $scope.statsShow = !$scope.statsShow;
        if ($scope.statsShow) {
            // if (!pik.complete || (pik.naturalWidth !== "undefined" && pik.naturalWidth == 0)) {
            //     $scope.statsShow = false;
            //     return;
            // }
            $('#imgStats').show();
        } else {
            $('#imgStats').hide();
        }
    };
    $scope.toggleInfo();
    $scope.drawImg = function(im_url, rat) {
        console.log(im_url, rat)
            //dimension stuffs. default to actual image dimensions
        var dims = {
            height: $scope.imHt,
            width: $scope.imWd
        }
        var xDim = Math.floor(dims.width / rat),
            yDim = Math.floor(dims.height / rat);
        imgData = $scope.ctx.getImageData(0, 0, $scope.imWd, $scope.imHt).data;
        console.log('IMAGE DATA:', imgData)
        var chunkWidth = Math.floor(dims.height / yDim); //number of pixels high each chunk is
        var chunkHeight = Math.floor(dims.width / xDim); //number of pixels wide each chunk is
        console.log(chunkWidth, chunkHeight);
        var rgbArr = []; //holds all pixels (raw)
        var currPx = 0;
        for (var y = 0; y < dims.height; y++) {
            var row = [];
            for (var x = 0; x < dims.width; x++) {
                var newRGB = {
                    red: imgData[currPx],
                    green: imgData[currPx + 1],
                    blue: imgData[currPx + 2]
                };
                currPx += 4;
                row.push(newRGB);
            }
            rgbArr.push(row);
        }
        //we now have an array of all pixel rgb vals, with each pixel ALSO assigned its x and y coords

        //now, we're going to calculate the average rgb of each chunk (grp of pixels)
        var chunkArr = [];
        for (var i = 0; i < dims.height; i += chunkHeight) {
            for (var j = 0; j < dims.width; j += chunkWidth) {
                var tot = chunkWidth * chunkHeight;
                var avg = {
                    r: 0,
                    g: 0,
                    b: 0
                };
                //now we're in one 'chunk'. We average all the rgb vals, and...
                for (var x = 0; x < chunkWidth; x++) {
                    for (var y = 0; y < chunkHeight; y++) {
                        var theX = j + x;
                        var theY = i + y;
                        // if (i == 0 && j == 0) {
                        //     console.log('FIRST CHUNK:', theX, theY, rgbArr[theY][theX])
                        // }
                        if (rgbArr[theY] && rgbArr[theY][theX]) {
                            avg.r += rgbArr[theY][theX].red;
                            avg.g += rgbArr[theY][theX].green;
                            avg.b += rgbArr[theY][theX].blue;
                        } else {
                            //this px doesnt exist, so subtract from tot (so that our average is accurate)
                            tot--;
                        }
                    }
                }
                //now average
                avg.r = avg.r / tot;
                avg.g = avg.g / tot;
                avg.b = avg.b / tot;
                //and push into chunkarr
                chunkArr.push(avg);
            }

        }
        var str = '{"bodies": [{"childs": [';
        var allChunks = [];
        var currX = 0,
            currY = 0;
        console.log('Image stats: real x', dims.height, 'real y', dims.width, 'chunks x', xDim, 'chunks y', yDim, 'chunkWidth', chunkWidth, 'chunkHeight', chunkHeight, 'total chunks', chunkArr.length)
        console.log('Example Chunk', chunkArr[0], 'hex', rgbToHex(chunkArr[0]))
        for (var n = 0; n < chunkArr.length; n++) {
            //notice we're goin backwards here, since we need to construct the image from the LAST pixel (bottom) up.
            var pxl = {
                "bounds": {
                    "x": 1,
                    "y": 1,
                    "z": 1
                },
                "color": rgbToHex(chunkArr[n]), //color!
                "pos": {
                    "x": currX,
                    "y": 1,
                    "z": currY
                },
                "shapeId": "a6c6ce30-dd47-4587-b475-085d55c6a3b4",
                "xaxis": 1,
                "zaxis": 3
            }
            allChunks.push(JSON.stringify(pxl));
            currX++;
            if (currX == xDim + 1) {
                currX = 0;
                currY++;
            }
        }
        str += allChunks.join(',') + ']}],"version": 1}';
        $scope.scrapbloo = str;
    };

    function rgbToHex(rgb) {
        var r = parseInt(rgb.r).toString(16),
            g = parseInt(rgb.g).toString(16),
            b = parseInt(rgb.b).toString(16);
        if (r.length < 2) r = '0' + r;
        if (g.length < 2) g = '0' + g;
        if (b.length < 2) b = '0' + b;
        return r + g + b;
    }

    $scope.canv = document.querySelector('canvas');
    $scope.canvImg = new Image(); //we're copying image to create a 'local' copy of it
    $scope.ctx = $scope.canv.getContext("2d");
    $scope.canvImg.addEventListener("load", function() {
        console.log('loaded local version of image. drawin to canvas', this)
        $scope.ctx.drawImage($scope.canvImg, 0, 0);
    });
    $scope.loadImg = function() {

        var file = document.querySelector('#myFile').files[0];
        var reader = new FileReader();

        reader.addEventListener("load", function() {
            $scope.imgLoaded = true;
            console.log(reader)
            pik.src = reader.result;
            localStorage.setItem("savedImageData", reader.result);
            $scope.imHt = pik.height;
            $scope.imWd = pik.width;
            console.log('PIK', pik)
            $scope.canv.width = $scope.imWd;
            $scope.canv.height = $scope.imHt;
            $scope.ctx.fillStyle = '#ffffff';
            $scope.canvImg.src = localStorage.savedImageData;
            $scope.$apply();
        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    }
    $scope.doBloop = function() {
        console.log('bloop triggered')
        var totalSize = ($scope.imHt / $scope.imRat) * ($scope.imWd / $scope.imRat);
        var conf = true;
        if (totalSize > 60000) {
            conf = confirm('Warning! Your image is particularly large. Consider using a smaller image OR reducing the ratio! Are you sure you want to continue?')
        }
        if (conf) {
            $scope.drawImg($scope.oldUrl, $scope.imRat);
        }
    };
})
