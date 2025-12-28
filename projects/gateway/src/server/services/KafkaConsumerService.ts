import EventEmitter from 'node:events';
import type { Consumer, Kafka, KafkaMessage } from 'kafkajs';
import type { BillRecalculateResponse } from '../dto/bill.ts';

const CONSUMER_EVENT_CHANNEL = 'bill-recalculate';

interface KafkaServiceConstructor {
  /** Passed to the brokers array */
  kafka: Kafka;
  billRecalculateTopic: string;
}

export class KafkaConsumerService {
  private readonly consumerEventEmitter = new EventEmitter();
  private readonly consumer: Consumer;
  private readonly billRecalculateTopic: string;

  constructor({ billRecalculateTopic, kafka }: KafkaServiceConstructor) {
    this.billRecalculateTopic = billRecalculateTopic;

    this.consumer = kafka.consumer({
      groupId: 'bill-recalculate',
    });

    void this.init();
  }

  private async init() {
    // Set up the consumer to start receiving any
    await this.consumer.connect();
    await this.consumer.subscribe({
      topic: this.billRecalculateTopic,
    });
    void this.consumer.run({
      eachMessage: async ({ message }) => {
        this.consumerEventEmitter.emit(CONSUMER_EVENT_CHANNEL, message);
      },
    });
  }

  /**
   * Same as the read method, but returns only the bill properties requiring
   * calculation.
   */
  public async subscribeRecalculate(
    billId: number,
    sessionToken: string,
    onRecalculate: (bill: BillRecalculateResponse) => void,
  ): Promise<{ unsubscribe: () => void }> {
    const eventHandler = (message: KafkaMessage) => {
      // Check if it's coming from another user and it's the right bill! We can
      // do a simple session token comparison here as we've already verified the
      // token.
      const parsedData = JSON.parse(message.value?.toString() ?? '');
      if (
        billId === parsedData.billId &&
        sessionToken !== parsedData.sessionToken
      ) {
        onRecalculate(parsedData.recalculatedBill);
      }
    };

    this.consumerEventEmitter.on(CONSUMER_EVENT_CHANNEL, eventHandler);

    return {
      unsubscribe: () =>
        this.consumerEventEmitter.off(CONSUMER_EVENT_CHANNEL, eventHandler),
    };
  }
}
