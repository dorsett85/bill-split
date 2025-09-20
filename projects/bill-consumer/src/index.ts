import { Kafka } from 'kafkajs';

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

const kafka = new Kafka({
  clientId: 'gateway',
  brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
});

/**
 * Most likely we'll only use this consumer for development purposes, and use an
 * aws lambda directly in production.
 */
const startKafkaConsumer = async () => {
  const topic = process.env.KAFKA_BILL_PROCESSING_TOPIC ?? '';
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

void startKafkaConsumer();
