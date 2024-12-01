// Run this file to initialize kafka
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "admin",
  brokers: [`${process.env.KAFKA_HOST}:${process.env.KAFKA_PORT}`],
});

const admin = kafka.admin();

const migrate = async () => {
  await admin.connect();

  // It might make sense to order these migration operations at some point,
  // similar to how we do it in the db project.
  await admin.createTopics({
    topics: [
      {
        topic: "bills",
      },
    ],
  });
  await admin.disconnect();
};

migrate().then(() => {
  process.exit(0);
});
