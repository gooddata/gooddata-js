// (C) 2007-2020 GoodData Corporation
import cloneDeep from "lodash/cloneDeep";
import { XhrModule } from "./xhr";
import { UserModule } from "./user";
import { MetadataModule } from "./metadata";
import { ExecutionModule } from "./execution";
import { ProjectModule } from "./project";
import { ReportModule } from "./report/report";
import { DashboardModule } from "./dashboard/dashboard";
import { sanitizeConfig, IConfigStorage, ConfigModule } from "./config";
import { CatalogueModule } from "./catalogue";
import { AdminModule } from "./admin";

import { AttributesMapLoaderModule } from "./utils/attributesMapLoader";
import { getAttributesDisplayForms } from "./utils/visualizationObjectHelper";
import { convertReferencesToUris, ReferenceConverter } from "./referenceHandling";
import { MetadataModuleExt } from "./metadataExt";
import { getUIDByDevice } from "./util";

/**
 * # JS SDK
 * Here is a set of functions that mostly are a thin wraper over the [GoodData API](https://developer.gooddata.com/api).
 * Before calling any of those functions, you need to authenticate with a valid GoodData
 * user credentials. After that, every subsequent call in the current session is authenticated.
 * You can find more about the GD authentication mechanism here.
 *
 * ## GD Authentication Mechansim
 * In this JS SDK library we provide you with a simple `login(username, passwd)` function
 * that does the magic for you.
 * To fully understand the authentication mechansim, please read
 * [Authentication via API article](http://developer.gooddata.com/article/authentication-via-api)
 * on [GoodData Developer Portal](http://developer.gooddata.com/)
 *
 * @module sdk
 * @class sdk
 */
export class SDK {
    public config: ConfigModule;
    public xhr: XhrModule;
    public user: UserModule;
    public md: MetadataModule;
    public mdExt: MetadataModuleExt;
    public execution: ExecutionModule;
    public project: ProjectModule;
    public report: ReportModule;
    public dashboard: DashboardModule;
    public catalogue: CatalogueModule;
    public admin: AdminModule;
    public configStorage: IConfigStorage;
    public utils: {
        loadAttributesMap: any;
        getAttributesDisplayForms: any;
        convertReferencesToUris: ReferenceConverter;
        getUIDByDevice: () => string;
    };

    constructor(private fetchMethod: typeof fetch, config = {}) {
        this.configStorage = sanitizeConfig(config); // must be plain object, SDK modules MUST use this storage

        this.config = new ConfigModule(this.configStorage);
        this.xhr = new XhrModule(fetchMethod, this.configStorage);
        this.user = new UserModule(this.xhr);
        this.md = new MetadataModule(this.xhr);
        this.mdExt = new MetadataModuleExt(this.xhr);
        this.execution = new ExecutionModule(this.xhr, this.md);
        this.project = new ProjectModule(this.xhr);
        this.report = new ReportModule(this.xhr);
        this.dashboard = new DashboardModule(this.xhr);
        this.catalogue = new CatalogueModule(this.xhr, this.execution);
        this.admin = new AdminModule(this.xhr);

        const attributesMapLoaderModule = new AttributesMapLoaderModule(this.md);
        this.utils = {
            loadAttributesMap: attributesMapLoaderModule.loadAttributesMap.bind(attributesMapLoaderModule),
            getAttributesDisplayForms,
            convertReferencesToUris,
            getUIDByDevice,
        };
    }

    public clone() {
        return new SDK(this.fetchMethod, cloneDeep(this.configStorage));
    }
}

/**
 * # Factory for creating SDK instances
 *
 * @param {object|null} config object to be passed to SDK constructor
 * @method setCustomDomain
 */
export const factory = (fetchMethod: typeof fetch) => (config = {}) => new SDK(fetchMethod, config);
