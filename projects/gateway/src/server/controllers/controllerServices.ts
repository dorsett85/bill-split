import { S3Client } from '@aws-sdk/client-s3';
import { Kafka } from 'kafkajs';
import { env } from '../config.ts';
import { AccessTokenDao } from '../dao/AccessTokenDao.ts';
import { BillDao } from '../dao/BillDao.ts';
import { BillParticipantDao } from '../dao/BillParticipantDao.ts';
import { LineItemDao } from '../dao/LineItemDao.ts';
import { LineItemParticipantDao } from '../dao/LineItemParticipantDao.ts';
import { ParticipantDao } from '../dao/ParticipantDao.ts';
import { getDb } from '../db/getDb.ts';
import { AdminService } from '../services/AdminService.ts';
import { BillService } from '../services/BillService.ts';
import { CryptoService } from '../services/CryptoService.ts';
import { KafkaConsumerService } from '../services/KafkaConsumerService.ts';
import { KafkaProducerService } from '../services/KafkaProducerService.ts';
import { ParticipantService } from '../services/ParticipantService.ts';
import { S3FileStorageService } from '../services/S3FileStorageService.ts';

let kafka: Kafka;
const getKafka = (): Kafka => {
  if (!kafka) {
    kafka = new Kafka({
      clientId: 'gateway',
      brokers: [`${env.KAFKA_HOST}:${env.KAFKA_PORT}`],
    });
  }
  return kafka;
};

let kafkaConsumerService: KafkaConsumerService;
export const getKafkaConsumerService = (): KafkaConsumerService => {
  if (!kafkaConsumerService) {
    kafkaConsumerService = new KafkaConsumerService({
      kafka: getKafka(),
      billRecalculateTopic: env.KAFKA_BILL_RECALCULATE_TOPIC,
      cryptoService: new CryptoService({
        key: env.ADMIN_SECRET_KEY,
      }),
    });
  }
  return kafkaConsumerService;
};

export const getAdminService = () => {
  return new AdminService({
    accessTokenDao: new AccessTokenDao(getDb()),
    adminPassword: env.ADMIN_PASSWORD,
    cryptoService: new CryptoService({ key: env.ADMIN_SECRET_KEY }),
  });
};

export const getBillService = () => {
  return new BillService({
    accessTokenDao: new AccessTokenDao(getDb()),
    billDao: new BillDao(getDb()),
    lineItemDao: new LineItemDao(getDb()),
    participantDao: new ParticipantDao(getDb()),
    cryptoService: new CryptoService({ key: env.ADMIN_SECRET_KEY }),
    fileStorageService: new S3FileStorageService({
      bucketName: env.AWS_BILL_IMAGE_S3_BUCKET,
      s3Client: new S3Client({
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
        region: env.AWS_REGION,
      }),
    }),
    kafkaProducerService: new KafkaProducerService({
      kafka: getKafka(),
      billCreateTopic: env.KAFKA_BILL_PROCESSING_TOPIC,
      billRecalculateTopic: env.KAFKA_BILL_RECALCULATE_TOPIC,
    }),
  });
};

export const getParticipantService = () => {
  return new ParticipantService({
    billDao: new BillDao(getDb()),
    participantDao: new ParticipantDao(getDb()),
    billParticipantDao: new BillParticipantDao(getDb()),
    lineItemParticipantDao: new LineItemParticipantDao(getDb()),
    lineItemDao: new LineItemDao(getDb()),
    cryptoService: new CryptoService({ key: env.ADMIN_SECRET_KEY }),
    kafkaProducerService: new KafkaProducerService({
      kafka: getKafka(),
      billCreateTopic: env.KAFKA_BILL_PROCESSING_TOPIC,
      billRecalculateTopic: env.KAFKA_BILL_RECALCULATE_TOPIC,
    }),
  });
};
