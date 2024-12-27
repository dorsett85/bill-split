import { Kafka, Partitioners, Producer, RecordMetadata } from 'kafkajs';

type Topics = 'bills';

const kafka = new Kafka({
  clientId: 'gateway',
  brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
});

const producer = kafka.producer({
  createPartitioner: Partitioners.DefaultPartitioner,
});

export class KafkaService {
  private producer: Producer;

  constructor() {
    this.producer = producer;
  }

  /**
   * Post messages to Kafka
   */
  public async publish(
    topic: Topics,
    value: Record<string, unknown>,
  ): Promise<RecordMetadata[]> {
    await this.producer.connect();
    const res = await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(value) }],
    });
    await this.producer.disconnect();

    return res;
  }
}

/**
 * We'll only use this consumer for development purposes, otherwise our aws
 * lambda will be the direct consumer.
 */
const developmentConsumer = kafka.consumer({
  groupId: 'bill-processor',
});

export const startDevelopmentConsumer = async () => {
  await developmentConsumer.connect();
  await developmentConsumer.subscribe({ topic: 'bills' });
  await developmentConsumer.run({
    async eachMessage({ message }) {
      const messageData = JSON.parse(message.value?.toString() ?? '');
      console.log('parsed message:', messageData);

      const res = await fetch(process.env.BILL_PROCESSOR_URL ?? '', {
        method: 'POST',
        body: JSON.stringify({
          records: [messageData],
        }),
      });
      const data = await res.json();
      console.log('response data:', data);
    },
  });
};
