// Copyright (C) 2007-2014, GoodData(R) Corporation. All rights reserved.
import fetchMock from './utils/fetch-mock';
import { createModule as userFactory } from '../src/user';
import { createModule as xhrFactory } from '../src/xhr';

const configStorage = {};
const xhr = xhrFactory(configStorage);
const user = userFactory(xhr);

describe('user', () => {
    describe('with fake server', () => {
        afterEach(() => {
            fetchMock.restore();
        });

        describe('login', () => {
            it('resolves with userLogin using valid credential', () => {
                fetchMock.post(
                    '/gdc/account/login',
                    {
                        status: 200,
                        body: JSON.stringify(
                            { userLogin: { profile: '/gdc/account/profile/abcd', state: '/gdc/account/login/abcd' } }
                        )
                    }
                );

                expect.assertions(1);

                return user.login('login', 'pass').then((result) => {
                    expect(result).toEqual(
                        { userLogin: { profile: '/gdc/account/profile/abcd', state: '/gdc/account/login/abcd' } }
                    );
                });
            });

            it('rejects with bad credentials', () => {
                expect.assertions(1);
                fetchMock.post(
                    '/gdc/account/login',
                    400
                );

                return user.login('bad', 'creds').then(null, err => expect(err).toBeInstanceOf(Error));
            });
        });

        describe('loginSso', () => {
            it('should resolve if user logged in', () => {
                expect.assertions(1);
                const sessionId = `
                    -----BEGIN+PGP+MESSAGE-----
                    1234
                    -----END+PGP+MESSAGE-----
                `;
                const serverUrl = 'foobar';
                const targetUrl = '/dashboard.html';

                fetchMock.mock(
                    `/gdc/account/customerlogin?sessionId=${sessionId}&serverURL=${serverUrl}&targetURL=${targetUrl}`,
                    200
                );

                return user.loginSso(sessionId, serverUrl, targetUrl)
                    .then(r => expect(r.response.ok).toBeTruthy());
            });

            it('should reject for invalid sessionId', () => {
                expect.assertions(1);
                const sessionId = `
                    -----BEGIN+PGP+MESSAGE-----
                    wrong sessionId
                    -----END+PGP+MESSAGE-----
                `;
                const serverUrl = 'foobar';
                const targetUrl = '/dashboard.html';

                fetchMock.mock(
                    `/gdc/account/customerlogin?sessionId=${sessionId}&serverURL=${serverUrl}&targetURL=${targetUrl}`,
                    400
                );
                return user.loginSso(sessionId, serverUrl, targetUrl).then(null, (err) => {
                    expect(err.response.status).toBe(400);
                });
            });
        });

        describe('isLoggedIn', () => {
            it('should resolve if user logged in', () => {
                expect.assertions(1);
                fetchMock.mock(
                    '/gdc/account/token',
                    200
                );
                return expect(user.isLoggedIn()).resolves.toBeTruthy();
            });

            it('should resolve with false if user not logged in', () => {
                expect.assertions(1);
                fetchMock.mock(
                    '/gdc/account/token',
                    401
                );
                return expect(user.isLoggedIn()).resolves.toBeFalsy();
            });
        });

        describe('logout', () => {
            it('should resolve when user is not logged in', () => {
                expect.assertions(1);
                fetchMock.mock(
                    '/gdc/account/token',
                    401
                );

                return expect(user.logout()).resolves.toEqual(undefined);
            });

            it('should log out user', () => {
                expect.assertions(1);
                const userId = 'USER_ID';

                fetchMock.mock(
                    '/gdc/account/token',
                    200
                );

                fetchMock.mock(
                    '/gdc/app/account/bootstrap',
                    {
                        status: 200,
                        body: JSON.stringify({
                            bootstrapResource: {
                                accountSetting: {
                                    links: {
                                        self: `/gdc/account/profile/${userId}`
                                    }
                                }
                            }
                        })
                    }
                );

                fetchMock.delete(
                    `/gdc/account/login/${userId}`,
                    200 // should be 204, but see https://github.com/wheresrhys/fetch-mock/issues/36
                );

                return user.logout().then((r) => {
                    return expect(r.response.ok).toBeTruthy();
                });
            });
        });

        describe('updateProfileSettings', () => {
            it('should update user\'s settings', () => {
                expect.assertions(1);
                const userId = 'USER_ID';

                fetchMock.mock(
                    `/gdc/account/profile/${userId}/settings`,
                    { status: 400, body: '' }
                );
                return user.updateProfileSettings(userId, []).then(null, (err) => {
                    return expect(err.response.status).toBe(400);
                });
            });
        });

        describe('Account info', () => {
            it('should return info about account', () => {
                expect.assertions(6);
                const login = 'LOGIN';
                const loginMD5 = 'LOGIN_MD5';
                const firstName = 'FIRST_NAME';
                const lastName = 'LAST_NAME';
                const organizationName = 'ORG_NAME';
                const profileUri = 'PROFILE_URI';

                fetchMock.mock(
                    '/gdc/app/account/bootstrap',
                    {
                        status: 200,
                        body: JSON.stringify({
                            bootstrapResource: {
                                accountSetting: {
                                    login,
                                    firstName,
                                    lastName,
                                    links: {
                                        self: profileUri
                                    }
                                },
                                current: {
                                    loginMD5
                                },
                                settings: {
                                    organizationName
                                }
                            }
                        })
                    }
                );

                return user.getAccountInfo().then((accountInfo) => {
                    expect(accountInfo.login).toEqual(login);
                    expect(accountInfo.loginMD5).toEqual(loginMD5);
                    expect(accountInfo.firstName).toEqual(firstName);
                    expect(accountInfo.lastName).toEqual(lastName);
                    expect(accountInfo.organizationName).toEqual(organizationName);
                    expect(accountInfo.profileUri).toEqual(profileUri);
                });
            });
        });
    });
});
