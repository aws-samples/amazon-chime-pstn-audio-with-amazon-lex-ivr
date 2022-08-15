// Create service client module using ES6 syntax.
var REGION = process.env['REGION'];

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
// Create an Amazon DynamoDB service client object.
const ddbClient = new DynamoDBClient({ region: REGION });
export { ddbClient };
