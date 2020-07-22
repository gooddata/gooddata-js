// (C) 2020 GoodData Corporation
import "isomorphic-fetch";
import fetchMock from "fetch-mock";

import { LdmModule } from "../src/ldm";
import { XhrModule } from "../src/xhr";
import { BAD_REQUEST_STATUS } from "../src/constants/errors";

function createLdmModule() {
    const xhr = new XhrModule(fetch, {});

    return new LdmModule(xhr);
}

function isRequestInit(request: fetchMock.MockRequest): request is RequestInit {
    return !!(request as RequestInit).body !== undefined;
}

function getRequestBody() {
    const request = fetchMock.lastOptions();

    if (isRequestInit(request) && request.body) {
        return JSON.parse(request.body.toString());
    }

    throw new Error("Unexpected type of request");
}

describe("LDM module", () => {
    const projectId = "some_id";

    describe("getCommonAttributes", () => {
        const expectedReturnUris = ["uri/1", "uri/3"];

        beforeEach(() => {
            fetchMock.post(`/gdc/md/${projectId}/ldm/attributeupperbound`, {
                status: 200,
                body: {
                    attributeUpperBoundsResponse: {
                        upperbounds: expectedReturnUris,
                    },
                },
            });
        });

        afterEach(() => {
            fetchMock.restore();
        });

        it("should call the ldm/upperbound endpoint", () => {
            return createLdmModule()
                .getCommonAttributes(projectId, ["uri/1", "uri/2"])
                .then(() => {
                    expect(getRequestBody()).toEqual({
                        attributeUpperBounds: {
                            attributes: ["uri/1", "uri/2"],
                        },
                    });
                });
        });

        it("should return array of returned uris", () => {
            return createLdmModule()
                .getCommonAttributes(projectId, ["uri/1", "uri/2"])
                .then(result => {
                    expect(result).toEqual(expectedReturnUris);
                });
        });
    });

    describe("getCommonAttributes error states", () => {
        it("should return undefined for malformed response", () => {
            fetchMock.post(`/gdc/md/${projectId}/ldm/attributeupperbound`, {
                status: 200,
                body: null,
            });

            return createLdmModule()
                .getCommonAttributes(projectId, ["uri/1", "uri/2"])
                .then(result => {
                    expect(result).toBeUndefined();
                    fetchMock.restore();
                });
        });

        it("should throw error on bad request response status", () => {
            fetchMock.post(`/gdc/md/${projectId}/ldm/attributeupperbound`, {
                status: BAD_REQUEST_STATUS,
                body: null,
            });

            return createLdmModule()
                .getCommonAttributes(projectId, ["uri/1", "uri/2"])
                .catch(error => {
                    expect(error.response.status).toEqual(400);
                    expect(error.message).toEqual("Bad Request");
                });
        });
    });
});
