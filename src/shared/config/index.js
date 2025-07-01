const config = {
  server: {
    port: Number(process.env.PORT) || 3003,
    host: process.env.HOST || "0.0.0.0",
    nodeEnv: process.env.NODE_ENV || "local",
  },
};

export default config;
