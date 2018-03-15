// Copyright (C) 2007-2017, GoodData(R) Corporation. All rights reserved.

export function createModule(xhr) {
    /**
     * Find out whether a user is logged in
     *
     * @return {Promise} resolves with true if user logged in, false otherwise
     * @method isLoggedIn
     */
    function isLoggedIn() {
        return new Promise((resolve, reject) => {
            xhr.get('/gdc/account/token').then((r) => {
                if (r.response.ok) {
                    resolve(true);
                }

                resolve(false);
            }, (err) => {
                if (err.response.status === 401) {
                    resolve(false);
                } else {
                    reject(err);
                }
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
    function login(username, password) {
        return xhr.post('/gdc/account/login', {
            body: JSON.stringify({
                postUserLogin: {
                    login: username,
                    password,
                    remember: 1,
                    captcha: '',
                    verifyCaptcha: ''
                }
            })
        }).then((r => r.getData()));
    }

    /**
     * This function provides an authentication entry point to the GD API via SSO
     * https://help.gooddata.com/display/developer/GoodData+PGP+Single+Sign-On
     *
     * @method loginSso
     * @param {String} sessionId PGP message
     * @param {String} serverUrl
     * @param {String} targetUrl
     */
    function loginSso(sessionId, serverUrl, targetUrl) {
        return xhr.get(`/gdc/account/customerlogin?sessionId=${sessionId}&serverURL=${serverUrl}&targetURL=${targetUrl}`);
    }

    /**
     * Logs out current user
     * @method logout
     */
    function logout() {
        return isLoggedIn().then((loggedIn) => {
            if (loggedIn) {
                return xhr
                    .get('/gdc/app/account/bootstrap')
                    .then((result) => {
                        const data = result.getData();
                        const userUri = data.bootstrapResource.accountSetting.links.self;
                        const userId = userUri.match(/([^\/]+)\/?$/)[1]; // eslint-disable-line no-useless-escape

                        return xhr.del(`/gdc/account/login/${userId}`);
                    });
            }

            return Promise.resolve();
        }, err => Promise.reject(err));
    }

    /**
     * Updates user's profile settings
     * @method updateProfileSettings
     * @param {String} profileId - User profile identifier
     * @param {Object} profileSetting
    */
    function updateProfileSettings(profileId, profileSetting) {
        return xhr.put(`/gdc/account/profile/${profileId}/settings`, {
            data: profileSetting
        });
    }

    /**
     * Returns info about currently logged in user from bootstrap resource
     * @method getAccountInfo
     */
    function getAccountInfo() {
        return xhr.get('/gdc/app/account/bootstrap')
            .then((result) => {
                const { bootstrapResource } = result.getData();
                const accountInfo = {
                    login: bootstrapResource.accountSetting.login,
                    loginMD5: bootstrapResource.current.loginMD5,
                    firstName: bootstrapResource.accountSetting.firstName,
                    lastName: bootstrapResource.accountSetting.lastName,
                    organizationName: bootstrapResource.settings.organizationName,
                    profileUri: bootstrapResource.accountSetting.links.self
                };

                return accountInfo;
            });
    }

    /**
     * Returns the feature flags valid for the currently logged in user.
     * @method getFeatureFlags
     */
    function getFeatureFlags() {
        return xhr.get('/gdc/app/account/bootstrap')
            .then((r => r.getData()))
            .then(result => result.bootstrapResource.current.featureFlags);
    }

    return {
        isLoggedIn,
        login,
        loginSso,
        logout,
        updateProfileSettings,
        getAccountInfo,
        getFeatureFlags
    };
}
