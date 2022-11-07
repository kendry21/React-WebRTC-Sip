import React, { useEffect, useState } from "react";
import { Button, Grid, Collapse, TextField, InputAdornment, OutlinedInput, Dialog, DialogTitle,
  DialogContent, DialogActions, InputLabel  } from '@mui/material'
import { Call, CallEnd, Backspace, VolumeMute, VolumeOff, Login, Logout, DialerSip, PhoneForwarded } from '@mui/icons-material';

import {Editor, EditorState} from 'draft-js';
import "draft-js/dist/Draft.css";

import ringer from "./telephone-ring-04.mp3";
const JsSIP = require('jssip')
//JsSIP.debug.disable('JsSIP:*');

function App() {

  //login
  const [extension, setExtension] = useState('bob');
  const [servidor, setServidor] = useState('192.168.56.102');
  const [contrasena, setContrasena] = useState('123456');
  const [puerto, setPuerto] = useState('8089');

  const [coolPhone, setCoolPhone] = useState();
  const [laSesion, setLaSesion] = useState('');
  const [error, setError] = useState('');

  //in call options
  const [isMute, setIsMute] = useState(false);
  const [inCall, setinCall] = useState(false);
  const [number, setNumber] = useState('lucy');
  const [nombre, setnombre] = useState('');
  const [transfer, setTransfer] = useState('ken');
 
  //dialogs and panels
  const [showLogin, setShowLogin] = useState(true);
  const [showPhone, setShowPhone] = useState(false);
  const [openDialogCall, setOpenDialogCall] = useState(false);
  const [openDialogRinging, setOpenDialogRinging] = useState(false);
  const [openDialogCalling, setOpenDialogCalling] = useState(false);

  //notes
  const [editorState, setEditorState] = React.useState(() => EditorState.createEmpty());

  //in call time
  const [seconds, setSeconds] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [hours, setHours] = useState(0);

  //audio
  const [ringingAudio, setRingingAudio] = useState(new Audio(ringer));
  ringingAudio.loop = true

  const editor = React.useRef(null);
  function focusEditor() {
    editor.current.focus();
  }

  const  callOptions = {
    mediaConstraints: {
      audio: true, // only audio calls
      video: false
    },
    /*
    pcConfig: {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ]
    }
    */
  };

  useEffect(() => {
    let interval = null;
    if (inCall) {
      interval = setInterval(() => {
        setSeconds(seconds => seconds + 1);
        if(seconds === 59)
        { 
          setMinutes(minutes => minutes + 1)
          setSeconds(0)
        }
        if(minutes === 59)
        { 
          setHours(hours => hours + 1)
          setMinutes(0)
        }
      }, 1000);
    } else if (!inCall) {
      clearInterval(interval);      
    }
    return () => clearInterval(interval);
  }, [inCall, minutes,seconds]);

  const login = () => {

    try
    {
      console.log("server " + servidor + " port " + puerto)
      let domain = servidor;
      let port = puerto;
      let socket = new JsSIP.WebSocketInterface('wss://' + domain + ':' + port + '/ws');
  
      var configuration = {
        sockets  : [ socket ],
        uri      : 'sip:'+ extension +'@' + domain,
        password : contrasena,
        display_name: extension
      };
  
      var ua = new JsSIP.UA(configuration);

      ua.start();
      setCoolPhone(ua)
      
      ua.on('connected', function(e){        
        console.log('connected'); 
      });
   
       ua.on('disconnected', function(e){       
       console.log('disconnected ');  
       setError('disconnected')
     });
   
     ua.on('registered', function(e){ 
       console.log('registered');  
       setShowPhone(true)
       setShowLogin(false)
     });
     
     ua.on('unregistered', function(e){        
       setError('unregistered ')
     });
     
     ua.on('registrationFailed', function(e){        
       setError(error + '\n' + 'Registering on SIP server failed with error: ' + e.cause)
     });

     //incoming call
    var remoteAudio = new window.Audio();    
    remoteAudio.autoplay = true;

    ua.on("newRTCSession", function(data){

      var session = data.session; 
      setnombre(session.remote_identity._display_name)

      if (session.direction === "incoming") {
          
          handleIncomingCall(session);
          setLaSesion(session)

          session.on("connecting",function(){
            console.log('connecting')  
          });

          session.on("sending",function(){
            console.log('sending')  
          });

          session.on("progress",function(){
            console.log('progress')  
          });

          session.on("accepted",function(){
            console.log('the call has been answered')  
          });

          session.on("confirmed",function(){
              console.log('this handler will be called for incoming calls too') 
              var localStream = session.connection.getLocalStreams()[0];
              var dtmfSender = session.connection.createDTMFSender(localStream.getAudioTracks()[0])
              session.sendDTMF = function(tone){
                dtmfSender.insertDTMF(tone);
              };
          });

          session.on("ended",function(){
              console.log('ended')  
              handleEndCall()
          });

          session.on("failed",function(e){
              console.log('call failed with cause: ' + (e ? e.cause : 'no cause'), e);          
                setOpenDialogRinging(false)
          }); 
          
          session.on('peerconnection', function(data) {
            console.log('event peerconnection')
            data.peerconnection.addEventListener('addstream', function(e){
              remoteAudio.srcObject=e.stream;
            });
          });
      }
    });

    } catch(e) 
    {
      console.log(e)
      console.error(e)    
    }
  };

  const HandleLogOut = () => {
    try {

        let _ua = coolPhone;
        
        _ua.stop();
        
        _ua.on('disconnected', function (e) {
          setShowPhone(false)
          setShowLogin(true)
          console.log('disconnected bob', e)     
        })

        _ua.on('unregistered', function (e) {
          setShowPhone(false)
          setShowLogin(true)
          console.log('unregistered bob')     
        })

        _ua.on('registrationFailed', function (e) {
          setShowPhone(false)
          setShowLogin(true)
          console.log('registrationFailed bob', e)     
        })

        _ua.on('registrationExpiring', function (e) {
          setShowPhone(false)
          setShowLogin(true)
          console.log('registrationExpiring bob', e)     
        })
      
        

    } catch(e) 
    {
      console.error(e)
    }
  };

  const handleCall = () => {
    try {
      const _eventHandlers = {
        'progress': function (e) {
            console.log('call is in progress');
            setOpenDialogCalling(true)
        },
        'failed': function (e) {
            console.log('call failed with cause: ' + (e ? e.cause : 'no cause'), e);
            setOpenDialogCalling(false)
        },
        'ended': function (e) {
            console.log('call ended with cause: ' + (e ? e.cause : 'no cause'), e);
            handleEndCall() 
        },
        'requestFailed': function (e) {
          console.log('call request Failed with cause: ' + (e ? e.cause : 'no cause'), e);
        },
        'accepted': function (e) {
          console.log('call accepted ');
        },
        'confirmed': function (e) {
            console.log('call confirmed');
            setOpenDialogCall(true)
            setOpenDialogCalling(false)
            setinCall(true)
        }
    };

    var _callOptions = {
      eventHandlers: _eventHandlers,
      mediaConstraints: {audio: true, video: false},
      /*
      pcConfig: {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] },
          {
            urls: "turn:openrelay.metered.ca:80",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
          {
            urls: "turn:openrelay.metered.ca:443",
            username: "openrelayproject",
            credential: "openrelayproject",
          },
        ]
      }
      */
    };

      const audio = new window.Audio()
      let ua = coolPhone;

      let target = 'sip:'+ number +'@' + servidor      

      let session = ua.call(target, _callOptions);  
      setLaSesion(session)

      if (session.connection) {
          session.connection.addEventListener('addstream', e => {
              console.log('Add stream')
              audio.srcObject = e.stream
              audio.play()
              setinCall(true)
              setLaSesion(session)
              setnombre(number)
          })
  
          session.on('addstream', function(e){
            console.log('Add stream2')
              // set remote audio stream (to listen to remote audio)
              // remoteAudio is <audio> element on page
              const remoteAudio = audio
              remoteAudio.src = window.URL.createObjectURL(e.stream);
              remoteAudio.play();
          });
          session.connection.addEventListener('peerconnection', e => {
              console.log('Peer connection')
              audio.srcObject = e.stream
              audio.play()
          })
      } else {
          console.log('Connection is null')
      }      
    } catch(e) 
    {
      console.error(e)
    }
  };

  const handleIncomingCall = (session) => {
    setOpenDialogRinging(true)
    ringingAudio.play()
  };

  const handleAnswerCall = () => {
    setinCall(true)  
    setOpenDialogCall(true)  
    setOpenDialogRinging(false)

    var session = laSesion
    session.answer(callOptions);

    ringingAudio.pause()
  };

  const handleEndCall = () => { 
    setinCall(false)    
    let time =hours +':'+ minutes +':'+ seconds;
    setOpenDialogCalling(false)
    setOpenDialogRinging(false)

    var session = laSesion
    if(session != ""){
      if(!session.isEnded()){
        session.terminate();
      }
    }
        
    ringingAudio.pause()   
  };

  const handleMuteEvent = () => {
    var session = laSesion;
    if(session.isMuted().audio){
        session.unmute({audio: true});
    }else{
        session.mute({audio: true});   
    }

    isMute === true ? setIsMute(false) : setIsMute(true)   
  };

  const handleTransferCall = () => {
    //let notas = editorState.getCurrentContent().getPlainText('\u0001')
    console.log("inicia transferencia")

    const _eventHandlers = {
      'accepted': function (e) {
          console.log('eventHandler: transfer call accepted');
      },

      'failed': function (e) {
          console.log('eventHandler: transfer call failed with cause: ' + (e ? e.cause : 'no cause'), e);
      },

      'ended': function (e) {
        console.log('eventHandler: call ended with cause: ' + (e ? e.cause : 'no cause'), e);
      },

      'requestFailed': function (e) {
          console.log('eventHandler: transfer call request Failed with cause: ' + (e ? e.cause : 'no cause'), e);
      },

      'requestSucceeded': function (e) {
        console.log('eventHandler: transfer call request Succeeded');
      },

      'trying': function (e) {
        console.log('eventHandler: transfer call trying');
      },

      'progress': function (e) {
        console.log('transfer call progress');
      },

      'confirmed': function (e) {
          console.log('transfer call confirmed');
      },
      'addstream': (e) => {
        console.log('transfer call addstream');
      }
  };

  var _callOptions = {
    eventHandlers: _eventHandlers,
    mediaConstraints: {audio: true, video: false},
    /*
    pcConfig: {
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ]
    }
    */
  };

    let target = 'sip:'+ transfer +'@' + servidor
    let session = laSesion;
    let transferencia = session.refer(target, _callOptions)  
    setOpenDialogCall(false)

  };

  const handleSaveNotes = () => {
    let notas = editorState.getCurrentContent().getPlainText('\u0001')
    //console.log(notas)
  };

  const handleCloseDialog = () => {
    setOpenDialogCall(false)
    setSeconds(0)
    setMinutes(0)
    setHours(0)
  };

  const handlePreventClose = () => {
    setOpenDialogCall(true)
  };

  const handlePreventCloseRinging = () => {
    setOpenDialogRinging(true)
  };

  const handlePreventCloseCalling = () => {
    setOpenDialogCalling(true)
  };

  const handleAddNumber = (digitado) => {
    let numero = number
    numero += digitado
    setNumber(numero)
  };

  const handleEraseLastInput = () => {
    let numero = number.substring(0, number.length - 1); 
    setNumber(numero)
  };

  const handleEraseInput = () => {
    setNumber('')
  };

  const ColoredLine = ({ color }) => (
    <hr
        style={{
            color: color,
            backgroundColor: color,
            height: 5
        }}
    />
  );

  return (
    <div >
      jsSIP - Bob
      <br/><br/>
      <Collapse in={showLogin}>
        <Grid container spacing={2} direction="row" >
          <Grid id="Contacto" item lg={1} md={6} sm={6} xs={6}>
            <InputLabel >{'Extension'}</InputLabel>
          </Grid>
          <Grid id="Contacto" item lg={1} md={6} sm={6} xs={6}>
            <TextField 
              variant="outlined" 
              size="small"
              value={extension} 
              onChange={e => setExtension(e.target.value)}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} direction="row">
          <Grid  item lg={1} md={6} sm={6} xs={6}>
              <InputLabel >{'Contraseña'}</InputLabel>
          </Grid>
              <Grid item lg={1} md={6} sm={6} xs={6}>
              <TextField variant="outlined" size="small" placeholder="*****" value={contrasena} onChange={e => setContrasena(e.target.value)}/>
          </Grid>
        </Grid>

        <Grid container spacing={2} direction="row">
          <Grid  item lg={1} md={6} sm={6} xs={6}>
              <InputLabel >{'Servidor'}</InputLabel>
          </Grid>
          <Grid item lg={1} md={6} sm={6} xs={6}>
            <TextField variant="outlined" size="small" placeholder="192.168.0.10" value={servidor} onChange={e => setServidor(e.target.value)}/>
          </Grid>
        </Grid>

        <Grid container spacing={2} direction="row">
          <Grid item lg={1} md={6} sm={6} xs={6}>
            <InputLabel >{'Puerto'}</InputLabel>
          </Grid>
          <Grid  item lg={1} md={6} sm={6} xs={6}>
            <TextField variant="outlined" size="small" placeholder="8089" value={puerto} onChange={e => setPuerto(e.target.value)}/>
          </Grid>
        </Grid>

        <br/><br/>
        <Button type="submit" style={{ width: '5%' }} variant="contained" onClick={() => login()}>
           <Login>{}</Login>
        </Button>
        <Grid>
          {'Login Asterisk'} 
        </Grid>
        <br/><br/>
        <Grid>
          {error} 
        </Grid>
      </Collapse>
      <br/><br/>
        
      <Collapse in={showPhone}>
          <Grid>
            <Button variant="contained" onClick={() => handleCall()} >
            <DialerSip>{}</DialerSip>
            </Button>
          </Grid>

          <br/>
          <Grid >
            <OutlinedInput 
              size="small" 
              style={{ width: 190 }}  
              id="outlined-adornment-weight"
              onChange={e => setNumber(e.target.value)}
              endAdornment=
              {
                <InputAdornment position="end">
                <Backspace onClick={() => handleEraseLastInput()}></Backspace>
                </InputAdornment>
              }
              value={number}
            />

            <Grid>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('1')} >
                <span>{ "1"}</span>
              </Button>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('2')}>
                <span>{ "2"}</span>
              </Button>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('3')}>
                <span>{ "3"}</span>
              </Button>
            </Grid>

            <Grid>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('4')}>
                <span>{ "4"}</span>
              </Button>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('5')}>
                <span>{ "5"}</span>
              </Button>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('6')}>
                <span>{ "6"}</span>
              </Button>
            </Grid>

            <Grid>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('7')}>
                <span>{ "7"}</span>
              </Button>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('8')}>
                <span>{ "8"}</span>
              </Button>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('9')}>
                <span>{ "9"}</span>
              </Button>
            </Grid>

            <Grid>
              <Button type="submit" variant="contained" onClick={() => handleEraseLastInput()}>
              <Backspace>{}</Backspace>
              </Button>
              <Button type="submit" variant="contained" onClick={() => handleAddNumber('0')}>
                <span>{ "0"}</span>
              </Button>
              <Button type="submit"  variant="contained" onClick={() => handleEraseInput('0')}>
              <span>{ "C"}</span>
              </Button>
            </Grid>
          </Grid>
          <br/>
          <Button variant="contained" onClick={() => HandleLogOut()} >
            <Logout>{}</Logout>
          </Button>
      </Collapse>

      <br/>
      <Dialog
                open={openDialogCall}
                onClose={() => handlePreventClose()}
                sx={{
                  "& .MuiDialog-container": {
                    "& .MuiPaper-root": {
                      width: "100%",
                      maxWidth: "500px",
                    },
                  },
                }}
            >
                <DialogTitle id="titulo">{inCall === true ? 'Llamada en curso':'Llamada finalizada' }</DialogTitle>
                <DialogContent>
                <Grid container spacing={0} direction="row"  >
                    <Grid id="Contacto" item lg={8} md={6} sm={6} xs={6}>
                        {nombre} <label style={{ color: 'black' }}><strong>{} </strong></label>
                        <br/>             
                    </Grid>

                    <Grid  id="ContactoDerecha" item lg={4} md={6} sm={6} xs={6}>
                      {hours}:{minutes}:{seconds} &nbsp;
                      <Button type="submit" style={{backgroundColor: 'red', width: '60%' }} variant="contained" onClick={() => handleEndCall()}>
                        <CallEnd>{}</CallEnd>
                      </Button>
                    </Grid>
                    
                </Grid>
                <ColoredLine color="black" />

                <Grid container spacing={0} direction="row">

                  <Grid item lg={8} md={6} sm={6} xs={6} >  
                    <Collapse in={isMute && inCall}>
                          <Button type="submit" onClick={() => handleMuteEvent()} title='Audio'>
                            <VolumeOff>{}</VolumeOff>
                          </Button>
                          <Grid>
                            {'Mic'} 
                          </Grid>
                    </Collapse>
                    
                    <Collapse in={!isMute && inCall} >
                          <Button type="submit" onClick={() => handleMuteEvent()} title='Silenciar'>
                            <VolumeMute>{}</VolumeMute>
                          </Button>
                          <Grid>
                            {'Mic'} 
                          </Grid>
                    </Collapse>

                    <Button type="submit" onClick={() => handleTransferCall()} title='Transferir Llamada'>
                            <PhoneForwarded>{}</PhoneForwarded>
                          </Button>
                          <Grid>
                            {'Transfer'} 
                          </Grid>
                          <TextField variant="outlined" size="small" value={transfer} onChange={e => setTransfer(e.target.value)}/>
                    </Grid>

                </Grid>

                <br/><br/>
                <Grid >
                <strong>{'Notas'} </strong>
                  <div
                        style={{ border: "1px solid black", minHeight: "6em", cursor: "text" }}
                        onClick={focusEditor}
                      >
                          <Editor
                            ref={editor}
                            editorState={editorState}
                            onChange={setEditorState}
                            placeholder="Agregue notas de la llamada"
                          />
                  </div>
                </Grid>
                </DialogContent>

                <DialogActions>
                  <Collapse in={!inCall} >
                      <Button variant="contained" onClick={() => handleSaveNotes()} >Guardar Notas</Button>&nbsp;&nbsp;
                      <Button variant="contained" onClick={() => handleCloseDialog()} autoFocus >Salir</Button>
                  </Collapse> 
                </DialogActions>
      </Dialog>

      <Dialog
                open={openDialogRinging}
                onClose={() => handlePreventCloseRinging()}
                sx={{
                  "& .MuiDialog-container": {
                    "& .MuiPaper-root": {
                      width: "100%",
                      maxWidth: "500px",
                    },
                  },
                }}
            >
                <DialogTitle>{'Incomming Call'}</DialogTitle>
                <DialogContent>
                  <Grid>
                    {nombre} 
                  </Grid>
                  <Grid>
                    {'200'} 
                  </Grid>
                  <Button type="submit" variant="contained" style={{ backgroundColor: 'green' }} onClick={() => handleAnswerCall()}>
                    <Call>{}</Call>
                  </Button>
                  <Button type="submit" variant="contained" style={{ backgroundColor: 'red' }} onClick={() => handleEndCall()}>
                    <CallEnd>{}</CallEnd>
                  </Button>
                </DialogContent>
      </Dialog>

      <Dialog
                open={openDialogCalling}
                onClose={() => handlePreventCloseCalling()}
                sx={{
                  "& .MuiDialog-container": {
                    "& .MuiPaper-root": {
                      width: "100%",
                      maxWidth: "500px",
                    },
                  },
                }}
            >
                <DialogTitle>{'Calling'}</DialogTitle>
                <DialogContent>
                  <Grid>
                    {number} 
                  </Grid>
                  <br/>
                  <Button type="submit" variant="contained" style={{ backgroundColor: 'red' }} onClick={() => handleEndCall()}>
                    <CallEnd>{}</CallEnd>
                  </Button>
                </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
