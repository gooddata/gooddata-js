// (C) 2007-2020 GoodData Corporation
import "isomorphic-fetch";
import fetchMock from "fetch-mock";
import { BootstrapModule } from "../src/bootstrap";
import { XhrModule } from "../src/xhr";

const createBootstrap = () => new BootstrapModule(new XhrModule(fetch, {}));
const bootstrapResource = {
    bootstrapResource: {
        accountSetting: {
            login: "LOGIN",
            firstName: "FIRST_NAME",
            lastName: "LAST_NAME",
            links: {
                self: "PROFILE_URI",
            },
        },
        current: {
            loginMD5: "LOGIN_MD5",
            mapboxToken: "mapbox token",
        },
        settings: {
            organizationName: "ORG_NAME",
        },
    },
};

describe("bootstrap", () => {
    it("should return info about currently logged in user", () => {
        fetchMock.mock("/gdc/app/account/bootstrap", {
            status: 200,
            body: JSON.stringify(bootstrapResource),
        });

        return createBootstrap()
            .getBootstrapData()
            .then(response => {
                expect(response).toEqual({
                    bootstrapResource: {
                        accountSetting: {
                            firstName: "FIRST_NAME",
                            lastName: "LAST_NAME",
                            links: {
                                self: "PROFILE_URI",
                            },
                            login: "LOGIN",
                        },
                        current: {
                            loginMD5: "LOGIN_MD5",
                            mapboxToken: "mapbox token",
                        },
                        settings: {
                            organizationName: "ORG_NAME",
                        },
                    },
                });
            });
    });

    it("should return mapboxToken from BootstrapData", () => {
        const mapboxToken = createBootstrap().getMapboxToken(bootstrapResource);
        expect(mapboxToken).toEqual("mapbox token");
    });
});
