const path = require('path');
const http = require('http');
const express = require('express')
const app = express()
const socketio = require('socket.io');

const server = http.createServer(app)
const io = socketio(server);
const Filter = require('bad-words');
const { ExpressPeerServer} = require('peer');
const peerServer = ExpressPeerServer(server,{
    debug:true
});
const{v4:uuidv4} = require('uuid');
const {addUser,removeUser,getUser,getUsersInRoom} = require("./utils/users")

const {generateMessage,generateLocationMessage} = require('./utils/messages')





app.use(express.static('public'));

app.use('/peerjs',peerServer);


io.on('connection', (socket) => {
    console.log("New webscoket connection");

    socket.on('join', ({username,room}, callback) =>{
        const {error,user}=addUser({id: socket.id,username,room})
       
        if(error){
           return callback(error)
            
        }
       console.log(user)
        socket.join(user.room)
        
        io.to(user.room).emit('MSG',generateMessage("Admin",`${user.username} has joined`));
        io.to(user.room).emit('roomData',{
          room:user.room,
          users:getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('join-room', (roomId, userId) =>{
      socket.to(roomId).broadcast.emit('user-connected', userId)
  })

    socket.on('sendMessage',(msg,callback) =>{
      const user = getUser(socket.id)
      
      const filter = new Filter()
      if(filter.isProfane(msg)) {
        return callback('Profanity is not allowed!')
      }
      io.to(user.room).emit('MSG',generateMessage(user.username,msg))
      callback()
      
    })

    socket.on('sendLocation',(coords,callback) =>{
      const user = getUser(socket.id)
      io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.lat},${coords.long}`));
      callback()
    })

    socket.on('disconnect',() =>{
      const user = removeUser(socket.id)
      if(user){
      io.to(user.room).emit('MSG',generateMessage(user.username, `${user.username} has left`))
      io.to(user.room).emit('roomData',{
        room:user.room,
        users:getUsersInRoom(user.room)
      })
      }
    })

    
})


app.get('/', function(req,res){
    res.redirect("/"+uuidv4()); 
});
 
app.get('/:room',(req,res) =>{
    res.render("room",{roomId: req.params.room});
})

io.on('connection', socket =>{
   
})




let port=process.env.PORT;

if(port==null || port==""){
  port=4000;
}

server.listen(port, () => console.log(`Server started on port ${port}`));