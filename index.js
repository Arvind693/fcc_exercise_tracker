const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect("mongodb+srv://user1:user123@cluster0.y06ydeg.mongodb.net/exercise-tracker?retryWrites=true&w=majority");

const userSchema = new mongoose.Schema({
  username:String,
});
const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  user_id:{type:String,required:true},
  description:String,
  duration:Number,
  date:Date,
});
const Exercise = mongoose.model('Exercise',exerciseSchema);


app.use(cors())
app.use(express.urlencoded({extended:true}))
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async(req,res)=>{
  const userObj = new User({
    username:req.body.username
  })
  try{
    const user = await userObj.save();
    console.log(user)
    res.json(user)
  }catch(err){
    console.log(err)
  }
})

app.get('/api/users',async(req,res)=>{
  try{
    const users = await User.find();
    res.status(200).json(users);
  }
  catch(err){
    res.status(400).json(err);
  }
});

app.post('/api/users/:_id/exercises',async(req,res)=>{
  const userId = req.params._id;
  const {description,duration,date} = req.body;
  try{
    const user = await User.findById(userId);
    if(!user){
      res.status(404).json({error:"User not found"})
    }
    const exerciseObj = new Exercise({
      user_id:user._id,
      description,
      duration,
      date:date ? new Date(date) : new Date(),
    })
    const exercise = await exerciseObj.save();
    res.status(200).json({
      _id:user.id,
      username:user.username,
      date:exercise.date.toDateString(),
      duration:exercise.duration,
      description:exercise.description,
    });
  }catch(err){
    res.status(400).json(err);
  }
});

app.get('/api/users/:_id/logs',async(req,res)=>{
  const userId = req.params._id;
  const {from,to,limit} = req.query;
  try{
    const user = await User.findById(userId);
    if(!user){
      res.status(404).json({error:"User not found"});
      return;
    }
    let dateObj = {};
    if(from){
      dateObj["$gte"] = new Date(from);
    }
    if(to){
      dateObj["$lte"] = new Date(to);
    }
    let filter = {
      user_id:userId
    }
    if(from || to){
      filter.date = dateObj;
    }
    
    const exercises = await Exercise.find(filter).limit(+limit ?? 500);
    const log = exercises.map((exercise)=>{
      let formattedDate = new Date(exercise.date).toDateString();
      return {
        description:exercise.description,
        duration:exercise.duration,
        date:formattedDate,
      }
    })
  
    res.status(200).json({
      _id:user.id,
      username:user.username,
      count:exercises.length,
      log:log,
    })
  }catch(err){
    res.status(400).json(err);
  }
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
