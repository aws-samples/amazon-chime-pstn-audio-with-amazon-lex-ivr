import cdkExports from './cdk-outputs.json';

export const configData = cdkExports.ChimeLexIVR;

export const AmplifyConfig = {
    API: {
        endpoints: [
            {
                name: 'queryAPI',
                endpoint: configData.APIURL,
            },
        ],
    },
};
