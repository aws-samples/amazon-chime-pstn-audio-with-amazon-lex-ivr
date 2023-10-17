import React from 'react';
import { TextContent } from '@cloudscape-design/components';

const LexData = ({ lexInfo }) => {
    console.log('In Lex Data');
    console.log(`LexInfo: ${lexInfo}`);
    return (
        <TextContent>
            <h2>Information from Lex</h2>
            <h5>Department Selected: {lexInfo}</h5>
        </TextContent>
    );
};

export default LexData;
