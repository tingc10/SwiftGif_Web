var Fs = require("fs");
var Path = require("path");
var Spawn = require("child_process").spawn;

const NOOP = function() {};

const RAW_IMG_DIR = Path.join(__dirname, "/tmp/swiftgif/raw_images");
const ANIMATED_GIF_DIR = Path.join(__dirname, "/public/images/animated_gifs");
const COVER_PHOTO_DIR = Path.join(__dirname, "/public/images/covers");
//const GIF_DIR = module.exports.GIF_DIR = "/images/animated_gifs/";

const CONVERT_ARGS = ["-colors", "256", "-format", "gif"];
const ANIMATE_ARGS = ["--scale=1.0", "--loop", "-O3", "--colors=256","--conserve-memory"];

var ParallelExecutor = function ParallelExecutor(count, cb) {
	return function() { if(--count <= 0) { cb(null); } }
}

/**
 * Handles converting all of the JPGs in a folder into GIFs.
 */
module.exports.convertJPGsToGIFs = 
function convertJPGsToGIFs(files, folderName, cb) {
	console.log("calling convertJPGsToGIFs on folder " + folderName);
	// Parallel execution fn obj
	var pExec = ParallelExecutor(files.length, cb);

	// Iterate through all of the files and make GIFs
	var newFolderPath = Path.join(RAW_IMG_DIR, folderName);
	console.log("newFolderPath: " + newFolderPath);
	Fs.mkdir(newFolderPath, function(err) {


		// Copy the first frame (JPG) to the cover folder
		var coverFrameReader = 
			Fs.createReadStream(files[0]);
		var coverFrameWriter = 
			Fs.createWriteStream(Path.join(COVER_PHOTO_DIR, folderName+".jpg"));

		coverFrameReader.pipe(coverFrameWriter);
		coverFrameWriter.on("close", function(e) {
			if(e) { console.error(e); }

			files.forEach(function(filePath, idx) {
				console.log("processing file " + idx);
				var newFilePath	= Path.join(newFolderPath, (idx.toString()+".gif"))
					, convertArgs	= CONVERT_ARGS.concat([filePath, newFilePath])
					, convertProc	= Spawn("convert", convertArgs)
				;

				// Wait for all of the conversions to finish
				convertProc.on("exit", function() {
					// Remove the prior file
					Fs.unlink(filePath, NOOP);
					// Log that the conversion is done
					console.log("Conversion done");
					return pExec();
				});

			});
		});
	});
}

/**
 * Handles creating an animated gif from a folder of GIFs
 */
module.exports.createAnimatedGif = 
function createAnimatedGif(folderName, rate, cb) {
	console.log("calling createAnimatedGif for folder " + folderName + " and rate " + rate);
	rate = (typeof(rate) === "number") ? Math.min(Math.abs(rate),100) : 10;

	var folderPath = Path.join(RAW_IMG_DIR, folderName);
	Fs.readdir(folderPath, function(err, files) {
		// Return the cb w/err if need be
		if(err) { console.log("gif creation err: " + err); return cb(err); }
		
		// Filter out the files that are not jpgs (only issue in dev)
		files = files.filter(function(f) { return !!f.match(/\.gif$/); });
		if(files.length <= 0) { console.log("no files!"); return cb(); }
		//sorts files array
		files.sort(function(a,b){return a.replace(/\D/g,"")-b.replace(/\D/g,"");});
		console.log(files.valueOf());
		var newFilePath	= Path.join(ANIMATED_GIF_DIR, folderName) + ".gif"
			, newFile			= Fs.createWriteStream(newFilePath)
			, animateArgs = ANIMATE_ARGS.concat(files)
			, animateOpts = {cwd: folderPath}
		;

		// Update the delay
		animateArgs.unshift("--delay=" + rate.toString());
		var animateProc = Spawn("gifsicle", animateArgs, animateOpts);

		// When the animation is done, call back
		animateProc.on("exit", function(err) {if(err){console.log(err);} cb(err, newFilePath); });
		animateProc.stdout.pipe(newFile);
		//animateProc.kill();
	});
}
