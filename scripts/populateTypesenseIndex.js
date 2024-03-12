#!/usr/bin/env node
const Typesense = require("typesense");
const products = require("../data/ecommerce-with-vectors.json");
// const env = import.meta.env;

console.log(process.env.NEXT_PUBLIC_TYPESENSE_ADMIN_API_KEY, "key");
const populateTypesenseIndex = async () => {
  const env = process.env.NEXT_PUBLIC_TYPESENSE_HOST;
  console.log(env);
  //   ➜  typesense-poc git:(main) ✗ git config set user.name="user.name=AyushNautiyalDeveloper"
  const typesense = new Typesense.Client({
    nodes: [
      {
        host: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
        port: process.env.NEXT_PUBLIC_TYPESENSE_PORT,
        protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL,
      },
    ],
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_ADMIN_API_KEY,
    connectionTimeoutSeconds: 60 * 60,
  });

  const schema = {
    name: "products",
    num_documents: 0,
    fields: [
      {
        name: "name",
        type: "string",
        facet: false,
      },
      {
        name: "description",
        type: "string",
        facet: false,
      },
      {
        name: "brand",
        type: "string",
        facet: true,
      },
      {
        name: "categories",
        type: "string[]",
        facet: true,
      },
      {
        name: "categories.lvl0",
        type: "string[]",
        facet: true,
      },
      {
        name: "categories.lvl1",
        type: "string[]",
        facet: true,
        optional: true,
      },
      {
        name: "categories.lvl2",
        type: "string[]",
        facet: true,
        optional: true,
      },
      {
        name: "categories.lvl3",
        type: "string[]",
        facet: true,
        optional: true,
      },
      {
        name: "price",
        type: "float",
        facet: true,
      },
      {
        name: "popularity",
        type: "int32",
        facet: false,
      },
      {
        name: "free_shipping",
        type: "bool",
        facet: true,
      },
      {
        name: "rating",
        type: "int32",
        facet: true,
      },
      {
        name: "vectors",
        type: "float[]",
        num_dim: 384,
      },
    ],
    default_sorting_field: "popularity",
  };

  console.log("Populating index in Typesense");

  let reindexNeeded = false;
  try {
    const collection = await typesense.collections("products").retrieve();
    // console.log("Found existing schema", { collection }, collection.fields);
    // console.log(JSON.stringify(collection, null, 2));
    if (
      collection.num_documents !== products.length ||
      process.env.FORCE_REINDEX === "true"
    ) {
      console.log("Deleting existing schema");
      reindexNeeded = true;
      await typesense.collections("products").delete();
    }
  } catch (e) {
    reindexNeeded = true;
  }

  if (!reindexNeeded) {
    return true;
  }

  console.log("Creating schema: ");
  //   console.log(JSON.stringify(schema, null, 2));
  await typesense.collections().create(schema);
  console.log("Adding records: ");

  // Bulk Import
  products.forEach((product) => {
    console.log({ product }, product.name.length, "<<<<<<<<");
    product.free_shipping = product.name.length % 2 === 1; // We need this to be deterministic for tests
    product.rating = (product.description.length % 5) + 1; // We need this to be deterministic for tests
    product.categories.forEach((category, index) => {
      product[`categories.lvl${index}`] = [
        product.categories.slice(0, index + 1).join(" > "),
      ];
    });
  });
  try {
    const returnData = await typesense
      .collections("products")
      .documents()
      .import(products);
    console.log(returnData);
    console.log("Done indexing.");

    const failedItems = returnData.filter((item) => item.success === false);
    if (failedItems.length > 0) {
      throw new Error(
        `Error indexing items ${JSON.stringify(failedItems, null, 2)}`
      );
    }

    return returnData;
  } catch (error) {
    console.log(error);
  }
};

populateTypesenseIndex();
