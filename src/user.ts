// (C) 2007-2020 GoodData Corporation
import { XhrModule, ApiResponseError, ApiResponse } from "./xhr";
import { ProjectModule } from "./project";
import qs from "qs";

export interface IUserConfigsSettingItem {
    settingItem: {
        key: string;
        links: {
            self: string;
        };
        source: string;
        value: string;
    };
}

export interface IUserConfigsResponse {
    settings: {
        items: IUserConfigsSettingItem[];
    };
}

export class UserModule {
    constructor(private xhr: XhrModule) {}

    /**
     * Find out whether a user is logged in
     *
     * @return {Promise} resolves with true if user logged in, false otherwise
     * @method isLoggedIn
     */
    public isLoggedIn(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.xhr.get("/gdc/account/token").then(
                r => {
                    if (r.response.ok) {
                        resolve(true);
                    }

                    resolve(false);
                },
                (err: any) => {
                    if (err.response.status === 401) {
                        resolve(false);
                    } else {
                        reject(err);
                    }
                },
            );
        });
    }

    /**
     * Find out whether a specified project is available to a currently logged user
     *
     * @method isLoggedInProject
     * @param {String} projectId A project identifier
     * @return {Promise} Resolves with true if user logged in and project available,
     *                   resolves with false if user logged in and project not available,
     *                   rejects if user not logged in
     */
    public isLoggedInProject(projectId: string) {
        return this.getCurrentProfile().then(profile => {
            return new Promise((resolve, reject) => {
                const projectModule = new ProjectModule(this.xhr);

                projectModule.getProjects(profile.links.self.split("/")[4]).then(
                    projects => {
                        if (projects.find((p: any) => p.links.self === `/gdc/projects/${projectId}`)) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    },
                    (err: ApiResponseError) => {
                        reject(err);
                    },
                );
            });
        });
    }

    /**
     * This function provides an authentication entry point to the GD API. It is needed to authenticate
     * by calling this function prior any other API calls. After providing valid credentials
     * every subsequent API call in a current session will be authenticated.
     *
     * @method login
     * @param {String} username
     * @param {String} password
     */
    public login(username: string, password: string) {
        return this.xhr
            .post("/gdc/account/login", {
                body: JSON.stringify({
                    postUserLogin: {
                        login: username,
                        password,
                        remember: 1,
                        captcha: "",
                        verifyCaptcha: "",
                    },
                }),
            })
            .then(r => r.getData());
    }

    /**
     * This function provides an authentication entry point to the GD API via SSO
     * https://help.gooddata.com/display/developer/GoodData+PGP+Single+Sign-On
     *
     * @method loginSso
     * @param {String} encryptedClaims PGP message
     * @param {String} ssoProvider
     * @param {String} targetUrl
     */
    public loginSso(encryptedClaims: string, ssoProvider: string, targetUrl: string) {
        return this.xhr.post("/gdc/account/customerlogin", {
            data: {
                pgpLoginRequest: {
                    targetUrl,
                    ssoProvider,
                    encryptedClaims,
                },
            },
        });
    }

    /**
     * Logs out current user
     * @method logout
     */
    public logout(): Promise<ApiResponse | void> {
        return this.isLoggedIn().then(
            (loggedIn: boolean): Promise<ApiResponse | void> => {
                if (loggedIn) {
                    return this.xhr.get("/gdc/app/account/bootstrap").then((result: any) => {
                        const data = result.getData();
                        const userUri = data.bootstrapResource.accountSetting.links.self;
                        const userId = userUri.match(/([^\/]+)\/?$/)[1];

                        return this.xhr.del(`/gdc/account/login/${userId}`);
                    });
                }

                return Promise.resolve();
            },
            (err: ApiResponseError) => Promise.reject(err),
        );
    }

    /**
     * Gets current user's profile
     * @method getCurrentProfile
     * @return {Promise} Resolves with account setting object
     */
    public getCurrentProfile() {
        return this.xhr.get("/gdc/account/profile/current").then(r => r.getData().accountSetting);
    }

    /**
     * Updates user's profile settings
     * @method updateProfileSettings
     * @param {String} profileId - User profile identifier
     * @param {Object} profileSetting
     */
    public updateProfileSettings(profileId: string, profileSetting: any): Promise<ApiResponse> {
        // TODO
        return this.xhr.put(`/gdc/account/profile/${profileId}/settings`, {
            body: profileSetting,
        });
    }

    /**
     * Returns info about currently logged in user from bootstrap resource
     * @method getAccountInfo
     */
    public getAccountInfo() {
        return this.xhr.get("/gdc/app/account/bootstrap").then((result: any) => {
            const data = result.getData();
            return this.getAccountInfoInBootstrap(data);
        });
    }

    /**
     * Returns current user info from bootstrapData
     * @method getAccountInfoInBootstrap
     * @param bootstrapData - data was got from bootstrap resource
     */
    public getAccountInfoInBootstrap(bootstrapData: any) {
        const {
            bootstrapResource: {
                accountSetting: {
                    login,
                    firstName,
                    lastName,
                    links: { self: profileUri },
                },
                current: { loginMD5 },
                settings: { organizationName },
            },
        } = bootstrapData;
        return {
            login,
            loginMD5,
            firstName,
            lastName,
            organizationName,
            profileUri,
        };
    }

    /**
     * Gets user configs including user specific feature flags
     *
     * @param {String} userId - A user identifier
     * @return {IUserConfigsSettingItem[]} An array of user configs setting item
     */
    public getUserConfigs(userId: string): Promise<IUserConfigsSettingItem[]> {
        return this.xhr.get(`/gdc/account/profile/${userId}/config`).then((apiResponse: ApiResponse) => {
            const userConfigs: IUserConfigsResponse = apiResponse.getData();
            const {
                settings: { items },
            } = userConfigs;

            return items || [];
        });
    }

    /**
     * Returns the feature flags valid for the currently logged in user.
     * @method getFeatureFlags
     */
    public getFeatureFlags() {
        return this.xhr
            .get("/gdc/app/account/bootstrap")
            .then((r: any) => r.getData())
            .then((result: any) => result.bootstrapResource.current.featureFlags);
    }

    /**
     * Initiates SPI SAML SSO
     * @param relayState URL of the page where the user is redirected after a successful login
     */
    public initiateSamlSso(relayState: string) {
        this.xhr
            .get(`/gdc/account/samlrequest?${qs.stringify({ relayState })}`)
            .then(data => data.getData())
            .then(response => {
                const loginUrl = response.samlRequests.items[0].samlRequest.loginUrl;
                window.location.assign(loginUrl);
            });
    }
}
