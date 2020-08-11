// (C) 2007-2020 GoodData Corporation
import { getIn, handlePolling, getAllPagesByOffsetLimit } from "./util";
import { ITimezone, IColor, IColorPalette, IFeatureFlags } from "./interfaces";
import { IStyleSettingsResponse, IFeatureFlagsResponse } from "./apiResponsesInterfaces";
import { XhrModule, ApiResponse } from "./xhr";

const DEFAULT_PALETTE = [
    { r: 0x2b, g: 0x6b, b: 0xae },
    { r: 0x69, g: 0xaa, b: 0x51 },
    { r: 0xee, g: 0xb1, b: 0x4c },
    { r: 0xd5, g: 0x3c, b: 0x38 },
    { r: 0x89, g: 0x4d, b: 0x94 },
    { r: 0x73, g: 0x73, b: 0x73 },
    { r: 0x44, g: 0xa9, b: 0xbe },
    { r: 0x96, g: 0xbd, b: 0x5f },
    { r: 0xfd, g: 0x93, b: 0x69 },
    { r: 0xe1, g: 0x5d, b: 0x86 },
    { r: 0x7c, g: 0x6f, b: 0xad },
    { r: 0xa5, g: 0xa5, b: 0xa5 },
    { r: 0x7a, g: 0xa6, b: 0xd5 },
    { r: 0x82, g: 0xd0, b: 0x8d },
    { r: 0xff, g: 0xd2, b: 0x89 },
    { r: 0xf1, g: 0x84, b: 0x80 },
    { r: 0xbf, g: 0x90, b: 0xc6 },
    { r: 0xbf, g: 0xbf, b: 0xbf },
];

const isProjectCreated = (project: any) => {
    // TODO
    const projectState = project.content.state;

    return projectState === "ENABLED" || projectState === "DELETED";
};

export interface IProjectConfigSettingItem {
    settingItem: {
        key: string;
        links: {
            self: string;
        };
        source: string;
        value: string;
    };
}
export interface IProjectConfigResponse {
    settings: {
        items: IProjectConfigSettingItem[];
    };
}

// Parses string values to boolean, number and string
export const parseSettingItemValue = (value: string): boolean | number | string => {
    if (value === "true") {
        return true;
    }
    if (value === "false") {
        return false;
    }
    const nr = Number(value);
    if (nr.toString() === value) {
        return nr;
    }
    return value;
};

/**
 * Functions for working with projects
 *
 * @class project
 * @module project
 */
export class ProjectModule {
    constructor(private xhr: XhrModule) {}

    /**
     * Get current project id
     *
     * @method getCurrentProjectId
     * @return {String} current project identifier
     */
    public getCurrentProjectId() {
        return this.xhr
            .get("/gdc/app/account/bootstrap")
            .then(r => r.getData())
            .then(this.getCurrentProjectIdInBootstrap);
    }

    /**
     * Return current project id in bootstrap
     * @method getCurrentProjectIdInBootstrap
     * @param bootstrapData - data was got from bootstrap resource
     */
    public getCurrentProjectIdInBootstrap(bootstrapData: any): string | null {
        const currentProject = bootstrapData.bootstrapResource.current.project;
        // handle situation in which current project is missing (e.g. new user)
        if (!currentProject) {
            return null;
        }

        return bootstrapData.bootstrapResource.current.project.links.self.split("/").pop();
    }

    /**
     * Fetches projects available for the user represented by the given profileId
     *
     * @method getProjects
     * @param {String} profileId - User profile identifier
     * @return {Array} An Array of projects
     */
    public getProjects(profileId: string) {
        return getAllPagesByOffsetLimit(
            this.xhr,
            `/gdc/account/profile/${profileId}/projects`,
            "projects",
        ).then((result: any) => result.map((p: any) => p.project));
    }

    /**
     * Fetches all datasets for the given project
     *
     * @method getDatasets
     * @param {String} projectId - GD project identifier
     * @return {Array} An array of objects containing datasets metadata
     */
    public getDatasets(projectId: string) {
        return this.xhr
            .get(`/gdc/md/${projectId}/query/datasets`)
            .then(r => r.getData())
            .then(getIn("query.entries"));
    }

    /**
     * Fetches a chart color palette for a project represented by the given
     * projectId parameter.
     *
     * @method getColorPalette
     * @param {String} projectId - A project identifier
     * @return {Array} An array of objects with r, g, b fields representing a project's
     * color palette
     */
    public getColorPalette(projectId: string) {
        return this.xhr
            .get(`/gdc/projects/${projectId}/styleSettings`)
            .then(r => r.getData())
            .then(
                (result: any) => {
                    return result.styleSettings.chartPalette.map((c: any) => {
                        return {
                            r: c.fill.r,
                            g: c.fill.g,
                            b: c.fill.b,
                        };
                    });
                },
                err => {
                    if (err.status === 200) {
                        return DEFAULT_PALETTE;
                    }

                    throw new Error(err.statusText);
                },
            );
    }

    /**
     * Fetches a chart color palette for a project represented by the given
     * projectId parameter.
     *
     * @method getColorPaletteWithGuids
     * @param {String} projectId - A project identifier
     * @return {Array} An array of objects representing a project's
     * color palette with color guid or undefined
     */
    public getColorPaletteWithGuids(projectId: string): Promise<IColorPalette | undefined> {
        return this.xhr
            .get(`/gdc/projects/${projectId}/styleSettings`)
            .then((apiResponse: ApiResponse) => {
                return apiResponse.getData();
            })
            .then((result: IStyleSettingsResponse) => {
                if (result && result.styleSettings) {
                    return result.styleSettings.chartPalette;
                } else {
                    return undefined;
                }
            });
    }

    /**
     * Sets given colors as a color palette for a given project.
     *
     * @method setColorPalette
     * @param {String} projectId - GD project identifier
     * @param {Array} colors - An array of colors that we want to use within the project.
     * Each color should be an object with r, g, b fields. // TODO really object?
     */
    public setColorPalette(projectId: string, colors: IColor[]): Promise<ApiResponse> {
        return this.xhr.put(`/gdc/projects/${projectId}/styleSettings`, {
            body: {
                styleSettings: {
                    chartPalette: colors.map((fill, idx: number) => {
                        return { fill, guid: `guid${idx}` };
                    }),
                },
            },
        });
    }

    /**
     * Gets current timezone and its offset. Example output:
     *
     *     {
     *         id: 'Europe/Prague',
     *         displayName: 'Central European Time',
     *         currentOffsetMs: 3600000
     *     }
     *
     * @method getTimezone
     * @param {String} projectId - GD project identifier
     */
    public getTimezone(projectId: string): Promise<ITimezone> {
        const bootstrapUrl = `/gdc/app/account/bootstrap?projectId=${projectId}`;

        return this.xhr
            .get(bootstrapUrl)
            .then(r => r.getData())
            .then((result: any) => {
                return result.bootstrapResource.current.timezone;
            });
    }

    public setTimezone(projectId: string, timezone: ITimezone) {
        const timezoneServiceUrl = `/gdc/md/${projectId}/service/timezone`;
        const data = {
            service: { timezone },
        };

        return this.xhr
            .post(timezoneServiceUrl, {
                body: data,
            })
            .then(r => r.getData());
    }

    /**
     * Create project
     * Note: returns a promise which is resolved when the project creation is finished
     *
     * @experimental
     * @method createProject
     * @param {String} title
     * @param {String} authorizationToken
     * @param {Object} options for project creation (summary, projectTemplate, ...)
     * @return {Object} created project object
     */
    public createProject(title: string, authorizationToken: string, options: any = {}) {
        const {
            summary,
            projectTemplate,
            driver = "Pg",
            environment = "TESTING",
            guidedNavigation = 1,
        } = options;

        return this.xhr
            .post("/gdc/projects", {
                body: JSON.stringify({
                    project: {
                        content: {
                            guidedNavigation,
                            driver,
                            authorizationToken,
                            environment,
                        },
                        meta: {
                            title,
                            summary,
                            projectTemplate,
                        },
                    },
                }),
            })
            .then(r => r.getData())
            .then((project: any) =>
                handlePolling(
                    this.xhr.get.bind(this.xhr),
                    project.uri,
                    (response: any) => {
                        // TODO project response
                        return isProjectCreated(response.project);
                    },
                    options,
                ),
            );
    }

    /**
     * Delete project
     *
     * @method deleteProject
     * @param {String} projectId
     */
    public deleteProject(projectId: string) {
        return this.xhr.del(`/gdc/projects/${projectId}`);
    }

    /**
     * Gets aggregated feature flags for given project and current user
     *
     * @method getFeatureFlags
     * @param {String} projectId - A project identifier
     * @return {IFeatureFlags} Hash table of feature flags and theirs values where feature flag is as key
     */
    public getFeatureFlags(projectId: string): Promise<IFeatureFlags> {
        return this.xhr
            .get(`/gdc/app/projects/${projectId}/featureFlags`)
            .then((apiResponse: ApiResponse) => {
                return apiResponse.getData();
            })
            .then((result: IFeatureFlagsResponse) => {
                if (result && result.featureFlags) {
                    return result.featureFlags;
                }
                return {};
            });
    }

    /**
     * Gets project config including project specific feature flags
     *
     * @param {String} projectId - A project identifier
     * @return {IProjectConfigSettingItem[]} An array of project config setting items
     */
    public getConfig(projectId: string): Promise<IProjectConfigSettingItem[]> {
        return this.xhr
            .get(`/gdc/app/projects/${projectId}/config`)
            .then((apiResponse: ApiResponse) => {
                const projectConfig = apiResponse.getData();
                return projectConfig;
            })
            .then((result: IProjectConfigResponse) => {
                if (result && result.settings && result.settings.items) {
                    return result.settings.items;
                }
                return [];
            });
    }

    /**
     * Gets project specific feature flags
     *
     * @param {String} projectId - A project identifier
     * @param {String} source - optional filter settingItems with specific source
     * @return {IFeatureFlags} Hash table of feature flags and theirs values where feature flag is as key
     */
    public getProjectFeatureFlags(projectId: string, source?: string): Promise<IFeatureFlags> {
        return this.getConfig(projectId).then((settingItems: IProjectConfigSettingItem[]) => {
            const filteredSettingItems = source
                ? settingItems.filter(settingItem => settingItem.settingItem.source === source)
                : settingItems;
            const featureFlags: IFeatureFlags = {};
            const x = featureFlags ? 0 : 1;
            // tslint:disable-next-line:no-console
            console.log(x);
            filteredSettingItems.forEach(settingItem => {
                featureFlags[settingItem.settingItem.key] = parseSettingItemValue(
                    settingItem.settingItem.value,
                );
            });
            return featureFlags;
        });
    }
}
