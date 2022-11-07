# Features
- Call extensions
- Transfer call to third extension
- Mute call
- Add notes during call

# Requeriments
You will need a sip server to use the application.

## Install Asterisk server.
Install a Ubuntu server 16.04.7 LTS
Download and install Asterisk

## Add certificates.

## Modify asterisk files

### /etc/asterisk/http.conf
[general] <br />
enabled=yes <br />
bindaddr=0.0.0.0 <br />
bindport=8088 <br />
tlsenable=yes <br />
tlsbindaddr=0.0.0.0:8089 <br />
tlscertfile=/etc/asterisk/keys/asterisk.pem <br />

### /etc/asterisk/extensions.conf
[default]
exten => bob,1,Dial(PJSIP/${EXTEN}) <br />
exten => lucy,1,Dial(PJSIP/${EXTEN}) <br />

### /etc/asterisk/rtp.conf
[general] <br />
rtpstart=10000 <br />
rtpend=20000 <br />
stunaddr=stun.l.google.com:19302 <br />

### /etc/asterisk/pjsip.conf
[transport_wss] <br />
type=transport <br />
bind=0.0.0.0 <br />
protocol=wss <br />

[bob] <br />
type=aor <br />
max_contacts=1 <br />

[bob] <br />
type=auth <br />
auth_type=userpass <br />
username=bob <br />
password=123456 ; This is an insecure password <br />

[bob] <br />
type=endpoint <br />
context=default <br />
direct_media=no <br />
allow=!all,ulaw,vp8,h264 <br />
aors=bob <br />
auth=bob <br />
max_audio_streams=10 <br />
max_video_streams=10 <br />
webrtc=yes <br />
dtls_cert_file=/etc/asterisk/keys/asterisk.pem <br />
dtls_ca_file=/etc/asterisk/keys/ca.crt <br />

[lucy] <br />
type=aor <br />
max_contacts=1 <br />

[lucy] <br />
type=auth <br />
auth_type=userpass <br />
username=lucy <br />
password=123456 ; This is an insecure password <br />

[lucy]
type=endpoint <br />
context=default <br />
direct_media=no <br />
allow=!all,ulaw,vp8,h264 <br />
aors=lucy <br />
auth=lucy <br />
max_audio_streams=10 <br />
max_video_streams=10 <br />
webrtc=yes <br />
dtls_cert_file=/etc/asterisk/keys/asterisk.pem <br />
dtls_ca_file=/etc/asterisk/keys/ca.crt <br />

## Application
```sh
git clone https://github.com/kendry21/React-WebRTC-Sip.git <br />
npm install <br />
npm build <br />
```sh
