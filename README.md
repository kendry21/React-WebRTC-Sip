# Requeriments
You will need a sip server to use the application.

## Install Asterisk server.
Install a Ubuntu server 16.04.7 LTS
Download and install Asterisk

## Add certificates.

## Modify asterisk files

### /etc/asterisk/http.conf
[general]
enabled=yes

bindaddr=0.0.0.0 <br />
bindport=8088 <br />
tlsenable=yes <br />
tlsbindaddr=0.0.0.0:8089 <br />
tlscertfile=/etc/asterisk/keys/asterisk.pem <br />


### /etc/asterisk/extensions.conf
[default]
exten => bob,1,Dial(PJSIP/${EXTEN})
exten => lucy,1,Dial(PJSIP/${EXTEN})

### /etc/asterisk/rtp.conf
[general]
rtpstart=10000
rtpend=20000
stunaddr=stun.l.google.com:19302

### /etc/asterisk/pjsip.conf
[transport_wss]
type=transport
bind=0.0.0.0
protocol=wss

[bob]
type=aor
max_contacts=1

[bob]
type=auth
auth_type=userpass
username=bob
password=123456 ; This is an insecure password

[bob]
type=endpoint
context=default
direct_media=no
allow=!all,ulaw,vp8,h264
aors=bob
auth=bob
max_audio_streams=10
max_video_streams=10
webrtc=yes
dtls_cert_file=/etc/asterisk/keys/asterisk.pem
dtls_ca_file=/etc/asterisk/keys/ca.crt

[lucy]
type=aor
max_contacts=1

[lucy]
type=auth
auth_type=userpass
username=lucy
password=123456 ; This is an insecure password

[lucy]
type=endpoint
context=default
direct_media=no
allow=!all,ulaw,vp8,h264
aors=lucy
auth=lucy
max_audio_streams=10
max_video_streams=10
webrtc=yes
dtls_cert_file=/etc/asterisk/keys/asterisk.pem
dtls_ca_file=/etc/asterisk/keys/ca.crt




## Code
Download the project
npm build
npm install

npm install --save draft-js react react-dom

npm run build


