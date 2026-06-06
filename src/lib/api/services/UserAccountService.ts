/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { data_StandardResponse } from '../models/data_StandardResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserAccountService {
    /**
     * Get account summary (user)
     * @param currency Currency (default USDT)
     * @returns data_StandardResponse success
     * @throws ApiError
     */
    public static getWebAccountSummary(
        currency?: string,
    ): CancelablePromise<data_StandardResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/web/account/summary',
            query: {
                'currency': currency,
            },
            errors: {
                400: `bad request`,
                503: `database unavailable`,
            },
        });
    }
    /**
     * List account transactions (user)
     * @param type Transaction type RECHARGE or CAMPAIGN_REWARD
     * @param cursor Pagination cursor (transaction id)
     * @param limit Page size (default 20, max 100)
     * @returns data_StandardResponse success
     * @throws ApiError
     */
    public static getWebAccountTransactions(
        type?: string,
        cursor?: number,
        limit?: number,
    ): CancelablePromise<data_StandardResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/web/account/transactions',
            query: {
                'type': type,
                'cursor': cursor,
                'limit': limit,
            },
            errors: {
                400: `bad request`,
                503: `database unavailable`,
            },
        });
    }
}
