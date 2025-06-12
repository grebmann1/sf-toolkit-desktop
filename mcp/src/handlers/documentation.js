import fetch from 'node-fetch';
import { z } from 'zod';
import { handleFetchWithToolkitCheck } from './util.js';

function register(server, context) {
    server.tool(
        'Documentation_searchDocumentation',
        `Search the documentation for a given query.
        - keywords: The keywords to search for ex. "Account" or "Salesforce API".
        - filters: The filters to apply to the search. Accepted values are:
            - atlas.en-us.automotive_cloud.meta
            - atlas.en-us.retail_api.meta
            - atlas.en-us.object_reference.meta
            - atlas.en-us.c360a_api.meta
            - atlas.en-us.edu_cloud_dev_guide.meta
            - atlas.en-us.eu_developer_guide.meta
            - atlas.en-us.salesforce_feedback_management_dev_guide.meta
            - atlas.en-us.field_service_dev.meta
            - atlas.en-us.financial_services_cloud_object_reference.meta
            - atlas.en-us.health_cloud_object_reference.meta
            - atlas.en-us.loyalty.meta
            - atlas.en-us.mfg_api_devguide.meta
            - atlas.en-us.netzero_cloud_dev_guide.meta
            - atlas.en-us.nonprofit_cloud.meta
            - atlas.en-us.psc_api.meta
            - atlas.en-us.salesforce_scheduler_developer_guide.meta
        - isFullTextSearch: Whether to perform a full text search (true or false).
        `,
        {
            keywords: z.string().describe('The keyword to search for.'),
            filters: z.string().describe('The filters to apply to the search.').optional(),
            isFullTextSearch: z.boolean().describe('Whether to perform a full text search.').optional(),
        },
        async (params) => {
            const _url = new URL(`https://sf-toolkit.com/documentation/search`);
            if (params.keywords) _url.searchParams.set('keywords', params.keywords);
            if (params.filters) _url.searchParams.set('filters', params.filters);
            if (params.isFullTextSearch) _url.searchParams.set('isFullTextSearch', params.isFullTextSearch);

            const result = await handleFetchWithToolkitCheck(
                fetch(_url.toString(), {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                }),
            );
            if (result.content) return result;
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result.data),
                    },
                ],
            };
        },
    );
}

export default { register };
