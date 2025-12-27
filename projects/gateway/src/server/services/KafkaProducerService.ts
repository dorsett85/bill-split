import {
  type Kafka,
  Partitioners,
  type Producer,
  type RecordMetadata,
} from 'kafkajs';
import type { BillRecalculatePubSubPayload } from '../dto/bill.ts';

interface KafkaProducerServiceConstructor {
  /** Passed to the brokers array */
  kafka: Kafka;
  billCreateTopic: string;
  billRecalculateTopic: string;
}

export class KafkaProducerService {
  private producerInstance?: Producer;
  private readonly kafka: Kafka;
  private readonly billCreateTopic: string;
  private readonly billRecalculateTopic: string;

  constructor({
    kafka,
    billCreateTopic,
    billRecalculateTopic,
  }: KafkaProducerServiceConstructor) {
    this.kafka = kafka;
    this.billCreateTopic = billCreateTopic;
    this.billRecalculateTopic = billRecalculateTopic;
  }

  private get producer(): Producer {
    if (!this.producerInstance) {
      this.producerInstance = this.kafka.producer({
        createPartitioner: Partitioners.DefaultPartitioner,
      });
    }
    return this.producerInstance;
  }

  public publishBill(value: {
    billId: number;
    imageName: string;
  }): Promise<RecordMetadata[]> {
    return this.publish(this.billCreateTopic, value);
  }

  public publishBillRecalculate(
    payload: BillRecalculatePubSubPayload,
  ): Promise<RecordMetadata[]> {
    return this.publish(this.billRecalculateTopic, payload);
  }

  /**
   * Post messages to Kafka
   */
  private async publish<T extends Record<string, unknown>>(
    topic: string,
    value: T,
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
