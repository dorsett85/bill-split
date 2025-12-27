// Run this file to initialize kafka
import { Kafka } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'admin',
  brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
});

const admin = kafka.admin();

const init = async () => {
  await admin.connect();

  // It might make sense to order these migration operations at some point,
  // similar to how we do it in the db project.
  await admin.createTopics({
    topics: [
      {
        topic: process.env.KAFKA_BILL_PROCESSING_TOPIC,
      },
      {
        topic: process.env.KAFKA_BILL_RECALCULATE_TOPIC,
      },
    ],
  });
  await admin.disconnect();
};

init().then(() => {
  process.exit(0);
});
