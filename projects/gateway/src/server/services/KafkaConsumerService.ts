import EventEmitter from 'node:events';
import { logger } from '@rsbuild/core';
import type { Consumer, Kafka, KafkaMessage } from 'kafkajs';
import type { BillRecalculateResponse } from '../dto/bill.ts';
import type { CryptoService } from './CryptoService.ts';

const CONSUMER_EVENT_CHANNEL = 'bill-recalculate';

interface KafkaServiceConstructor {
  /** Passed to the brokers array */
  kafka: Kafka;
  billRecalculateTopic: string;
  cryptoService: CryptoService;
}

export class KafkaConsumerService {
  private readonly consumerEventEmitter = new EventEmitter();
  private readonly consumer: Consumer;
  private readonly billRecalculateTopic: string;
  private readonly cryptoService: CryptoService;

  constructor({
    billRecalculateTopic,
    kafka,
    cryptoService,
  }: KafkaServiceConstructor) {
    this.billRecalculateTopic = billRecalculateTopic;
    this.cryptoService = cryptoService;

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
  ): Promise<{ unsubscribe: () => void } | undefined> {
    if (!this.hasBillAccess(billId, sessionToken)) {
      return undefined;
    }

    const eventHandler = (message: KafkaMessage) => {
      // Check if it's coming from another user and it's the right bill! We can
      // do a simple session token comparison here as we've already verified the
      // token.
      // TODO remove this once prod passes on
      logger.log(
        'message published:',
        JSON.stringify(message.value?.toString() ?? ''),
      );
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

  private hasBillAccess(billId: number, sessionToken: string) {
    const payload = this.cryptoService.verifySessionJwt(sessionToken);
    return payload?.isAdmin || payload?.billAccessIds?.includes(billId);
  }
}
