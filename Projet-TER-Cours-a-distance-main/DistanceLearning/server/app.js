const express = require('express');
const shortid = require('shortid');
const cors = require('cors');
const { PeerServer } = require('peer');
const fs = require('fs');
var https = require('https');

const options = {
  key: fs.readFileSync('./cert/cert.key'),
  cert: fs.readFileSync('./cert/cert.crt')
};



const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors())


const server = require('https').Server(options, app)
const io = require('socket.io')(server, {pingInterval: 2})

io.listen(1123)





shortid.characters(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ()'
);

app.get('/createMeetUrl', cors(), (req, res) => {
  res.send({ success: true, data: shortid.generate() });
});


//




let cpt = 0;

server.listen(1122,"0.0.0.0", () => {
  
  console.log('server is running on port 1122');
  io.sockets.on('connection',async function (socket)  {
    let room_id = null;
    let peer_id = null;

  
    socket.on('join-room', (data) => {
      if (data && data.peerId && data.roomId) {
        room_id = data.roomId;
        peer_id = data.peerId;
  
        socket.join(room_id, (err) => {
          if (!err) {
            cpt+= 1;
            console.log(cpt);
            socket.to(room_id).emit('nbr-peer', cpt);

            socket
              .to(room_id)
              .emit('new-peer-connected', { peerId: data.peerId });


          }
        });
      }
    });
  
    socket.on('peer-mute', (data) => {
      if (data && room_id) {
        socket.to(room_id).emit('peer-mute', data);
      }
    });

    socket.on('send-message', (data) => {
      // room-id il viens d'ou ?
      if (data && room_id) {
        socket.to(room_id).emit('send-message', data);
        console.log(data)


      }
    });
  
  
 
    socket.on('peer-screen', (data) => {
      if (data && room_id) {
        socket.to(room_id).emit('peer-screen', data);
      }
    });


    /*
    socket.on('inc-nbr-peer', (data) => {

   
    }
   );*/
  
    socket.on('peer-video', (data) => {
      if (data && room_id) {
        socket.to(room_id).emit('peer-video', data);
      }
    });
  
    socket.on('share-username', (data) => {
      if (data && room_id) {
        socket.to(room_id).emit('share-username', data);
      }
    });
    // ping
  
  
    socket.on('disconnect', () => {
      io.to(room_id).emit('peer-disconnected', { peerId: peer_id });
    });
  });



});













