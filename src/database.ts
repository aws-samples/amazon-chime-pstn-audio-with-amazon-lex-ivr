import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export class Database extends Construct {
  public readonly userDirectory: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.userDirectory = new dynamodb.Table(this, 'userDirectory', {
      tableName: 'Departments',
      partitionKey: {
        name: 'department_name',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'TTL',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    new cr.AwsCustomResource(this, 'initTable', {
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            Departments: [
              {
                PutRequest: {
                  Item: { department_name: { S: 'science' } },
                },
              },
              {
                PutRequest: {
                  Item: { department_name: { S: 'art' } },
                },
              },
              {
                PutRequest: {
                  Item: { department_name: { S: 'history' } },
                },
              },
              {
                PutRequest: {
                  Item: { department_name: { S: 'math' } },
                },
              },
            ],
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          this.userDirectory.tableName + '_initialization',
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}
