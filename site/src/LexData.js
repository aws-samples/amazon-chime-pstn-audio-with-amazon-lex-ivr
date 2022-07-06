import React, { useEffect, useState } from 'react';
import { phoneStore } from 'react-sip-phone';
import Button from 'aws-northstar/components/Button';
import { AmplifyConfig } from './Config';
import 'react-sip-phone/dist/index.css';
import { Amplify } from 'aws-amplify';
import Container from 'aws-northstar/layouts/Container';

Amplify.configure(AmplifyConfig);

const LexData = () => {
    const [lexDepartment, setLexDepartment] = useState('');

    useEffect(() => {
        const phoneStoreUnsubscribe = phoneStore.subscribe(() => {
            const phoneStoreState = phoneStore.getState();
            const phoneStoreStateSipSessions = phoneStoreState.sipSessions;
            const phoneStoreStateSipSessionsStateChanged = phoneStoreStateSipSessions.stateChanged;
            if (phoneStoreStateSipSessionsStateChanged !== null) {
                const phoneStoreState = phoneStore.getState();
                const phoneStoreStateSipSessions = phoneStoreState.sipSessions.sessions;
                const incomingCallId = Object.keys(phoneStoreStateSipSessions)[0];
                if (incomingCallId) {
                    console.log(`sessionStateChanged -> incomingCallId: `, incomingCallId);
                    const currentSession = phoneStoreStateSipSessions[incomingCallId];
                    console.log(`onIncomingCall -> currentSession `, currentSession);
                    const incomingInviteRequest = currentSession.incomingInviteRequest;
                    const inviteHeaders = incomingInviteRequest.message.headers;
                    console.log(`onIncomingCall -> inviteHeaders `, inviteHeaders);
                    const xLexInfo = inviteHeaders['X-Lexinfo']?.[0]?.['raw'];
                    console.log(`onIncomingCall -> xLexInfo:`, xLexInfo);
                    setLexDepartment(xLexInfo);
                }
            }
        });
        return phoneStoreUnsubscribe;
    }, []);

    return (
        <Container
            title="Lex Data"
            style={{ height: '350px', width: '400px', marginLeft: '50px', marginTop: '50px' }}
            actionGroup={
                <div>
                    <Button variant="primary" onClick={() => setLexDepartment('')}>
                        Clear
                    </Button>
                </div>
            }
        >
            Department: {lexDepartment}
        </Container>
    );
};
export default LexData;
