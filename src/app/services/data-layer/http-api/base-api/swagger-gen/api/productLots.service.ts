/**
 * Base API
 * Base API Definition.
 *
 * OpenAPI spec version: 0.270.0
 * Contact: hambardzumyan.albert@gmail.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional }                      from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams,
         HttpResponse, HttpEvent }                           from '@angular/common/http';
import { CustomHttpUrlEncodingCodec }                        from '../encoder';

import { Observable }                                        from 'rxjs';

import { BulkUpdateResponse } from '../model/bulkUpdateResponse';
import { ProductLot } from '../model/productLot';
import { ProductLotBase } from '../model/productLotBase';
import { ProductLotOverview } from '../model/productLotOverview';
import { ProductLotProduct } from '../model/productLotProduct';
import { ProductLotProducts } from '../model/productLotProducts';
import { ProductLotSalesData } from '../model/productLotSalesData';
import { ProductLotUpdatePayload } from '../model/productLotUpdatePayload';
import { ProductLotsUpdateOwnerBulkPayload } from '../model/productLotsUpdateOwnerBulkPayload';
import { ProductLotsUpdatePermissionBulkPayload } from '../model/productLotsUpdatePermissionBulkPayload';
import { ProductLotsUpdateSalesDataPriceOfMeritBulkPayload } from '../model/productLotsUpdateSalesDataPriceOfMeritBulkPayload';
import { ProductLotsUpdateSalesDataShipWeekEstimateBulkPayload } from '../model/productLotsUpdateSalesDataShipWeekEstimateBulkPayload';
import { ProductLotsUpdateSalesNotesBulkPayload } from '../model/productLotsUpdateSalesNotesBulkPayload';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';


@Injectable()
export class ProductLotsService {

    protected basePath = 'http://base-api-development.buychain.tech/api/v1';
    public defaultHeaders = new HttpHeaders();
    public configuration = new Configuration();

    constructor(protected httpClient: HttpClient, @Optional()@Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {
        if (basePath) {
            this.basePath = basePath;
        }
        if (configuration) {
            this.configuration = configuration;
            this.basePath = basePath || configuration.basePath || this.basePath;
        }
    }

    /**
     * @param consumes string[] mime-types
     * @return true: consumes contains 'multipart/form-data', false: otherwise
     */
    private canConsumeForm(consumes: string[]): boolean {
        const form = 'multipart/form-data';
        for (const consume of consumes) {
            if (form === consume) {
                return true;
            }
        }
        return false;
    }


    /**
     * Add product.
     * Add product. Default access - company:member.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public addProductLot(payload: ProductLot, observe?: 'body', reportProgress?: boolean): Observable<ProductLot>;
    public addProductLot(payload: ProductLot, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ProductLot>>;
    public addProductLot(payload: ProductLot, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ProductLot>>;
    public addProductLot(payload: ProductLot, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling addProductLot.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post<ProductLot>(`${this.basePath}/product-lots`,
            payload,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Add product product.
     * Add product product. Default access - none. - The product should not be archived. - The product should not be allocated. - The product state should be one of [DRAFT, ON_HAND].
     * @param id Product-lot id - hex 24, ref Product-Lots.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public addProductLotProduct(id: string, payload: ProductLotProduct, observe?: 'body', reportProgress?: boolean): Observable<ProductLotProduct>;
    public addProductLotProduct(id: string, payload: ProductLotProduct, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ProductLotProduct>>;
    public addProductLotProduct(id: string, payload: ProductLotProduct, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ProductLotProduct>>;
    public addProductLotProduct(id: string, payload: ProductLotProduct, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling addProductLotProduct.');
        }

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling addProductLotProduct.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.post<ProductLotProduct>(`${this.basePath}/product-lots/${encodeURIComponent(String(id))}/products`,
            payload,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Delete product.
     * Delete product. Default access - resource:owner. - The product should not be archived. - The product should not be allocated. - The products list should be empty.
     * @param id Product-lot id - hex 24, ref Product-Lots.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public deleteProductLot(id: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public deleteProductLot(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public deleteProductLot(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public deleteProductLot(id: string, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling deleteProductLot.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];

        return this.httpClient.delete<any>(`${this.basePath}/product-lots/${encodeURIComponent(String(id))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Get product.
     * Get product. Default access - company:member.
     * @param id Product-lot id - hex 24, ref Product-Lots.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getProductLot(id: string, observe?: 'body', reportProgress?: boolean): Observable<ProductLotOverview>;
    public getProductLot(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ProductLotOverview>>;
    public getProductLot(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ProductLotOverview>>;
    public getProductLot(id: string, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling getProductLot.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];

        return this.httpClient.get<ProductLotOverview>(`${this.basePath}/product-lots/${encodeURIComponent(String(id))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Get product products.
     * Get product products. Default access - company:member.
     * @param id Product-lot id - hex 24, ref Product-Lots.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getProductLotProducts(id: string, observe?: 'body', reportProgress?: boolean): Observable<ProductLotProducts>;
    public getProductLotProducts(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ProductLotProducts>>;
    public getProductLotProducts(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ProductLotProducts>>;
    public getProductLotProducts(id: string, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling getProductLotProducts.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];

        return this.httpClient.get<ProductLotProducts>(`${this.basePath}/product-lots/${encodeURIComponent(String(id))}/products`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Move product product.
     * Move product product. Default access - none. - The product should not be archived. - The product should not be allocated. - The product state should be ON_HAND. - The target and source product properties should match. Ignored fields [ownerName, ownerId, permission, salesNotes, salesData, offlineData, products, log, createdAt, updatedAt].
     * @param id Product-lot id - hex 24, ref Product-Lots.
     * @param productId Product id - hex 24, ref Product-Lots.products.
     * @param targetId Target product id - hex 24, ref Product-Lots.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public moveProductLotProduct(id: string, productId: string, targetId: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public moveProductLotProduct(id: string, productId: string, targetId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public moveProductLotProduct(id: string, productId: string, targetId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public moveProductLotProduct(id: string, productId: string, targetId: string, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling moveProductLotProduct.');
        }

        if (productId === null || productId === undefined) {
            throw new Error('Required parameter productId was null or undefined when calling moveProductLotProduct.');
        }

        if (targetId === null || targetId === undefined) {
            throw new Error('Required parameter targetId was null or undefined when calling moveProductLotProduct.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];

        return this.httpClient.put<any>(`${this.basePath}/product-lots/${encodeURIComponent(String(id))}/products/${encodeURIComponent(String(productId))}/targets/${encodeURIComponent(String(targetId))}`,
            null,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Update product.
     * Update product. Default access - resource:owner. - The product should not be archived. - The product should not be allocated. - The owner should have firstName (if present).
     * @param id Product-lot id - hex 24, ref Product-Lots.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public updateProductLot(id: string, payload: ProductLotUpdatePayload, observe?: 'body', reportProgress?: boolean): Observable<ProductLotBase>;
    public updateProductLot(id: string, payload: ProductLotUpdatePayload, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ProductLotBase>>;
    public updateProductLot(id: string, payload: ProductLotUpdatePayload, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ProductLotBase>>;
    public updateProductLot(id: string, payload: ProductLotUpdatePayload, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling updateProductLot.');
        }

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling updateProductLot.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.patch<ProductLotBase>(`${this.basePath}/product-lots/${encodeURIComponent(String(id))}`,
            payload,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Update product sales-data.
     * Update product sales-data. Default access - resource:owner. - The product should not be archived. - The product should not be allocated.
     * @param id Product-lot id - hex 24, ref Product-Lots.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public updateProductLotSalesData(id: string, payload: ProductLotSalesData, observe?: 'body', reportProgress?: boolean): Observable<ProductLotSalesData>;
    public updateProductLotSalesData(id: string, payload: ProductLotSalesData, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<ProductLotSalesData>>;
    public updateProductLotSalesData(id: string, payload: ProductLotSalesData, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<ProductLotSalesData>>;
    public updateProductLotSalesData(id: string, payload: ProductLotSalesData, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling updateProductLotSalesData.');
        }

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling updateProductLotSalesData.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.patch<ProductLotSalesData>(`${this.basePath}/product-lots/${encodeURIComponent(String(id))}/sales-data`,
            payload,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Update product-lots owner bulk.
     * Update product-lots owner bulk. Default access - resource:owner. - The owner should have firstName.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public updateProductLotsOwnerBulk(payload: ProductLotsUpdateOwnerBulkPayload, observe?: 'body', reportProgress?: boolean): Observable<BulkUpdateResponse>;
    public updateProductLotsOwnerBulk(payload: ProductLotsUpdateOwnerBulkPayload, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<BulkUpdateResponse>>;
    public updateProductLotsOwnerBulk(payload: ProductLotsUpdateOwnerBulkPayload, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<BulkUpdateResponse>>;
    public updateProductLotsOwnerBulk(payload: ProductLotsUpdateOwnerBulkPayload, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling updateProductLotsOwnerBulk.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.put<BulkUpdateResponse>(`${this.basePath}/product-lots/owner/bulk`,
            payload,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Update product-lots permission bulk.
     * Update product-lots permission bulk. Default access - resource:owner.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public updateProductLotsPermissionBulk(payload: ProductLotsUpdatePermissionBulkPayload, observe?: 'body', reportProgress?: boolean): Observable<BulkUpdateResponse>;
    public updateProductLotsPermissionBulk(payload: ProductLotsUpdatePermissionBulkPayload, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<BulkUpdateResponse>>;
    public updateProductLotsPermissionBulk(payload: ProductLotsUpdatePermissionBulkPayload, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<BulkUpdateResponse>>;
    public updateProductLotsPermissionBulk(payload: ProductLotsUpdatePermissionBulkPayload, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling updateProductLotsPermissionBulk.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.put<BulkUpdateResponse>(`${this.basePath}/product-lots/permission/bulk`,
            payload,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Update product-lots sales-data price-of-merit bulk.
     * Update product-lots sales-data price-of-merit bulk. Default access - resource:owner.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public updateProductLotsSalesDataPriceOfMeritBulk(payload: ProductLotsUpdateSalesDataPriceOfMeritBulkPayload, observe?: 'body', reportProgress?: boolean): Observable<BulkUpdateResponse>;
    public updateProductLotsSalesDataPriceOfMeritBulk(payload: ProductLotsUpdateSalesDataPriceOfMeritBulkPayload, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<BulkUpdateResponse>>;
    public updateProductLotsSalesDataPriceOfMeritBulk(payload: ProductLotsUpdateSalesDataPriceOfMeritBulkPayload, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<BulkUpdateResponse>>;
    public updateProductLotsSalesDataPriceOfMeritBulk(payload: ProductLotsUpdateSalesDataPriceOfMeritBulkPayload, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling updateProductLotsSalesDataPriceOfMeritBulk.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.put<BulkUpdateResponse>(`${this.basePath}/product-lots/sales-data/price-of-merit/bulk`,
            payload,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Update product-lots sales-data ship-week-estimate bulk.
     * Update product-lots sales-data ship-week-estimate bulk. Default access - resource:owner.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public updateProductLotsSalesDataShipWeekEstimateBulk(payload: ProductLotsUpdateSalesDataShipWeekEstimateBulkPayload, observe?: 'body', reportProgress?: boolean): Observable<BulkUpdateResponse>;
    public updateProductLotsSalesDataShipWeekEstimateBulk(payload: ProductLotsUpdateSalesDataShipWeekEstimateBulkPayload, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<BulkUpdateResponse>>;
    public updateProductLotsSalesDataShipWeekEstimateBulk(payload: ProductLotsUpdateSalesDataShipWeekEstimateBulkPayload, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<BulkUpdateResponse>>;
    public updateProductLotsSalesDataShipWeekEstimateBulk(payload: ProductLotsUpdateSalesDataShipWeekEstimateBulkPayload, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling updateProductLotsSalesDataShipWeekEstimateBulk.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.put<BulkUpdateResponse>(`${this.basePath}/product-lots/sales-data/ship-week-estimate/bulk`,
            payload,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Update product-lots sales-notes bulk.
     * Update product-lots sales-notes bulk. Default access - resource:owner.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public updateProductLotsSalesNotesBulk(payload: ProductLotsUpdateSalesNotesBulkPayload, observe?: 'body', reportProgress?: boolean): Observable<BulkUpdateResponse>;
    public updateProductLotsSalesNotesBulk(payload: ProductLotsUpdateSalesNotesBulkPayload, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<BulkUpdateResponse>>;
    public updateProductLotsSalesNotesBulk(payload: ProductLotsUpdateSalesNotesBulkPayload, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<BulkUpdateResponse>>;
    public updateProductLotsSalesNotesBulk(payload: ProductLotsUpdateSalesNotesBulkPayload, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling updateProductLotsSalesNotesBulk.');
        }

        let headers = this.defaultHeaders;

        // authentication (oAuth2Security) required
        if (this.configuration.accessToken) {
            const accessToken = typeof this.configuration.accessToken === 'function'
                ? this.configuration.accessToken()
                : this.configuration.accessToken;
            headers = headers.set('Authorization', 'Bearer ' + accessToken);
        }

        // to determine the Accept header
        const httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];
        const httpContentTypeSelected: string | undefined = this.configuration.selectHeaderContentType(consumes);
        if (httpContentTypeSelected != undefined) {
            headers = headers.set('Content-Type', httpContentTypeSelected);
        }

        return this.httpClient.put<BulkUpdateResponse>(`${this.basePath}/product-lots/sales-notes/bulk`,
            payload,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

}