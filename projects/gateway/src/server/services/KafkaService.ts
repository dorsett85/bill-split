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
export const startDevelopmentConsumer = async () => {
  const topic: Topics = 'bills';
  const developmentConsumer = kafka.consumer({
    groupId: 'bill-processor',
  });

  await developmentConsumer.connect();
  await developmentConsumer.subscribe({ topic, fromBeginning: false });
  await developmentConsumer.run({
    async eachMessage({ message }) {
      const event: SelfManagedKafkaEvent = {
        eventSource: 'SelfManagedKafka',
        bootstrapServers: '',
        records: {
          [topic]: [
            {
              topic,
              partition: 1,
              offset: +message.offset,
              timestamp: +message.timestamp,
              timestampType: 'CREATE_TIME',
              key: message.key?.toString() ?? '',
              value: message.value?.toString() ?? '',
              headers: [],
            },
          ],
        },
      };

      void fetch(process.env.BILL_PROCESSOR_URL ?? '', {
        method: 'POST',
        body: JSON.stringify(event),
      });
    },
  });
};

interface SelfManagedKafkaRecordHeader {
  [headerKey: string]: number[];
}

interface SelfManagedKafkaRecord {
  topic: string;
  partition: number;
  offset: number;
  timestamp: number;
  timestampType: 'CREATE_TIME' | 'LOG_APPEND_TIME';
  key: string;
  value: string;
  headers: SelfManagedKafkaRecordHeader[];
}

// https://docs.aws.amazon.com/lambda/latest/dg/with-kafka.html
interface SelfManagedKafkaEvent {
  eventSource: 'SelfManagedKafka';
  bootstrapServers: string;
  records: {
    [topic: string]: SelfManagedKafkaRecord[];
  };
}
