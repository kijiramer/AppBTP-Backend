const express=require('express');
const app=express();
const mongoose=require('mongoose');

const mongoUrl="mongodb+srv://kijiramer:admin@cluster0.bafh5lk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

mongoose
    .connect(mongoUrl)
    .then(()=>{
    console.log("Database connected");
})
    .catch((e) => {
        console.log(e);
    });
require('./UserDetails')
const User=mongoose.model('UserInfo');

app.get("/",(req,res)=> {
    res.send({status: "started"})
});

app.post('/register', async (req,res) =>{
    const {email,password}=req.body;

    const oldUser= await User.findOne({email:email})

    if(oldUser){
        return res.send({data:"User existe déjà !!"})
    }

    try {
    await User.create({
        email:email,
        password:password,
    });
    res.send({ status:"ok", data:"User created" })

    } catch (error) {
        res.send({ status: "error", data: error })

    }
});

app.listen(8080,()=>{
    console.log("Node js server started.");
})

