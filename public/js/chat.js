const socket = io()

//Elements
const $messageForm = document.querySelector('#typedmsg')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.getElementById("location")
const $messages = document.getElementById('messages')



const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

const {username, room} = Qs.parse(location.search,{ignoreQueryPrefix:true}) 

const autoscroll = () =>{
   
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    const visibleHeight = $messages.offsetHeight

    const containerHeight = $messages.scrollHeight

    const scrollOffset = $messages.scrollTop + visibleHeight
    console.log(containerHeight,newMessageHeight,scrollOffset)
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight

    }
}
socket.on('MSG', (x) =>{
    
  
  const html = Mustache.render(messageTemplate,{
      name:x.username,
      message:x.msg,
      time:moment(x.time).format('HH'+":"+'mm')
  })
  document.getElementById('name').value=x.username;
  document.getElementById('room').value=x.room;
  console.log(document.getElementById('name').value,  document.getElementById('room').value)
  $messages.insertAdjacentHTML('beforeend',html)

  autoscroll()
  
});





socket.on('locationMessage',(url) =>{
    console.log(url)
    const tag = Mustache.render(locationTemplate,{
        name:url.username,
        url:url.msg,
        time:moment(url.time).format('HH'+":"+'mm')
    })
    
    $messages.insertAdjacentHTML('beforeend',tag)
    autoscroll()
})


$messageForm.addEventListener('submit',(event) => {
    event.preventDefault();
    $messageFormButton.setAttribute('disabled','disabled')
   
    var msg = event.target.message.value
    socket.emit('sendMessage',msg ,(err) =>{
        $messageFormButton.removeAttribute('disabled') 
        $messageFormInput.value = ''
        $messageFormInput.focus()
   
        if(err){
            return console.log(err)
        }
        console.log('Message delivered')
    });
})


$locationButton.onclick = () =>{
    $locationButton.setAttribute('disabled','disabled')
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by  your browser');
    }
    navigator.geolocation.getCurrentPosition((position) =>{
        
        socket.emit('sendLocation',{
            lat: position.coords.latitude,
            long:position.coords.longitude
        },() =>{
            $locationButton.removeAttribute('disabled') 
            console.log("Location shared!")
        })
       


    })
    
}

socket.emit('join',{username,room},(error) =>{
    if(error){
        alert(error)
        location.href="/"
    }
})

socket.on('roomData',({room,users}) =>{
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })
    
    document.querySelector('#sidebar').innerHTML = html
}) 


const videoGrid = document.getElementById('video_main')
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})
let myVideoStream;
const myVideo = document.createElement('video')
myVideo.muted = true;

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
});
  

 



myPeer.on('open', id => {
  var ROOM_ID =   document.getElementById('room').value;
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
   
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}


