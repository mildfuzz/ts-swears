System.register("index", ["./tags", "./utils", "./ddl", "./wa"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function exportStar_1(m) {
        var exports = {};
        for (var n in m) {
            if (n !== "default") exports[n] = m[n];
        }
        exports_1(exports);
    }
    return {
        setters: [
            function (tags_1_1) {
                exportStar_1(tags_1_1);
            },
            function (utils_1_1) {
                exportStar_1(utils_1_1);
            },
            function (ddl_1_1) {
                exportStar_1(ddl_1_1);
            },
            function (wa_1_1) {
                exportStar_1(wa_1_1);
            }
        ],
        execute: function () {
        }
    };
});
