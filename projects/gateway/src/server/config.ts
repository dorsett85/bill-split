const getEnvVar = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value;
};

export const env = {
  ADMIN_PASSWORD: getEnvVar('ADMIN_PASSWORD'),
  ADMIN_SECRET_KEY: getEnvVar('ADMIN_SECRET_KEY'),
  AWS_BILL_IMAGE_S3_BUCKET: getEnvVar('AWS_BILL_IMAGE_S3_BUCKET'),
  AWS_ACCESS_KEY: getEnvVar('AWS_ACCESS_KEY'),
  AWS_SECRET_ACCESS_KEY: getEnvVar('AWS_SECRET_ACCESS_KEY'),
  AWS_REGION: getEnvVar('AWS_REGION'),
  KAFKA_BILL_PROCESSING_TOPIC: getEnvVar('KAFKA_BILL_PROCESSING_TOPIC'),
  KAFKA_HOST: getEnvVar('KAFKA_HOST'),
  KAFKA_PORT: getEnvVar('KAFKA_PORT'),
  NODE_ENV: getEnvVar('NODE_ENV'),
  GATEWAY_PORT: process.env.GATEWAY_PORT ?? 3002,
  DB_NAME: getEnvVar('DB_NAME'),
  DB_HOST: getEnvVar('DB_HOST'),
  DB_PORT: getEnvVar('DB_PORT'),
  DB_USER: getEnvVar('DB_USER'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD'),
  PORT: getEnvVar('PORT'),
} satisfies Record<string, string | number>;
