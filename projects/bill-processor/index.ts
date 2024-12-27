import {
  Context,
  APIGatewayProxyResult,
  SelfManagedKafkaEvent,
} from 'aws-lambda';

/**
 * Our AWS Lambda function responsible for processing an uploaded bill receipt
 */
export const handler = async (
  event: SelfManagedKafkaEvent,
  context: Context,
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', event);
  console.log('Context', context);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: event.records,
    }),
  };
};
