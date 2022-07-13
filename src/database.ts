import { RemovalPolicy } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export class Database extends Construct {
  public departmentDirectory: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.departmentDirectory = new dynamodb.Table(this, 'departmentDirectory', {
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
                  Item: {
                    department_name: { S: 'science' },
                    service: { S: 'voiceConnector' },
                    number: { S: '+5550100' },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    department_name: { S: 'art' },
                    service: { S: 'voiceConnector' },
                    number: { S: '+5550101' },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    department_name: { S: 'history' },
                    service: { S: 'voiceConnector' },
                    number: { S: '+5550102' },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    department_name: { S: 'math' },
                    service: { S: 'voiceConnector' },
                    number: { S: '+5550103' },
                  },
                },
              },
            ],
          },
        },
        physicalResourceId: cr.PhysicalResourceId.of(
          this.departmentDirectory.tableName + '_initialization',
        ),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });
  }
}
