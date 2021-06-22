import React, { Component } from 'react';
import { Row, Col, Button, Spin, message, Input } from 'antd';
import {Helmet} from "react-helmet";

// RCE CSS
import 'react-chat-elements/dist/main.css';
// MessageBox component
import Modal from 'antd/lib/modal/Modal';
import CallWindow from '../CallWindow/CallWindow';
import Socket from '../../lib/socket';
import Peer from 'peerjs';
import { PEERJS_URL } from '../../config';
import ToastField from "../ToastField";
import Chat from "./Chat"
import styled from 'styled-components';

import './Chat.scss';

class Call extends Component {

  state = {
    peers: [], // Liste qui contients tout les peers
    userAudioMute: false,
    userVideo: true,
    localPeerId: null, 
    callContainerStyle: {},
    initializing: true,
    interval: null,
    modalVisible: false,
    username: '',
    shareScreen: null,
    cptScreen: 0,
    peerTest: null,
    socket: null
  };

  constructor() {
    super();

    let socketInstance = new Socket();
    this.socket = socketInstance.socket;
    this.state.socket = this.socket;

    this.socket.on('new-peer-connected', ({ peerId }) => {

      console.log("connexion de nouveau peer :: " + peerId)

      let peerjs = null;
      let localStream = null;

      this.state.peers.forEach((peer) => {
        if (peer.peerId === this.state.localPeerId) {
          peerjs = peer.peerjs;
          localStream = peer.stream;
        }
      });

      if (peerjs && localStream) {
        var call = peerjs.call(peerId, localStream); //call the remote peer



        call.on('stream', async (stream) => {
          let peers = [...this.state.peers];

          if (peers.find((peer) => peer.peerId === peerId)) {
            peers = peers.map((peer) => {
              if (peer.peerId === peerId) {
                peer.stream = stream;
              }
              return peer;
            });

            this.setState({
              peers,
            });
          } else {
            peers.push({
              peerId,
              mute: false,
              video: true,
              stream,
            });

            this.setState(
              {
                peers,
                chatContainerStyle: this.generateChatContainerStyles(
                  peers.length
                ),
              },
              () => this.sendUsernameToPeers()
            );
          }
        });
      }
    });

    this.socket.on('peer-disconnected', ({ peerId }) => {
      let peers = [...this.state.peers];

      let peerToBeRemoved = peers.find((peer) => peer.peerId === peerId);

      peers = peers.filter((peer) => peer.peerId !== peerId);

      this.setState(
        {
          peers,
          chatContainerStyle: this.generateChatContainerStyles(peers.length),
        },
        () => {
          if (peerToBeRemoved) {
            message.info(`${peerToBeRemoved.name} left`);
          }
        }
      );
    });

    this.socket.on('peer-mute', ({ peerId, muteState }) => {
      this.remoteAudioToggle(peerId, muteState);
    });
    // share screen
    this.socket.on('peer-screen', ({ peerId, stream }) => {
      this.remoteShareScreenToggle(peerId, stream);
    });


    this.socket.on('peer-video', ({ peerId, videoState }) => {
      this.remoteVideoToggle(peerId, videoState);
    });

    this.socket.on('share-username', ({ peerId, username }) => {
      let peers = [...this.state.peers];
      let changed = false;

      peers = peers.map((peer) => {
        if (peer.peerId === peerId) {
          if (peer.name !== username) {
            peer.name = username;
            changed = true;
          }
        }
        return peer;
      });

      if (changed) {
        this.setState({ peers }, () => {
          message.info(`${username} joined`);
        });
      }
    });
  }


  // methode userVideoToggle // ici on cherche le local peer et on desactive ou on active la video 
  // on doit passer par le serever pour mettre a jour les données pour tout les autres peers
  userVideoToggle = () => {
    this.setState(
      (prevState) => {
        // on recupere les peers de previous state
        let peers = [...prevState.peers];

        peers = peers.map((peer) => {
          if (peer.peerId === this.state.localPeerId) {
            if (peer.stream) {
              if (prevState.userVideo) {
                peer.stream.getTracks().forEach((track) => {
                  track.enabled = false;
                  console.log("Local peer :: " + peer.peerId + " disable his camera ! ")

                });
              } else {
                peer.stream.getTracks().forEach((track) => {
                  track.enabled = true;
                  console.log("Local peer :: " + peer.peerId + " enable his camera ! ")

                });
              }
              peer.video = !prevState.userVideo;
            }
          }
          return peer;
        });

        return { userVideo: !prevState.userVideo, peers };
      },
      () =>
        this.socket.emit('peer-video', {
          peerId: this.state.localPeerId,
          videoState: this.state.userVideo,
        })
    );
  };




  // SI un remote peer ou un client desactive son camera
  remoteVideoToggle = (peerId, videoState) => {
    // on cherche le peer 
    let peers = [...this.state.peers];
    peers = peers.map((peer) => {
      if (peer.peerId === peerId) {
        peer.video = videoState;
        console.log(" Le peer :: " + peerId + " change state of his camera ! ")
      }
      return peer;
    });
    // on remplace la liste par la copie
    this.setState({ peers });
  };

  //Local peer AudioMuteToggle
  userAudioMuteToggle = () => {
    this.setState(
      (prevState) => {
        let peers = [...prevState.peers];

        peers = peers.map((peer) => {
          if (peer.peerId === this.state.localPeerId) {
            if (peer.stream) {
              peer.stream.getAudioTracks()[0].enabled = prevState.userAudioMute;
            }
            peer.mute = !prevState.userAudioMute;
            console.log("Local peer :: " + peer.peerId + " change state of his micro ! ")

          }
          return peer;
        });

        return { userAudioMute: !prevState.userAudioMute, peers };
      },
      () =>
        this.socket.emit('peer-mute', {
          peerId: this.state.localPeerId,
          muteState: this.state.userAudioMute,
        })
    );


    this.state.peers.forEach((peer) => {

      console.log("List " + peer.peerId)


    });
  };



  userShareScreenToggle = async () => {

    console.log("cpt " + this.state.cptScreen)

    if (this.state.cptScreen % 2 === 0) {
      let captureStream = null;

      try {
        captureStream = await navigator.mediaDevices.getDisplayMedia();
      } catch (err) {
        console.error("Error: " + err);
      }

      let peers = [...this.state.peers];

      console.log("hop" + this.state.peerTest)
      // on parcours la listes des peers
      peers = peers.map((peer) => {

        if (peer.peerId === this.state.peerTest) {
          console.log("heeeeeey")

          // on change l'etat de vocal de ce client || soit mute soit demute
          // peer.stream.getTracks().forEach(track => track.stop())
          peer.stream = captureStream;
          this.state.shareScreen = peer.stream;
        }

        return peer;
      }, () =>
        this.socket.emit('peer-screen', {
          peerId: this.state.peerTest,
          stream: this.state.userVideo,
        }));
      console.log("cpt " + this.state.cptScreen)
      this.state.cptScreen += 1;
      this.setState({ peers });

    } else {
      let peers = [...this.state.peers];
      // on parcours la listes des peers
      peers = peers.map((peer) => {

        if (peer.peerId === this.state.peerTest) {
          console.log("heeeeeey 1")

          // on change l'etat de vocal de ce client || soit mute soit demute
          peer.stream = peer.streamBackup;
          this.state.shareScreen = peer.stream;

        }

        return peer;
      }, () =>
        this.socket.emit('peer-screen', {
          peerId: this.state.peerTest,
          stream: this.state.userVideo,
        }));
      this.state.cptScreen += 1;
      this.setState({ peers });
    }

  };
  ///////////////////////////////////////////
  // share screen
  remoteShareScreenToggle = (peerId, stream) => {
    // on recupere le tableau qui contient la liste de tout les peers ou bien les clients
    // on va travailler sur la copie
    let peers = [...this.state.peers];
    // on parcours la listes des peers
    peers = peers.map((peer) => {
      // si on trouve le client dans la liste de clients
      if (peer.peerId === peerId) {
        // on change l'etat de vocal de ce client || soit mute soit demute
        peer.stream = stream;
        console.log("remote peer :: " + peer.peerId + " change state of his stream")

      }

      return peer;
    });
    // on remplace la liste original de peers par la copie
    this.setState({ peers });
  };




  // La sous fonction remoteAudioToggle est appelé quand le client ecoute l'evenement peer-mute
  remoteAudioToggle = (peerId, muteState) => {
    // on recupere le tableau qui contient la liste de tout les peers ou bien les clients
    // on va travailler sur la copie
    let peers = [...this.state.peers];
    // on parcours la listes des peers
    peers = peers.map((peer) => {
      // si on trouve le client dans la liste de clients
      if (peer.peerId === peerId) {
        // on change l'etat de vocal de ce client || soit mute soit demute
        peer.mute = muteState;
        console.log("remote peer :: " + peer.peerId + " change state of his micro ! ")

      }

      return peer;
    });
    // on remplace la liste original de peers par la copie
    this.setState({ peers });
  };

  // pour generer les frames de video
  generateChatContainerStyles(size = null) {
    let style = {};

    switch (size || this.state.peers.length) {
      case 0:
        style = {
          gridTemplateColumns: '1fr',
          gridAutoRows: '75%',

          alignContent: 'center',
          justifyItems: 'center',

          padding: '0 25%',
        };
        break;
      case 1:
        style = {
          gridTemplateColumns: '1fr',
          gridAutoRows: '70%',
          alignContent: 'center',
          justifyItems: 'center',
          padding: '0 45%',
        };
        break;
      case 2:
        style = {
          gridTemplateColumns: '1fr 1fr',
          gridAutoRows: '60%',
          alignContent: 'center',
          justifyItems: 'center',
          columnGap: '50px',
          padding: '0 5%',
        };
        break;
      case 3:
        style = {
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '45%',
          gridAutoRows: '45%',
          gridAutoColumns: '1fr 1fr 1fr',
          alignContent: 'center',
          justifyItems: 'center',
          columnGap: '40px',
          rowGap: '20px',
          padding: '0 10%',
        };
        break;
      case 4:
        style = {
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '45% 45%',
          alignContent: 'center',
          justifyItems: 'center',
          columnGap: '40px',
          rowGap: '20px',
          padding: '0 10%',
        };
        break;
      case 5:
        style = {
          gridTemplateColumns: '1fr 1fr 1fr',
          gridTemplateRows: '40% 40%',
          alignContent: 'center',
          justifyItems: 'center',
          columnGap: '40px',
          rowGap: '20px',
          padding: '0 10%',
        };
        break;
      default:
        style = {
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gridTemplateRows: '30% 30%',
          gridAutoRows: '30%',
          gridAutoColumns: '1fr 1fr 1fr 1fr',
          alignContent: 'center',
          justifyItems: 'center',
          columnGap: '30px',
          rowGap: '20px',
          padding: '0 10%',
        };
        break;
    }

    return style;
  }


  // Quand mohamed decide de quitter l'appel
  endCallHandler = () => {
    // on parcour la liste de peer
    this.state.peers.forEach(async (peer) => {
      // on cherche l'id de mohamed dans la liste de peers sachant que l'id de mohamed ici c : this.state.localPeerId
      if (peer.peerId === this.state.localPeerId) {
        // on detruit le peer
        peer.peerjs.destroy();

        if (peer.stream) {
          // on arrete le flux de donné
          peer.stream.getTracks().forEach((track) => {
            track.stop();
          });
        }
        // on detruit l'instance de socket
        let socketInstance = new Socket();
        socketInstance.destroy();
        this.socket.disconnect();
      }
    });
    // revenir a la page d'acceuil
    this.props.history.push('/');
  };


  // STREAM : 



  // La méthode MediaDevices.getUserMedia() invite l'utilisateur à autoriser l'utilisation d'une entrée multimédia qui produit un MediaStream avec des pistes contenant les types de médias demandés.
  setupLocalUserStream = async () => {
    sessionStorage.setItem('user',this.state.username);

    if (navigator.mediaDevices.getUserMedia) {
      try {
        let stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,



          }
        });
        // TEST
        // incrementer le nombre de peer



        var peerCpt = 0;


        // ecouter le nombre de personne connecté
        this.socket.on('nbr-peer', (cpt) => {

          peerCpt = cpt;

          localStorage.setItem("cpt", cpt);
          console.log("cpt1 " + localStorage.getItem("cpt"));


        });






        // Garder une backup de streem
        let streamBackup = stream;

        let peerjs = null;
        // Creation de nouveau peer
        peerjs = new Peer(new Date().valueOf(), {
          secure: true,
          path: '/',
        });

        // test ping || faut stocker la valeur de latence dans le


        // Esssayon de stocker le peer dans local storage est le recuperer :)



        peerjs.on('open', (id) => {


          let peer = {
            cpt: peerCpt,
            peerId: id,
            mute: false,
            video: true,
            audio: true,
            stream,
            streamBackup,
            peerjs,
            name: localStorage.getItem('username') || '',
          };

          console.log("cpt2 " + localStorage.getItem("cpt"));
          localStorage.removeItem("cpt");


          this.state.peerTest = peer.peerId;




          // repondre ou bien capté tout les stream qui exixte 
          peer.peerjs.on('call', (call) => {
            call.answer(peer.stream);

            call.on('stream', (stream) => {
              let peers = [...this.state.peers];

              console.log("call peer " + call.peer);

              if (peers.find((peer) => peer.peerId === call.peer)) {
                peers = peers.map((peer) => {
                  if (peer.peerId === call.peer) {
                    peer.stream = stream;
                  }
                  return peer;
                });

                this.setState({
                  peers,
                });
              } else {
                peers.push({
                  peerId: call.peer,
                  mute: false,
                  video: true,
                  stream,
                });

                this.setState(
                  {
                    peers,
                    callContainerStyle: this.generateChatContainerStyles(
                      peers.length
                    ),
                  },
                  () => this.sendUsernameToPeers()
                );
              }
            });
          });
          sessionStorage.setItem('user',this.state.username);

          this.setState({ peers: [peer], localPeerId: id }, () => {
            this.socket.emit('join-room', {
              peerId: this.state.localPeerId,
              roomId: this.props.match.params[0],
            });
          });
        });




        peerjs.on('error', function (err) {
          console.log('Error: ', err);
          message.error('Somthing went wrong!');
          setTimeout(() => {
            if (this.props && this.props.history) {
              this.props.history.push('/');
            }
          }, 2000);
        });
      } catch (error) {
        message.error(error.message);
        setTimeout(() => {
          if (this.props && this.props.history) {
            this.props.history.push('/');
          }
        }, 2000);
      } finally {
        this.setState({ initializing: false });
      }
    }
    console.log("taille " + this.state.peers.length);

  };

  // la methode sendUserNameToPeers 
  sendUsernameToPeers = () => {
    this.setState({
      interval: setInterval(() => {
        let peerId = this.state.localPeerId;
        let username = localStorage.getItem('username');

        if (peerId && username) {
          this.socket.emit('share-username', {
            peerId,
            username,
          });
        }
      }, 2000),
    });
  };

  componentDidMount() {
    this.socket.on('connect', async () => {
      if (localStorage.getItem('username')) {
        let style = this.generateChatContainerStyles();
        sessionStorage.setItem('user',this.state.username);
        this.setState({ callContainerStyle: style }, () => {
          this.setupLocalUserStream();
        });
      } else {
        this.setState({ modalVisible: true });
      }
    });


   
  }



  render() {
    const { username,userAudioMute, userVideo, localPeerId } = this.state;

    return (


      <div className="Chat">
        

          <div className="test1">
          <Chat socket={this.state.socket} username={this.state.username} />
          

        </div>

    
    
        <Row style={{ height: '100%', widht: '100%' }}>

  
          <Col
            span={24}
            className="chat-container"
            style={{ ...this.state.callContainerStyle }}
          >


            {this.state.peers.map((peer) => (
              <CallWindow
                {...peer}
                localPeerId={localPeerId}
                key={peer.peerId}
              ></CallWindow>
            ))}
          </Col>
          <Col span={24} className="user-controls">
            <Row justify="center" align="middle">


              <Col className="user-audio">


                <img className="share"
                  onClick={this.userShareScreenToggle} src="https://image.flaticon.com/icons/png/512/1781/1781833.png" />

              </Col>


              <Col className="user-audio">

                <img className="microphone"
                  onClick={this.userAudioMuteToggle} src="https://image.flaticon.com/icons/png/512/1168/1168107.png" />



              </Col>


              <Col className="user-hang-up">
                <img className="hang-up" onClick={this.endCallHandler} src="https://assets.dryicons.com/uploads/icon/svg/2458/shut_down.svg" />

              </Col>
              <Col className="user-video">


                <img className="video"
                  onClick={this.userVideoToggle} src="https://image.flaticon.com/icons/png/512/792/792167.png" />

              </Col>
            </Row>
          </Col>

        </Row>








        {this.state.initializing ? (
          <div className="spinner">
            <Spin size="large" />
          </div>
        ) : null}

        <Modal
          title="Please enter a friendly name"
          centered
          visible={this.state.modalVisible}
          onOk={() => {
            console.log(this.state.username);
            if (this.state.username.trim() !== '') {
              localStorage.setItem('username', this.state.username);
              let style = this.generateChatContainerStyles();

              this.setState(
                { callContainerStyle: style, modalVisible: false },
                () => {
                  this.setupLocalUserStream();
                }
              );
            } else {
              message.error('Please enter a friendly name!');
            }
          }}
          onCancel={() => {
            this.setState({ modalVisible: false }, () => {
              this.props.history.push('/');
            });
          }}
        >
          <Input
            type="text"
            placeholder="Friendly name..."
            value={this.state.username}
            onChange={(e) => {
              let username = e.target.value;
              this.state.username = username;
              this.setState({ username });
            }}
          />
        </Modal>



      </div>



    );
  }

  componentWillUnmount() {
    if (this.state.interval) {
      clearInterval(this.state.interval);
    }
  }

}



export default Call;
