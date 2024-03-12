"use client";
import Image from "next/image";
import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";
import { renderToString } from "react-dom/server";
import { createInstantSearchRouterNext } from "react-instantsearch-router-nextjs";
import singletonRouter from "next/router";
import {
  InstantSearch,
  SearchBox,
  Hits,
  HierarchicalMenu,
  RefinementList,
  RangeInput,
  ToggleRefinement,
  ClearRefinements,
  Stats,
  HitsPerPage,
  SortBy,
  Pagination,
  InstantSearchSSRProvider,
  getServerState,
} from "react-instantsearch";

import { Hit } from "../components";
import { history } from "instantsearch.js/es/lib/routers/index.js";

let TYPESENSE_SERVER_CONFIG: any = {
  apiKey: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_API_KEY, // Be sure to use an API key that only allows searches, in production
  nodes: [
    {
      host: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
      port: process.env.NEXT_PUBLIC_TYPESENSE_PORT,
      protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL,
    },
  ],
  connectionTimeoutSeconds: 5,
  numRetries: 8,
};
console.log(TYPESENSE_SERVER_CONFIG);

const typesenseInstantsearchAdapter: any = new TypesenseInstantSearchAdapter({
  server: TYPESENSE_SERVER_CONFIG,
  additionalSearchParameters: {
    query_by: "name,categories,description",
    query_by_weights: "4,2,1",
    num_typos: 1,
    typo_tokens_threshold: 1,
    // exclude_fields: "vectors",
    // exhaustive_search: true,
  },
});
import { StatsProps, UiProps } from "react-instantsearch";

console.log(typesenseInstantsearchAdapter);
const CustomStats: React.FC<StatsProps> = ({ translations, ...props }) => {
  const customTranslations = translations as Partial<UiProps["translations"]>;

  return <Stats translations={customTranslations} {...props} />;
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <InstantSearch
        indexName="products"
        searchClient={typesenseInstantsearchAdapter.searchClient}
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <div className="container-fluid px-md-5 pt-4">
          <div className="row d-flex align-items-center">
            <div className="col-md">
              <h1 className="display-6">Typesense</h1>
            </div>
            <div className="col-md-2 d-none d-md-block">
              <SearchBox classNames={{ loadingIcon: "d-none" }} />
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-3 pr-md-5">
              <h5>Browse by Categories</h5>
              <HierarchicalMenu
                className="mt-3"
                attributes={[
                  "categories.lvl0",
                  "categories.lvl1",
                  "categories.lvl2",
                  "categories.lvl3",
                ]}
                showParentLevel={true}
                rootPath={"Cell Phones"}
                limit={50}
              />

              <h5 className="mt-5">Filter by Brands</h5>
              <RefinementList
                className="mt-3"
                attribute="brand"
                limit={10}
                showMore={true}
                showMoreLimit={50}
                searchable={true}
                transformItems={(items) =>
                  items.sort((a, b) => (a.label > b.label ? 1 : -1))
                }
              />

              <div className="mt-2">&nbsp;</div>

              <ToggleRefinement
                className="mt-5"
                attribute="free_shipping"
                label="Free Shipping"
                // value={true}
              />

              <div className="mt-1">&nbsp;</div>

              <h5 className="mt-5">Filter by Price</h5>
              <RangeInput attribute="price" />

              <div className="mt-1">&nbsp;</div>

              <ClearRefinements className="mt-5" />
            </div>
            <div className="col-md">
              <div className="row mt-5 mt-md-0">
                <div className="col-md">
                  <div className="row">
                    <div className="col-md-4"></div>
                    <div className="col-md-8 d-flex justify-content-end align-items-center">
                      {/* <Stats
                        translations={{
                          stats(nbHits: any, processingTimeMS: any) {
                            let hitCountPhrase;
                            if (nbHits === 0) {
                              hitCountPhrase = "No products";
                            } else if (nbHits === 1) {
                              hitCountPhrase = "1 product";
                            } else {
                              hitCountPhrase = `${nbHits.toLocaleString()} products`;
                            }
                            return `${hitCountPhrase} found in ${processingTimeMS.toLocaleString()}ms`;
                          },
                        }}
                      /> */}
                      <CustomStats />
                      <HitsPerPage
                        className="ms-4"
                        items={[
                          { label: "9 per page", value: 9, default: true },
                          { label: "18 per page", value: 18 },
                        ]}
                        // defaultRefinement={9}
                      />
                      <SortBy
                        items={[
                          { label: "Relevancy", value: "products" },
                          {
                            label: "Price (asc)",
                            value: "products/sort/price:asc",
                          },
                          {
                            label: "Price (desc)",
                            value: "products/sort/price:desc",
                          },
                        ]}
                        // defaultRefinement="products"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="row mt-1">
                <div className="col-sm">
                  <Hits hitComponent={Hit} />
                </div>
              </div>

              <div className="row">
                <div className="col-sm">
                  <Pagination />
                </div>
              </div>
            </div>
          </div>
        </div>
      </InstantSearch>
    </main>
  );
}

// export async function getServerSideProps({ req, res }: any) {
//   res.setHeader(
//     "Cache-Control",
//     `s-maxage=${1 * 60 * 60}, stale-while-revalidate=${24 * 60 * 60}`
//   );

//   const protocol = req.headers.referer?.split("://")[0] || "https";
//   const serverUrl = `${protocol}://${req.headers.host}${req.url}`;
//   console.log({ protocol });
//   const serverState = await getServerState(<Home serverUrl={serverUrl} />, {
//     renderToString,
//   });

//   return {
//     props: {
//       serverState,
//       serverUrl,
//     },
//   };
// }
