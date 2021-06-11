YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "DataLayer",
        "config",
        "execution",
        "metadata",
        "project",
        "report",
        "sdk",
        "util",
        "xhr"
    ],
    "modules": [
        "DataLayer",
        "config",
        "execution",
        "metadata",
        "project",
        "report",
        "sdk",
        "util",
        "xhr"
    ],
    "allModules": [
        {
            "displayName": "config",
            "name": "config",
            "description": "Config module holds SDK configuration variables\n\nCurrently its only custom domain - which enabled using\nsdk from different domain (using CORS)\n\nNever set properties directly - always use setter methods"
        },
        {
            "displayName": "DataLayer",
            "name": "DataLayer",
            "description": "Data layer"
        },
        {
            "displayName": "execution",
            "name": "execution",
            "description": "Execution endpoints"
        },
        {
            "displayName": "metadata",
            "name": "metadata",
            "description": "Functions for working with metadata objects"
        },
        {
            "displayName": "project",
            "name": "project",
            "description": "Functions for working with projects"
        },
        {
            "displayName": "report",
            "name": "report",
            "description": "Functions for working with reports"
        },
        {
            "displayName": "sdk",
            "name": "sdk",
            "description": "# JS SDK\nHere is a set of functions that mostly are a thin wraper over the [GoodData API](https://developer.gooddata.com/api).\nBefore calling any of those functions, you need to authenticate with a valid GoodData\nuser credentials. After that, every subsequent call in the current session is authenticated.\nYou can find more about the GD authentication mechanism here.\n\n## GD Authentication Mechansim\nIn this JS SDK library we provide you with a simple `login(username, passwd)` function\nthat does the magic for you.\nTo fully understand the authentication mechansim, please read\n[Authentication via API article](http://developer.gooddata.com/article/authentication-via-api)\non [GoodData Developer Portal](http://developer.gooddata.com/)"
        },
        {
            "displayName": "util",
            "name": "util",
            "description": "Utility methods. Mostly private"
        },
        {
            "displayName": "xhr",
            "name": "xhr",
            "description": "Ajax wrapper around GDC authentication mechanisms, SST and TT token handling and polling.\nInterface is the same as original jQuery.ajax.\n\nIf token is expired, current request is \"paused\", token is refreshed and request is retried and result\nis transparently returned to the original call.\n\nAdditionally polling is handled. Only final result of polling returned."
        }
    ],
    "elements": []
} };
});