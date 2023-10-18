import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";

import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
//const GoogleStrategy = require('passport-google-oauth20').Strategy;
import findOrCreate from "mongoose-findorcreate";


const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.use(session({
  secret: 'Our little secret',
  resave: false,
  saveUninitialized: false,
  //cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true
}
mongoose.connect(process.env.URL, connectionParams).then(()=>{
    console.info("Connected to userDB")
}).catch((e)=>{
    console.log("Error:",e);
})
// mongoose.set("useCreateIndex",true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
}); 

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null , user.id);
  });
  
  passport.deserializeUser(async function(id, done) {
    
    try {
        const user = await User.findById(id);
        done(null, user);
      } catch (err) {
        done(err, null);
      }
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req,res){
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate('google' , {scope : ["profile"]} )
);

app.get("/auth/google/secrets",
    passport.authenticate('google' , {failureRedirect : "/login"} ),
    function(req,res){

        res.redirect("/secrets");
    }
);

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){
    req.logout(req.user, err => {
      if(err) return next(err);
      res.redirect("/");
    });
  });

app.post("/register",function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});
// verifying credentials and allowing login based on that
app.post("/login", async function(req,res){

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });        
        }
    });

});














app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });