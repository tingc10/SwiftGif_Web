var Fs = require("fs");
var Path = require("path");
var Spawn = require("child_process").spawn;

const NOOP = function() {};

const RAW_IMG_DIR = Path.join(__dirname, "/tmp/swiftgif/raw_images");
const ANIMATED_GIF_DIR = Path.join(__dirname, "/public/images/animated_gifs");
const COVER_PHOTO_DIR = Path.join(__dirname, "/public/images/covers");

module.exports.convertToGif =
function convertToGif(files, folderName, rate, cb) {
	console.log("Calling convertToGif on folder " + folderName + " with rate " + rate);
	rate = (typeof(rate) === "number") ? Math.min(Math.abs(rate),100) : 10;

		var coverFrameReader = Fs.createReadStream(files[0]);
		var coverFrameWriter = Fs.createWriteStream(Path.join(COVER_PHOTO_DIR, folderName+".jpg"));
		coverFrameReader.pipe(coverFrameWriter);
		coverFrameWriter.on("close", function(e) { 
			if(e) console.error(e);
			var magick_args = ["-colors", "256", "-format", "gif", "-delay", rate.toString(), "-loop", "0"];
			

			files.forEach(function(filePath, idx) {
                                console.log("listing file " + idx + " at path " + filePath);
				magick_args.push(filePath);
			});
			var newFilePath = Path.join(ANIMATED_GIF_DIR, folderName) + ".gif";
			magick_args.push(newFilePath);
			console.log("spawning ImageMagick w/args: " + magick_args);
			var convertProc = Spawn("convert", magick_args);
       			convertProc.on("exit", function(code) {
				console.log("ImageMagick convert process exiting with code " + code);
				cb(code, newFilePath);
			});

				
		});
}

