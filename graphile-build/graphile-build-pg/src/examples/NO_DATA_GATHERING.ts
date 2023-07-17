/* eslint-disable no-restricted-syntax */

/*
 * This file demonstrates a schema that's autogenerated by a user-supplied
 * registry (hence the "no data gathering" - we skip the gather phase).
 */

import type { PgExecutorContextPlans, WithPgClient } from "@dataplan/pg";
import {
  makePgResourceOptions,
  makeRegistryBuilder,
  PgExecutor,
  recordCodec,
  sqlFromArgDigests,
  TYPES,
} from "@dataplan/pg";
import { makePgAdaptorWithPgClient } from "@dataplan/pg/adaptors/pg";
import chalk from "chalk";
import { context, object } from "grafast";
import {
  buildSchema,
  defaultPreset as graphileBuildPreset,
  QueryQueryPlugin,
} from "graphile-build";
import { resolvePresets } from "graphile-config";
import { EXPORTABLE, exportSchema } from "graphile-export";
import { graphql, printSchema } from "grafast/graphql";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { inspect } from "node:util";
import { Pool } from "pg";
import sql from "pg-sql2";

import { defaultPreset as graphileBuildPgPreset } from "../index.js";

declare global {
  namespace Grafast {
    interface Context {
      pgSettings: {
        [key: string]: string;
      } | null;
      withPgClient: WithPgClient;
    }
  }
}

const pool = new Pool({
  connectionString: "pggql_test",
});
const withPgClient: WithPgClient = makePgAdaptorWithPgClient(pool);

async function main() {
  // Create our GraphQL schema by applying all the plugins
  const executor = EXPORTABLE(
    (PgExecutor, context, object) =>
      new PgExecutor({
        name: "main",
        context: () =>
          object({
            pgSettings: context<Grafast.Context>().get("pgSettings"),
            withPgClient: context<Grafast.Context>().get("withPgClient"),
          } as PgExecutorContextPlans<any>),
      }),
    [PgExecutor, context, object],
  );
  // TODO: extract this to be usable in general and not specific to this
  // example file.
  const UseRelationNamesPlugin: GraphileConfig.Plugin = {
    name: "UseRelationNamesPlugin",
    version: "0.0.0",
    inflection: {
      replace: {
        singleRelation(previous, options, details) {
          return this.camelCase(details.relationName);
        },
        singleRelationBackwards(previous, options, details) {
          return this.camelCase(details.relationName);
        },
        manyRelationConnection(previous, options, details) {
          return this.connectionField(this.camelCase(details.relationName));
        },
        manyRelationList(previous, options, details) {
          return this.listField(this.camelCase(details.relationName));
        },
      },
    },
  };
  const config = resolvePresets([
    {
      extends: [graphileBuildPreset, graphileBuildPgPreset],
      plugins: [QueryQueryPlugin, UseRelationNamesPlugin],
    },
  ]);

  const pgRegistry = EXPORTABLE(
    (
      TYPES,
      executor,
      makePgResourceOptions,
      makeRegistryBuilder,
      recordCodec,
      sql,
      sqlFromArgDigests,
    ) => {
      const usersCodec = recordCodec({
        executor,
        name: `app_public.users`,
        identifier: sql`app_public.users`,
        attributes: {
          id: {
            codec: TYPES.uuid,
            notNull: true,
            extensions: {
              tags: {
                hasDefault: true,
              },
            },
          },
          username: {
            codec: TYPES.text,
            notNull: true,
          },
          gravatar_url: {
            codec: TYPES.text,
            notNull: false,
          },
          created_at: {
            codec: TYPES.timestamptz,
            notNull: true,
          },
        },
        extensions: {
          tags: {
            name: "users",
          },
        },
      });

      const forumsCodec = recordCodec({
        executor,
        name: `app_public.forums`,
        identifier: sql`app_public.forums`,
        attributes: {
          id: {
            codec: TYPES.uuid,
            notNull: true,
            extensions: {
              tags: {
                hasDefault: true,
              },
            },
          },
          name: {
            codec: TYPES.text,
            notNull: true,
          },
          archived_at: {
            codec: TYPES.timestamptz,
            notNull: false,
          },
        },
        extensions: {
          tags: {
            name: "forums",
          },
        },
      });

      const messagesCodec = recordCodec({
        executor,
        name: `app_public.messages`,
        identifier: sql`app_public.messages`,
        attributes: {
          id: {
            codec: TYPES.uuid,
            notNull: true,
            extensions: {
              tags: {
                hasDefault: true,
              },
            },
          },
          forum_id: {
            codec: TYPES.uuid,
            notNull: true,
          },
          author_id: {
            codec: TYPES.uuid,
            notNull: true,
          },
          body: {
            codec: TYPES.text,
            notNull: true,
          },
          featured: {
            codec: TYPES.boolean,
            notNull: true,
          },
          created_at: {
            codec: TYPES.timestamptz,
            notNull: true,
          },
          archived_at: {
            codec: TYPES.timestamptz,
            notNull: false,
          },
        },
        extensions: {
          tags: {
            name: "messages",
          },
        },
      });

      const usersResourceOptions = makePgResourceOptions({
        name: "users",
        executor,
        from: usersCodec.sqlType,
        codec: usersCodec,
        uniques: [{ attributes: ["id"], isPrimary: true }],
      });

      const forumsResourceOptions = makePgResourceOptions({
        //name: "main.app_public.forums",
        name: "forums",
        executor,
        from: forumsCodec.sqlType,
        codec: forumsCodec,
        uniques: [{ attributes: ["id"], isPrimary: true }],
      });

      const messagesResourceOptions = makePgResourceOptions({
        name: "messages",
        executor,
        from: messagesCodec.sqlType,
        codec: messagesCodec,
        uniques: [{ attributes: ["id"], isPrimary: true }],
      });

      const uniqueAuthorCountResourceOptions = makePgResourceOptions({
        executor,
        codec: TYPES.int,
        from: (...args) =>
          sql`app_public.unique_author_count(${sqlFromArgDigests(args)})`,
        name: "unique_author_count",
        parameters: [
          {
            name: "featured",
            required: false,
            codec: TYPES.boolean,
          },
        ],
        extensions: {
          tags: {
            behavior: "queryField",
          },
        },
      });

      const forumsUniqueAuthorCountResourceOptions = makePgResourceOptions({
        executor,
        codec: TYPES.int,
        isUnique: true,
        from: (...args) =>
          sql`app_public.forums_unique_author_count(${sqlFromArgDigests(
            args,
          )})`,
        name: "forums_unique_author_count",
        parameters: [
          {
            name: "forum",
            codec: forumsCodec,
            required: true,
            notNull: true,
          },
          {
            name: "featured",
            codec: TYPES.boolean,
            required: false,
            notNull: false,
          },
        ],
        extensions: {
          tags: {
            // behavior: ["typeField"],
            name: "unique_author_count",
          },
        },
      });

      const forumsRandomUserResourceOptions = makePgResourceOptions({
        executor,
        codec: usersCodec,
        isUnique: true,
        from: (...args) =>
          sql`app_public.forums_random_user(${sqlFromArgDigests(args)})`,
        name: "forums_random_user",
        parameters: [
          {
            name: "forum",
            codec: forumsCodec,
            required: true,
            notNull: true,
          },
        ],
        extensions: {
          tags: {
            // behavior: ["typeField"],
            name: "random_user",
          },
        },
      });

      const forumsFeaturedMessagesResourceOptions = makePgResourceOptions({
        executor,
        codec: messagesCodec,
        isUnique: false,
        from: (...args) =>
          sql`app_public.forums_featured_messages(${sqlFromArgDigests(args)})`,
        name: "forums_featured_messages",
        parameters: [
          {
            name: "forum",
            codec: forumsCodec,
            required: true,
            notNull: true,
          },
        ],
        extensions: {
          tags: {
            behavior: "typeField connection list",
            name: "featured_messages",
          },
        },
      });
      return makeRegistryBuilder()
        .addResource(usersResourceOptions)
        .addResource(forumsResourceOptions)
        .addResource(messagesResourceOptions)
        .addResource(uniqueAuthorCountResourceOptions)
        .addResource(forumsUniqueAuthorCountResourceOptions)
        .addResource(forumsRandomUserResourceOptions)
        .addResource(forumsFeaturedMessagesResourceOptions)
        .addRelation(
          usersResourceOptions.codec,
          "messages",
          messagesResourceOptions,
          {
            isUnique: false,
            localAttributes: ["id"],
            remoteAttributes: ["author_id"],
          },
        )
        .addRelation(
          forumsResourceOptions.codec,
          "messages",
          messagesResourceOptions,
          {
            isUnique: false,
            localAttributes: ["id"],
            remoteAttributes: ["forum_id"],
            extensions: {
              tags: {
                behavior: "connection list",
              },
            },
          },
        )
        .addRelation(
          messagesResourceOptions.codec,
          "author",
          usersResourceOptions,
          {
            isUnique: true,
            localAttributes: ["author_id"],
            remoteAttributes: ["id"],
          },
        )
        .addRelation(
          messagesResourceOptions.codec,
          "forum",
          forumsResourceOptions,
          {
            isUnique: true,
            localAttributes: ["forum_id"],
            remoteAttributes: ["id"],
          },
        )
        .build();
    },
    [
      TYPES,
      executor,
      makePgResourceOptions,
      makeRegistryBuilder,
      recordCodec,
      sql,
      sqlFromArgDigests,
    ],
  );

  // We're crafting our own input
  const input: GraphileBuild.BuildInput = { pgRegistry };
  const schema = buildSchema(config, input);

  // Output our schema
  console.log(chalk.blue(printSchema(schema)));
  console.log();
  console.log();
  console.log();

  // Common GraphQL arguments
  const source = /* GraphQL */ `
    query {
      allForumsList {
        id
        name
        archivedAt
      }
      allForums {
        nodes {
          id
          name
          archivedAt
          messagesList {
            id
            body
            forumId
            authorId
          }
        }
        edges {
          cursor
          node {
            id
            name
            archivedAt
            messages {
              nodes {
                id
                body
                forumId
                authorId
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
      allUsersList {
        id
        username
        gravatarUrl
        createdAt
        messages {
          totalCount
        }
      }
      allMessagesList {
        id
        forumId
        authorId
        body
        featured
        createdAt
        archivedAt
        forum {
          name
          uniqueAuthorCount
          uniqueAuthorCountFeatured: uniqueAuthorCount(featured: true)
          randomUser {
            id
            username
          }
          featuredMessages {
            nodes {
              id
              body
              featured
            }
          }
          featuredMessagesList {
            id
            body
            featured
          }
        }
        author {
          username
        }
      }
    }
  `;

  const rootValue = null;
  const contextValue = {
    withPgClient,
  };
  const variableValues = Object.create(null);

  // Run our query
  const result = await graphql({
    schema,
    source,
    rootValue,
    variableValues,
    contextValue,
  });
  console.log(inspect(result, { depth: Infinity, colors: true }));

  if ("errors" in result && result.errors) {
    process.exit(1);
  }

  // Export schema
  // const exportFileLocation = new URL("../../temp.js", import.meta.url);
  const exportFileLocation = `${__dirname}/../../temp.mjs`;
  await exportSchema(schema, exportFileLocation);

  // output code
  console.log(chalk.green(await readFile(exportFileLocation, "utf8")));

  // run code
  const { schema: schema2 } = await import(
    pathToFileURL(exportFileLocation).href
  );
  const result2 = await graphql({
    schema: schema2,
    source,
    rootValue,
    variableValues,
    contextValue,
  });
  console.log(inspect(result2, { depth: Infinity, colors: true }));
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
