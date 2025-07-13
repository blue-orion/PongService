import fp from "fastify-plugin";
import fastifyOauth2 from "@fastify/oauth2";

async function oauthPlugin(fastify, _options) {
  fastify.register(fastifyOauth2, {
    name: "googleOAuth",
    scope: ["profile", "email"],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET,
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/auth/google",
    callbackUri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3333/v1/auth/google/callback",
  });
}

export default fp(oauthPlugin);
