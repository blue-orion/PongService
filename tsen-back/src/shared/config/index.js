const config = {
  server: {
    port: Number(process.env.PORT),
    host: process.env.HOST,
    nodeEnv: process.env.NODE_ENV,
  },
};

export default config;
