import fp from "fastify-plugin";
import bcrypt from "bcrypt";

async function encryptPlugin(fastify, _options) {
  const encryptUtils = {
    async hashPasswd(password) {
      return await bcrypt.hash(password, 10);
    },

    async comparePasswd(password, hash) {
      return await bcrypt.compare(password, hash);
    },
  };

  fastify.decorate("encryptUtils", encryptUtils);
}

export default fp(encryptPlugin);
