// Node modules
var Crypto = require("crypto");

// Set up the exports obj
module.exports = exports = {};

// 3rd Party Modules
var Mongoose  = require("mongoose");
var Types     = Mongoose.Schema.Types;

const M_HOST  = "dharma.mongohq.com"
    , M_DB    = "SwiftGifDB"
    , M_PORT  = 10095
    , M_OPTS  = {server: {auto_reconnect: false}, user: "giffer", pass: "g22ffer"}
;

// Make the connection
Mongoose.connect(M_HOST, M_DB, M_PORT, M_OPTS);

/***********************************************************************************************************************
* User 
***********************************************************************************************************************/

var UserSchema = new Mongoose.Schema();

UserSchema.add({
  user_id: String
, phone_id: String
, phone_number: String
, username: String
, created_at: {type: Date, default: Date.now}
, updated_at: {type: Date, default: Date.now}
});

UserSchema.statics.createUser = 
function createUser(cb) {
  Crypto.randomBytes(24, function(err, byteBuf) {
    
    // Handle the error case
    if(err) { return cb(err); }

    // Create a new user
    var user = new User({user_id: byteBuf.toString("hex")});

    // Save the user and return
    user.save(function(err) { cb(err, user); });
  });
}

UserSchema.statics.isUsernameFree =
function isUsernameFree(uname, cb) {
	User.count({username: uname}, function(err,count) {
		var resp = false;
		if  (err) console.log("error checking if username is available: " + err);
		else if (count == 0) resp = true;
		cb(resp);
	});
}

var User = module.exports.User = Mongoose.model("User", UserSchema);


/***********************************************************************************************************************
* Gif
***********************************************************************************************************************/

var GifSchema = new Mongoose.Schema();

GifSchema.add({
  gif_id: String
, user_id: String
, gif_path: String
, is_private: {type: Boolean, default: false}
, tags: {type: Array, default: []}
, upvotes: {type: Array, default: []}
, created_at: {type: Date, default: Date.now}
, updated_at: {type: Date, default: Date.now}
});

GifSchema.statics.createGif = function(name, path, user, tags, cb) {
 	console.log("Saving gif " + name + " with tags " + tags);
 	var gif = new Gif({tags: tags, gif_id: name, gif_path: path, user_id: user.user_id});
  	gif.save(function(err) {
    		return cb(err, gif);
  	});
};

GifSchema.statics.loadURLsByUserID = function(id, tags, cb) {
	var query = (tags instanceof Array) ? {tags: {$all: tags}, user_id: id} : {user_id: id};
	Gif.find(query).sort("-created_at").exec(function(err, gifs) {
		cb(err, gifs.filter(gifIDNotNull).map(function(g) { return g; }));
	});
}

GifSchema.statics.loadAllGifs = function(tags, cb) {
	var query = (tags instanceof Array) ? {tags: {$all: tags}} : {};
	Gif.find(query).sort("-created_at").exec(function(err, gifs) {
		cb(err, gifs.filter(gifIDNotNull).map(function(g) { return g; }));
	});
}

var Gif = module.exports.Gif = Mongoose.model("Gif", GifSchema);


/***********************************************************************************************************************
* Util Fns
***********************************************************************************************************************/

var gifIDNotNull = function gifIDNotNull(g) { return g.gif_id != null; }
