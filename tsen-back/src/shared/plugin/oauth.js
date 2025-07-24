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
    startRedirectPath: "/v1/auth/google",
    callbackUri: `${process.env.REDIRECT_BASE}${process.env.GOOGLE_REDIRECT_URI}`,
  });

  fastify.register(fastifyOauth2, {
    name: "fortyTwoOAuth",
    scope: ["public"],
    credentials: {
      client: {
        id: process.env.FORTY_TWO_CLIENT_ID,
        secret: process.env.FORTY_TWO_CLIENT_SECRET,
      },
      auth: {
        authorizeHost: "https://api.intra.42.fr",
        authorizePath: "/oauth/authorize",
        tokenHost: "https://api.intra.42.fr",
        tokenPath: "/oauth/token",
      },
    },
    startRedirectPath: "/v1/auth/42",
    callbackUri: `${process.env.REDIRECT_BASE}${process.env.FORTY_TWO_REDIRECT_URI}`,
  });
}

export default fp(oauthPlugin);
