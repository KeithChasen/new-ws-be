import { ApolloServer } from "@apollo/server";

import { startStandaloneServer } from '@apollo/server/standalone';
import { PubSub } from 'graphql-subscriptions';
import jwt from 'jsonwebtoken';
import bodyParser from "body-parser";
import cors from 'cors';

import keys from "./keys.cjs";

const pubsub = new PubSub();

const typeDefs = `#graphql
    type Entity {
        id: String
        data: String
    }

    type Query {
        entities: [Entity]
    }
`;

const resolvers = {
    Query: {
        entities: () => entities
    }
}

const authMiddleware = context => {
    let token = null;
  if(context.req && context.req.headers.authorization) {
    token = context.req.headers.authorization.split('Bearer ')[1];
  } else if (context.connection && context.connection.context.Authorization) {
    token = context.connection.context.Authorization.split('Bearer ')[1];
  }

  if (token) {
    jwt.verify(token, jwtSecret, (err, decodedToken) => {
      context.user = decodedToken;
    });
  }
  context.pubsub = pubsub;

  return context;
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: authMiddleware
});

const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 }
});

console.log(`Server started on ${url}`);
