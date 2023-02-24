/**
 * Base API
 * Base API Definition.
 *
 * OpenAPI spec version: 0.316.0
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

import { Facilities } from '../model/facilities';
import { FacilitiesSummary } from '../model/facilitiesSummary';
import { Facility } from '../model/facility';
import { FacilityBase } from '../model/facilityBase';
import { FacilityCreatePayload } from '../model/facilityCreatePayload';
import { FacilityPersonnel } from '../model/facilityPersonnel';
import { TransportMethod } from '../model/transportMethod';

import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';


@Injectable()
export class FacilitiesService {

    protected basePath = 'http://base-api-development.buychain.tech/v1';
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
     * Add facility.
     * Add facility. Default access - none.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public addFacility(payload: FacilityCreatePayload, observe?: 'body', reportProgress?: boolean): Observable<Facility>;
    public addFacility(payload: FacilityCreatePayload, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Facility>>;
    public addFacility(payload: FacilityCreatePayload, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Facility>>;
    public addFacility(payload: FacilityCreatePayload, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling addFacility.');
        }

        let headers = this.defaultHeaders;

        // authentication (AccessToken) required
        if (this.configuration.apiKeys["authorization"]) {
            headers = headers.set('authorization', this.configuration.apiKeys["authorization"]);
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

        return this.httpClient.post<Facility>(`${this.basePath}/facilities`,
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
     * Add facility personnel.
     * Add facility personnel. Default access - none. - The user should be a company member.
     * @param id Facility id - hex, ref Facilities.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public addFacilityPersonnel(id: string, payload: FacilityPersonnel, observe?: 'body', reportProgress?: boolean): Observable<FacilityPersonnel>;
    public addFacilityPersonnel(id: string, payload: FacilityPersonnel, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<FacilityPersonnel>>;
    public addFacilityPersonnel(id: string, payload: FacilityPersonnel, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<FacilityPersonnel>>;
    public addFacilityPersonnel(id: string, payload: FacilityPersonnel, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling addFacilityPersonnel.');
        }

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling addFacilityPersonnel.');
        }

        let headers = this.defaultHeaders;

        // authentication (AccessToken) required
        if (this.configuration.apiKeys["authorization"]) {
            headers = headers.set('authorization', this.configuration.apiKeys["authorization"]);
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

        return this.httpClient.post<FacilityPersonnel>(`${this.basePath}/facilities/${encodeURIComponent(String(id))}/personnel`,
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
     * Add facility transport-method.
     * Add facility transport-method. Default access - none. - The carrier should be from the list of supported carriers.
     * @param id Facility id - hex, ref Facilities.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public addFacilityTransportMethod(id: string, payload: TransportMethod, observe?: 'body', reportProgress?: boolean): Observable<TransportMethod>;
    public addFacilityTransportMethod(id: string, payload: TransportMethod, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<TransportMethod>>;
    public addFacilityTransportMethod(id: string, payload: TransportMethod, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<TransportMethod>>;
    public addFacilityTransportMethod(id: string, payload: TransportMethod, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling addFacilityTransportMethod.');
        }

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling addFacilityTransportMethod.');
        }

        let headers = this.defaultHeaders;

        // authentication (AccessToken) required
        if (this.configuration.apiKeys["authorization"]) {
            headers = headers.set('authorization', this.configuration.apiKeys["authorization"]);
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

        return this.httpClient.post<TransportMethod>(`${this.basePath}/facilities/${encodeURIComponent(String(id))}/transport-methods`,
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
     * Delete facility personnel.
     * Delete facility personnel. Default access - none.
     * @param id Facility id - hex, ref Facilities.
     * @param personnelId Personnel id - hex, ref Facilities.personnel.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public deleteFacilityPersonnel(id: string, personnelId: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public deleteFacilityPersonnel(id: string, personnelId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public deleteFacilityPersonnel(id: string, personnelId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public deleteFacilityPersonnel(id: string, personnelId: string, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling deleteFacilityPersonnel.');
        }

        if (personnelId === null || personnelId === undefined) {
            throw new Error('Required parameter personnelId was null or undefined when calling deleteFacilityPersonnel.');
        }

        let headers = this.defaultHeaders;

        // authentication (AccessToken) required
        if (this.configuration.apiKeys["authorization"]) {
            headers = headers.set('authorization', this.configuration.apiKeys["authorization"]);
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

        return this.httpClient.delete<any>(`${this.basePath}/facilities/${encodeURIComponent(String(id))}/personnel/${encodeURIComponent(String(personnelId))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Delete facility transport-method.
     * Delete facility transport-method. Default access - none.
     * @param id Facility id - hex, ref Facilities.
     * @param transportMethodId Transport-method id - hex, ref Facilities.transportMethods.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public deleteFacilityTransportMethod(id: string, transportMethodId: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public deleteFacilityTransportMethod(id: string, transportMethodId: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public deleteFacilityTransportMethod(id: string, transportMethodId: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public deleteFacilityTransportMethod(id: string, transportMethodId: string, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling deleteFacilityTransportMethod.');
        }

        if (transportMethodId === null || transportMethodId === undefined) {
            throw new Error('Required parameter transportMethodId was null or undefined when calling deleteFacilityTransportMethod.');
        }

        let headers = this.defaultHeaders;

        // authentication (AccessToken) required
        if (this.configuration.apiKeys["authorization"]) {
            headers = headers.set('authorization', this.configuration.apiKeys["authorization"]);
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

        return this.httpClient.delete<any>(`${this.basePath}/facilities/${encodeURIComponent(String(id))}/transport-methods/${encodeURIComponent(String(transportMethodId))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Get facilities.
     * Get facilities. Default access - company:member.
     * @param archived Archived.
     * @param limit Limit - minimum 1, maximum 1000.
     * @param offset Offset - minimum 0.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getFacilities(archived?: boolean, limit?: number, offset?: number, observe?: 'body', reportProgress?: boolean): Observable<Facilities>;
    public getFacilities(archived?: boolean, limit?: number, offset?: number, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Facilities>>;
    public getFacilities(archived?: boolean, limit?: number, offset?: number, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Facilities>>;
    public getFacilities(archived?: boolean, limit?: number, offset?: number, observe: any = 'body', reportProgress = false ): Observable<any> {




        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (archived !== undefined && archived !== null) {
            queryParameters = queryParameters.set('archived', <any>archived);
        }
        if (limit !== undefined && limit !== null) {
            queryParameters = queryParameters.set('limit', <any>limit);
        }
        if (offset !== undefined && offset !== null) {
            queryParameters = queryParameters.set('offset', <any>offset);
        }

        let headers = this.defaultHeaders;

        // authentication (AccessToken) required
        if (this.configuration.apiKeys["authorization"]) {
            headers = headers.set('authorization', this.configuration.apiKeys["authorization"]);
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

        return this.httpClient.get<Facilities>(`${this.basePath}/facilities`,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Get facilities summary.
     * Get facilities summary. Access - member.
     * @param companyId Company id - hex, ref Companies.
     * @param archived Archived.
     * @param limit Limit - minimum 1, maximum 1000.
     * @param offset Offset - minimum 0.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getFacilitiesSummary(companyId: string, archived?: boolean, limit?: number, offset?: number, observe?: 'body', reportProgress?: boolean): Observable<FacilitiesSummary>;
    public getFacilitiesSummary(companyId: string, archived?: boolean, limit?: number, offset?: number, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<FacilitiesSummary>>;
    public getFacilitiesSummary(companyId: string, archived?: boolean, limit?: number, offset?: number, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<FacilitiesSummary>>;
    public getFacilitiesSummary(companyId: string, archived?: boolean, limit?: number, offset?: number, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (companyId === null || companyId === undefined) {
            throw new Error('Required parameter companyId was null or undefined when calling getFacilitiesSummary.');
        }




        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (companyId !== undefined && companyId !== null) {
            queryParameters = queryParameters.set('companyId', <any>companyId);
        }
        if (archived !== undefined && archived !== null) {
            queryParameters = queryParameters.set('archived', <any>archived);
        }
        if (limit !== undefined && limit !== null) {
            queryParameters = queryParameters.set('limit', <any>limit);
        }
        if (offset !== undefined && offset !== null) {
            queryParameters = queryParameters.set('offset', <any>offset);
        }

        let headers = this.defaultHeaders;

        // authentication (AccessToken) required
        if (this.configuration.apiKeys["authorization"]) {
            headers = headers.set('authorization', this.configuration.apiKeys["authorization"]);
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

        return this.httpClient.get<FacilitiesSummary>(`${this.basePath}/facilities/summary`,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Get facility.
     * Get facility. Default access - company:member.
     * @param id Facility id - hex, ref Facilities.
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getFacility(id: string, observe?: 'body', reportProgress?: boolean): Observable<Facility>;
    public getFacility(id: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Facility>>;
    public getFacility(id: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Facility>>;
    public getFacility(id: string, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling getFacility.');
        }

        let headers = this.defaultHeaders;

        // authentication (AccessToken) required
        if (this.configuration.apiKeys["authorization"]) {
            headers = headers.set('authorization', this.configuration.apiKeys["authorization"]);
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

        return this.httpClient.get<Facility>(`${this.basePath}/facilities/${encodeURIComponent(String(id))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Update facility.
     * Update facility. Default access - none.
     * @param id Facility id - hex, ref Facilities.
     * @param payload
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public updateFacility(id: string, payload: FacilityBase, observe?: 'body', reportProgress?: boolean): Observable<Facility>;
    public updateFacility(id: string, payload: FacilityBase, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<Facility>>;
    public updateFacility(id: string, payload: FacilityBase, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<Facility>>;
    public updateFacility(id: string, payload: FacilityBase, observe: any = 'body', reportProgress = false ): Observable<any> {

        if (id === null || id === undefined) {
            throw new Error('Required parameter id was null or undefined when calling updateFacility.');
        }

        if (payload === null || payload === undefined) {
            throw new Error('Required parameter payload was null or undefined when calling updateFacility.');
        }

        let headers = this.defaultHeaders;

        // authentication (AccessToken) required
        if (this.configuration.apiKeys["authorization"]) {
            headers = headers.set('authorization', this.configuration.apiKeys["authorization"]);
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

        return this.httpClient.patch<Facility>(`${this.basePath}/facilities/${encodeURIComponent(String(id))}`,
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