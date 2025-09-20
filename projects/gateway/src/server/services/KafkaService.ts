import {
  Kafka,
  Partitioners,
  type Producer,
  type RecordMetadata,
} from 'kafkajs';

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
    topic: string,
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
