import {
  Kafka,
  Partitioners,
  type Producer,
  type RecordMetadata,
} from 'kafkajs';

interface KafkaServiceConstructor {
  /** Passed to the brokers array */
  connectionString: string;
  /** Topic for creating new bills */
  billTopic: string;
}

export class KafkaService {
  private producerInstance?: Producer;
  private connectionString: string;
  private readonly billTopic: string;

  constructor({ billTopic, connectionString }: KafkaServiceConstructor) {
    this.billTopic = billTopic;
    this.connectionString = connectionString;
  }

  get producer(): Producer {
    if (!this.producerInstance) {
      this.producerInstance = new Kafka({
        clientId: 'gateway',
        brokers: [this.connectionString],
      }).producer({
        createPartitioner: Partitioners.DefaultPartitioner,
      });
    }
    return this.producerInstance;
  }

  public publishBill(
    value: Record<string, unknown>,
  ): Promise<RecordMetadata[]> {
    return this.publish(this.billTopic, value);
  }

  /**
   * Post messages to Kafka
   */
  private async publish(
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
