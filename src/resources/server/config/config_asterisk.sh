#!/bin/bash -xe

PUBLIC_IP=$( jq -r '.IP' /etc/config.json )
VOICE_CONNECTOR=$( jq -r '.VOICE_CONNECTOR' /etc/config.json )
PHONE_NUMBER=$( jq -r '.PHONE_NUMBER' /etc/config.json )
STACK_ID=$( jq -r '.STACK_ID' /etc/config.json )

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/tmp/amazon-cloudwatch-agent.json

sed -i "s/PUBLIC_IP/$PUBLIC_IP/g" /etc/asterisk/pjsip.conf
sed -i "s/VOICE_CONNECTOR/${VOICE_CONNECTOR}/g" /etc/asterisk/pjsip.conf
sed -i "s/PHONE_NUMBER/$PHONE_NUMBER/g" /etc/asterisk/extensions.conf
sed -i "s/PHONE_NUMBER/$PHONE_NUMBER/g" /etc/asterisk/pjsip.conf
sed -i "s/STACK_ID/$STACK_ID/g" /etc/asterisk/pjsip.conf 

echo "VOICE_CONNECTOR: ${VOICE_CONNECTOR}"
echo "STACK_ID: ${STACK_ID}"
echo "PHONE_NUMBER: ${PHONE_NUMBER}"

cd /etc/polly/
pip3 install boto3

python3 /etc/polly/createWav.py -file science -text 'Thank you for calling science department. Goodbye.'
python3 /etc/polly/createWav.py -file art -text 'Thank you for calling art department. Goodbye.'
python3 /etc/polly/createWav.py -file history -text 'Thank you for calling history department. Goodbye.'
python3 /etc/polly/createWav.py -file math -text 'Thank you for calling math department. Goodbye.'
python3 /etc/polly/createWav.py -file unknown -text "Thank you for calling.  Sorry I couldn't find a department"

usermod -aG audio,dialout asterisk
chown -R asterisk.asterisk /etc/asterisk
chown -R asterisk.asterisk /var/{lib,log,spool}/asterisk

echo '0 * * * * /sbin/asterisk -rx "core reload"' > /etc/asterisk/crontab.txt 
crontab /etc/asterisk/crontab.txt

systemctl restart asterisk
/sbin/asterisk -rx "core reload"

cd /home/ubuntu/site
yarn && yarn run build
chown ubuntu:ubuntu . -R
chown ubuntu:ubuntu /var/www/html/. -R
systemctl enable nginx
systemctl restart nginx