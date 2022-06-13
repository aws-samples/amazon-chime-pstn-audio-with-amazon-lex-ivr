import { RemovalPolicy, Names } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class Database extends Construct {
  public readonly userDirectory: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.userDirectory = new dynamodb.Table(this, 'userDirectory', {
      tableName: 'UserDirectory' + Names.uniqueId(this).toLowerCase().slice(-8),
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'TTL',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
  }
}
