#!/bin/bash -xe
IP=$( jq -r '.IP' /etc/config.json )
SMA_VOICE_CONNECTOR=$( jq -r '.SMAVoiceConnector' /etc/config.json )
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
LOCAL_HOSTNAME=$( curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/public-hostname )
INSTANCE_ID=$( curl -H "X-aws-ec2-metadata-token: $TOKEN" -v http://169.254.169.254/latest/meta-data/instance-id )

sed -i "s/IP_ADDRESS/$IP/g" /etc/asterisk/pjsip.conf
sed -i "s/INSTANCE_ID/$INSTANCE_ID/g" /etc/asterisk/pjsip.conf
sed -i "s/SMA_VOICE_CONNECTOR/$SMA_VOICE_CONNECTOR/g" /etc/asterisk/pjsip.conf

cd /etc/polly/
pip3 install boto3

python3 /etc/polly/createWav.py -file science -text 'Thank you for calling science department. Goodbye.'
python3 /etc/polly/createWav.py -file art -text 'Thank you for calling art department. Goodbye.'
python3 /etc/polly/createWav.py -file history -text 'Thank you for calling history department. Goodbye.'
python3 /etc/polly/createWav.py -file math -text 'Thank you for calling math department. Goodbye.'
python3 /etc/polly/createWav.py -file unknown -text "Thank you for calling.  Sorry I couldn't find a department"

groupadd asterisk
useradd -r -d /var/lib/asterisk -g asterisk asterisk
usermod -aG audio,dialout asterisk
chown -R asterisk.asterisk /etc/asterisk
chown -R asterisk.asterisk /var/lib/asterisk/sounds/en
chown -R asterisk.asterisk /var/{lib,log,spool}/asterisk

systemctl start asterisk

