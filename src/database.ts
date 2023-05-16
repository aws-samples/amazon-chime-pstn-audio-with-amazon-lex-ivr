import { RemovalPolicy } from 'aws-cdk-lib';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import {
  AwsCustomResource,
  PhysicalResourceId,
  AwsCustomResourcePolicy,
} from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export class Database extends Construct {
  public departmentDirectory: Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.departmentDirectory = new Table(this, 'departmentDirectory', {
      partitionKey: {
        name: 'department_name',
        type: AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'TTL',
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    new AwsCustomResource(this, 'initTable', {
      installLatestAwsSdk: false,
      onCreate: {
        service: 'DynamoDB',
        action: 'batchWriteItem',
        parameters: {
          RequestItems: {
            [this.departmentDirectory.tableName]: [
              {
                PutRequest: {
                  Item: {
                    department_name: { S: 'science' },
                    service: { S: 'voiceConnector' },
                    number: { S: '600100' },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    department_name: { S: 'art' },
                    service: { S: 'voiceConnector' },
                    number: { S: '600200' },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    department_name: { S: 'history' },
                    service: { S: 'voiceConnector' },
                    number: { S: '600300' },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    department_name: { S: 'math' },
                    service: { S: 'voiceConnector' },
                    number: { S: '600400' },
                  },
                },
              },
            ],
          },
        },
        physicalResourceId: PhysicalResourceId.of(
          this.departmentDirectory.tableName + '_initialization',
        ),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}
