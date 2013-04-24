$(document).ready(function() {
	// /constants.js should have already been imported
	var GIF_URL = baseurl + "images/animated_gifs/{id}.gif";
	var JPG_URL = baseurl + "images/covers/{id}.jpg";

	$(document).on("touch click", "img.gif", function(e) {
		var $img = $(this);
		$img.off("load");

		var type = $img.attr("data-display-type");
		var id = $img.attr("data-gif-id");
		switch(type) {
		case "gif": // Switch to JPG
			$img.siblings(".play-button").removeClass("loading");

			$img.attr("src", JPG_URL.replace("{id}", id));
			$img.attr("data-display-type", "jpg");
			$img.parents(".gif-wrapper").removeClass("playing");
			break;
		case "jpg": // Switch to GIF
			$img.attr("src", GIF_URL.replace("{id}", id));
			$img.attr("data-display-type", "gif");

			$img.siblings(".play-button").addClass("loading");
			$img.on("load", function(e) {
				$img.parents(".gif-wrapper").addClass("playing");
				$img.siblings(".play-button").removeClass("loading");
			});

			break;
		default:
			break;
		}
	});
});
