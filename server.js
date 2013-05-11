var Express = require("express")
	, GifCreator = require("./gif-creator-new.js")
  , Mongo = require("./mongo.js")
	, Jade = require("jade")
	, Server = Express()
  , User = Mongo.User
  , Gif = Mongo.Gif
;


var constants = require("./public/js/constants.js");
// constants.SG_BASE_URL for base URL string

console.info("Starting Server");

console.log("Using base URL " + constants.SG_BASE_URL);

Server.set("view engine", "jade");

Server.use(Express.query());
Server.use(Express.bodyParser());
Server.use(Express.methodOverride());
Server.use(Express.static("./public"));
Server.use(Express.logger());

Server.post("/upload", function(req, res) {
	var files = req.files.frames[0].map(function(f) { return f.path; });
	var name = Math.floor(Math.random() * 99999999).toString();
	//var rateBuf = new Buffer(req.body.rate);
	//var rate = Math.max(1, rateBuf.readInt32LE(0));
	//if(isNaN(rate) || typeof(rate) !== "number") { rate = 10; }
	var rate = parseInt(req.body.rate) || 20;
	console.log("Playback rate", rate);
  	var userId = req.body.user_id || null;
  	console.log("Initial user_id", userId);
	console.error(req.body);
	
	var tags = req.body.tags.split(" ");
	console.log("Number of tags: " + tags.length);


/////	GifCreator.convertJPGsToGIFs(files, name, function(err) {
/////		GifCreator.createAnimatedGif(name, rate, function(err, path) {

	GifCreator.convertToGif(files, name, rate, function(err, path) {
      // Make the URL
      	var url = constants.SG_BASE_URL + "gif/" + name;
	var downloadURL = constants.SG_BASE_URL + "images/animated_gifs/" + name

      // Create a new user or use the given id
      if(userId === null) {
        User.createUser(function(err, user) {
          Gif.createGif(name, path, user, tags, function(err, gif) {
            res.json({download_url: downloadURL, user_id: user.user_id, url: url});
          });
        });
      } else {
        Gif.createGif(name, path, new User({user_id: userId}), tags, function(err, gif) {
          res.json({url: url, download_url: downloadURL});
        });
      }
		///});
	});
});


Server.get("/gif/:id", function(req, res) {
	console.log("GET gif id:" + req.params.id);
	Gif.findOne({gif_id: req.params.id}, function(err, gif) {
		//console.log("Mongo Response, err:" + err + ", gif:" + gif);
		if (err) res.send("Gif Lookup Error:" + err);
		else if (!gif || !gif.gif_id) res.send("Gif Lookup Error!");
		else {
		try {
			res.render(__dirname+"/jade/list_view", {gifs: [gif], base_url: constants.SG_BASE_URL, search: false, iso: false});
		} catch(e) {
			res.send("Caught Error: " + e);
		}
		}
	});
});

Server.get("/users/:id", function(req, res) {
	console.log("GET user id:" + req.params.id);
	var tags = req.query.tags;
	if (tags) tags = tags.split(" ");
	Gif.loadURLsByUserID(req.params.id, tags, function(err, gifs) {
		try {
			res.render(__dirname+"/jade/list_view", {gifs: gifs, base_url: constants.SG_BASE_URL, search: true, iso: false});
		} catch(e) {
			res.send("");
		}
	});
});
/*
Server.get("/global", function(req, res) {
	console.error(req.query);
	var tags = req.query.tags;
	if (tags) tags = tags.split(" ");
	Gif.loadAllGifs(tags, function(err, gifs) {
		try {
			console.log("Rendering " + gifs.length + " gifs");
			res.render(__dirname+"/jade/list_view", {gifs: gifs, base_url: constants.SG_BASE_URL, search: true, iso: false});
		} catch(e) {
			res.send("");
		}
	});
});
*/
var globalFeed = function(req, res) {
        console.error(req.query);
        var tags = req.query.tags;
        if (tags) tags = tags.split(" ");
        Gif.loadAllGifs(tags, function(err, gifs) {
                try {
                        console.log("Rendering " + gifs.length + " gifs");
                        res.render(__dirname+"/jade/list_view", {gifs: gifs, base_url: constants.SG_BASE_URL, search: true, iso: false});
                } catch(e) {
                        res.send("");
                }
        });
};

Server.get("/global", globalFeed);
Server.get("/", globalFeed);

Server.get("/isotest",function(req, res) {
	var tags = req.query.tags;
	if (tags) tags = tags.split(" ");
	Gif.loadAllGifs(tags, function(err, gifs) {
		try {
			console.log("Isotope test, rendering " + gifs.length + " gifs");
			res.render(__dirname+"/jade/list_view", {gifs: gifs, base_url: constants.SG_BASE_URL, search:false, iso:true});
		} catch(e) { res.send(e); }
	});
});

Server.get("/check_username/:uname", function(req, res) {
	console.log("Request to check username " + req.params.uname);
	User.isUsernameFree(req.params.uname, function(isfree) {
		if (isfree) res.send("yes");
		else res.send("no");
	});
});

Server.post("/set_username", function(req, res) {
	var uname = req.body.username;
	var uid = req.body.user_id;
	if (uid == "SPECIAL_NEEDS_ID") {
		console.log("Request to set username of new user!");
		User.createUser(function(err, user) {
			uid = user.user_id;
			console.log("Created user with id " + uid);
			setUsername(uid, uname, res);
		});
	}
	else setUsername(uid, uname, res);
});

function setUsername(uid, uname, res) {
	console.log("Attempt to set username of " + uid + " to " + uname);
        User.isUsernameFree(uname, function(isfree) {
                if (isfree) {
                        User.update( {user_id: uid}, {username: uname}, {multi:false}, function(err,num) {
        			if (err || num != 1) res.send("no: " + err + ", num affected: " + num);
        			else res.send("yes" + uid);
			});
                }
                else res.send("no");
        });
}

Server.use(Express.errorHandler());

Server.listen(80);
