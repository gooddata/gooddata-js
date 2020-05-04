// (C) 2020 GoodData Corporation
import { XhrModule } from "./xhr";

export class BootstrapModule {
    constructor(private xhr: XhrModule) {}

    /**
     * Returns information about currently logged in user from bootstrap resource
     * @method getBootstrapData
     */
    public getBootstrapData(): Promise<any> {
        return this.xhr.get("/gdc/app/account/bootstrap").then((result: any) => result.getData());
    }

    /**
     * Returns the mapboxToken for using GeoPushpinChart
     * @method getMapboxToken
     * @param {any} bootstrapData - data from bootstrap resource
     */
    public getMapboxToken(bootstrapData: any): string | null {
        return bootstrapData.bootstrapResource.current.mapboxToken || null;
    }
}
