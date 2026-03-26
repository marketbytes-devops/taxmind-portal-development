interface DefaultConfig {
  MONGO_URI_DEV: string;
  CRYPTO_KEY: string;
  CRYPTO_IV: string;
}

const defaults: DefaultConfig = {
  MONGO_URI_DEV: process.env.MONGODB_URI as string,
  CRYPTO_KEY: process.env.CRYPTO_KEY as string,
  CRYPTO_IV: process.env.CRYPTO_IV as string,
};

export default defaults;
