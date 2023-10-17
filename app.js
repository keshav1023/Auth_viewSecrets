import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

const dbURL = "mongodb+srv://lmessi10:lmessi10@cluster0.dvkiufo.mongodb.net/userDB?retryWrites=true&w=majority";

const connectionParams={
    useNewUrlParser: true,
    useUnifiedTopology: true
}
mongoose.connect(dbURL, connectionParams).then(()=>{
    console.info("Connected to userDB")
}).catch((e)=>{
    console.log("Error:",e);
})

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret =  "Thisisourlittlesecret.";
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    console.log(req.body.username);
    console.log(req.body.password);

    newUser.save();
    console.log(req.body.username + " registered successfuly :)");
    res.render("secrets");
});
// verifying credentials and allowing login based on that
app.post("/login", async function(req,res){
    const username= req.body.username;
    const password= req.body.password;

    const found = await User.findOne({email : username});
    if(found){
        if(found.password === password){
            console.log("Logged in Successfully to Secrets :) ");
            res.render("secrets");
        }else{
            console.log("Password you entered was wrong :( , enter correct password");
        }
    }else{
        console.log("Either of your email or password is incorrect or you may not be a registered user. Register yourself.");
    }
});














app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });