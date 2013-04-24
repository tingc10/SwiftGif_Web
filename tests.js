var GifCreator = require("./gif-creator.js");

const FOLDER = "word_magnets";

GifCreator.convertJPGsToGIFs(FOLDER, function(err) {
	GifCreator.createAnimatedGif(FOLDER, 10, function() {
		console.log("Converted Folder:", FOLDER);
	});
});
