"use strict";

(function () {
    "use strict";
    angular.module("tc-grid", []).directive("tcGrid", tcGrid).directive("tcColumn", tcGridColumn);

    function tcGrid($parse, $compile, $templateCache, $timeout) {
        return {
            restrict: "E",
            scope: true,
            compile: function (element, attrs) {
                var children = element.children();
                var headerHtml = "";

                attrs.columns = {};
                attrs.colTemplates = [];
                attrs.headerTemplates = [];

                angular.forEach(children, function (child, index) {
                    var el = angular.element(child);
                    var colField = el.attr("tc-field");
                    var colName = el.attr("tc-name") || colField || "";
                    var sort = el.attr("tc-sort");
                    var ignoreClick = el.attr("tc-ignore-click");
                    var colClass = el.attr("tc-class");

                    var sortFn = "";
                    var headerId = "";
                    var hideFn = "";

                    if (colField) {
                        sortFn = " ng-click=\"tcGrid.sort('" + colField + "')\"";
                        headerId = " id=\"" + attrs.tcOptions + "_" + colField.replace(/\./g, "") + "\"";

                        if (el.html() === "") {
                            el.html("{{row." + colField + "}}");
                        }
                    }

                    attrs.columns[index] = {
                        field: colField,
                        visible: el.attr("tc-visible")
                    };

                    if (ignoreClick) el.attr("ng-click", "$event.stopPropagation();");

                    el.addClass(colClass || "tc-style_td");
                    el.attr("tc-col-index", index + 1);

                    if (el.attr("tc-visible")) {
                        el.attr("ng-class", "{'tc-hide-col': !tcGrid.columns['" + index + "'].visible}");
                        hideFn = "ng-class=\"{'tc-hide-col': !tcGrid.columns['" + index + "'].visible}\"";
                    }

                    var header = "<div class=\"tc-display_th tc-style_th tc-display_sort tc-style_sort\" tc-col-index=\"" + (index + 1) + "\"" + headerId + sortFn + hideFn + ">" + colName + "</div>";
                    headerHtml += header;

                    if (colName) {
                        var mobileHeader = "<div class=\"tc-mobile-header\">" + colName + "</div>";
                        el.prepend(mobileHeader);
                    }
                    attrs.headerTemplates.push(angular.element(header));
                    attrs.colTemplates.push(el);
                });

                var templateHtml = $templateCache.get("tcGrid.html");
                templateHtml = templateHtml.replace(/%OPTIONS%/g, attrs.tcOptions);
                templateHtml = templateHtml.replace(/%HEADER%/g, headerHtml);
                templateHtml = templateHtml.replace(/%GRIDCLASS%/g, attrs.tcGridClass || "tc-grid");
                templateHtml = templateHtml.replace(/%ROWCLICK%/g, attrs.tcRowClick ? "ng-click=\"" + attrs.tcRowClick + "\"" : "");
                templateHtml = templateHtml.replace(/%FILTER%/g, attrs.tcGridFilter ? " | filter: " + attrs.tcGridFilter : "");
                templateHtml = templateHtml.replace(/%ROWCLASS%/g, attrs.tcRowClass ? "" : "tc-style_tr");
                templateHtml = templateHtml.replace(/%ROWEXPRESSION%/g, attrs.tcRowClass || "");
                templateHtml = templateHtml.replace(/%CHILDREN%/g, children.parent().html());

                var template = angular.element(templateHtml);
                var divs = template.find("div");
                var row;
                for (var item in divs) {
                    if (divs[item].id == "tc-row-container") {
                        row = divs[item];
                        break;
                    }
                }

                attrs.rowTemplate = row;

                element.html("");
                element.append(template);

                return {
                    pre: function () {},
                    post: function () {}
                };
            },
            controller: ["$scope", "$element", "$attrs", function controller($scope, $element, $attrs) {
                var watchInitialized = false;
                var vm = this;
                vm.pageCount = 1;
                vm.showFooter = false;
                vm.columns = [];
                vm.columnTemplates = $attrs.colTemplates;
                vm.headerTemplates = $attrs.headerTemplates;
                vm.rowTemplate = $attrs.rowTemplate;

                vm.addColumn = addColumn;
                vm.prev = prev;
                vm.next = next;
                vm.first = first;
                vm.last = last;
                vm.sort = sort;
                vm.updatePageSize = updatePageSize;
                vm.orderColumns = orderColumns;

                init();

                function init() {
                    vm.options = $parse($attrs.tcOptions)($scope.$parent);
                    vm.data = $parse($attrs.tcData)($scope.$parent);

                    initColumns();
                    initOptions();
                    initWatch();

                    if (vm.options) {
                        if (vm.options.sorting.onSortChange) sortChanged();else if (vm.options.paging.onPageChange) pageChanged();
                    }
                }

                function reset() {
                    vm.options.paging.currentPage = 1;
                    vm.options.sorting.sort = [];
                    cleanSortClasses();
                    pageChanged();
                    sortChanged();
                }

                function initColumns() {
                    for (var idx in $attrs.columns) {
                        if ($attrs.columns[idx].visible) {
                            watchColumn(idx, $attrs.columns[idx].visible);
                            vm.columns[idx] = {
                                field: $attrs.columns[idx].field,
                                visible: $parse($attrs.columns[idx].visible)($scope.$parent)
                            };
                        } else {
                            vm.columns[idx] = {
                                field: $attrs.columns[idx].field,
                                visible: true
                            };
                        }
                    }
                }

                function orderColumns() {
                    var table = getTable();

                    var order = [1, 3, 2, 4, 5];
                    updateHead(order, table);
                    updateBody(order, table);
                }

                function updateBody(columnDisplay, table) {
                    var body = angular.element("<div class=\"tc-display_tbody tc-style_tbody\"></div>");
                    var row = angular.element(vm.rowTemplate);

                    $timeout(function () {
                        table.tbody.remove();
                        row.html("");
                        for (var i in columnDisplay) {
                            var col = vm.columnTemplates[columnDisplay[i] - 1];
                            col.removeAttr("ng-transclude");
                            row.append(col.clone());
                        }
                        body.append(row);
                        $compile(body)($scope);
                        table = angular.element(table);
                        table.append(body);
                    });
                }

                function updateHead(columnDisplay, table) {
                    var head = angular.element(table.thead);
                    var row = angular.element(head.find("div")[0]);
                    $timeout(function () {
                        row.html("");
                        for (var i in columnDisplay) {
                            var col = vm.headerTemplates[columnDisplay[i] - 1];
                            row.append(col);
                        }
                        $compile(head)($scope);
                    });
                }

                function getColumnByIndex(row, index) {
                    for (var col in row.cols) {
                        var colIndex = row.cols[col].getAttribute("tc-col-index");
                        if (colIndex == index) {
                            return row.cols[col];
                        }
                    }
                }

                function getTable() {
                    var table = document.getElementsByClassName("tc-display_table")[0];
                    var thead, tbody, node;

                    for (var i in table.children) {
                        node = table.children[i];
                        if (node.className && node.className.indexOf("tc-display_thead") > -1) {
                            thead = node;
                        } else if (node.className && node.className.indexOf("tc-display_tbody") > -1) {
                            tbody = node;
                        }
                    }

                    table.tbody = tbody;
                    table.thead = thead;

                    return table;
                }

                function watchColumn(colIndex, visibleVar) {
                    $scope.$parent.$watch(visibleVar, function (newVal, oldVal) {
                        if (newVal != oldVal) {
                            vm.columns[colIndex].visible = newVal;
                        }
                    });
                }

                function initOptions() {
                    if (!vm.options) {
                        return;
                    }vm.options.reset = reset;

                    if (vm.options.paging) initPaging();else vm.options.paging = {};

                    if (vm.options.sorting) initSort();else vm.options.sorting = {};
                }

                function initWatch() {
                    $scope.$parent.$watch($attrs.tcOptions, function (newVal) {
                        vm.options = newVal;
                        pageCountWatcher();
                    }, true);

                    $scope.$parent.$watchCollection($attrs.tcData, function (newVal) {
                        vm.data = newVal;
                    });

                    function pageCountWatcher() {
                        if (!watchInitialized) {
                            watchInitialized = true;
                            return;
                        }

                        if (vm.options && vm.options.paging) getPageCount();
                    }
                }

                function initPaging() {
                    if (!vm.options.paging.pageSize || vm.options.paging.pageSize < 1) {
                        if (vm.options.paging.pageSizeOptions) {
                            vm.options.paging.pageSize = vm.options.paging.pageSizeOptions[0];
                        } else {
                            vm.options.paging.pageSize = 20;
                        }
                    }
                    if (!vm.options.paging.totalItemCount || vm.options.paging.totalItemCount < 0) vm.options.paging.totalItemCount = 0;

                    if (!vm.options.paging.currentPage || vm.options.paging.currentPage < 1) vm.options.paging.currentPage = 1;

                    getPageCount();

                    if (!$attrs.tcHideFooter) {
                        vm.showFooter = true;
                    }
                }

                function initSort() {
                    if (!vm.options.sorting.sort) {
                        return;
                    }angular.forEach(vm.options.sorting.sort, function (sortItem) {
                        var col = sortItem.split(" ")[0];
                        var dir = sortItem.split(" ")[1] || "asc";

                        var column = fetchColumn(col);
                        column.addClass(dir.toLowerCase());
                    });
                }

                function getPageCount() {
                    vm.pageCount = vm.options.paging.totalItemCount > 0 ? Math.ceil(vm.options.paging.totalItemCount / vm.options.paging.pageSize) : 0;

                    if (vm.pageCount < 1) {
                        vm.pageCount = 1;
                    }
                }

                function first() {
                    vm.options.paging.currentPage = 1;
                    pageChanged();
                }

                function prev() {
                    vm.options.paging.currentPage -= 1;
                    if (vm.options.paging.currentPage < 1) {
                        vm.options.paging.currentPage = 1;
                    }
                    pageChanged();
                }

                function next() {
                    vm.options.paging.currentPage += 1;
                    if (vm.options.paging.currentPage > vm.pageCount) {
                        vm.options.paging.currentPage = vm.pageCount;
                    }
                    pageChanged();
                }

                function last() {
                    vm.options.paging.currentPage = vm.pageCount;
                    pageChanged();
                }

                function pageChanged() {
                    if (vm.options.paging.onPageChange) {
                        vm.options.paging.onPageChange(vm.options.paging.currentPage, vm.options.paging.pageSize, vm.options.sorting.sort);
                    }
                }

                function sortChanged() {
                    orderColumns();
                    if (vm.options.sorting.onSortChange) {
                        if (vm.options.paging) {
                            vm.options.paging.currentPage = 1;
                            vm.options.sorting.onSortChange(vm.options.paging.currentPage, vm.options.paging.pageSize, vm.options.sorting.sort);
                        } else {
                            vm.options.sorting.onSortChange(null, null, vm.options.sorting.sort);
                        }
                    }
                }

                function sort(field) {
                    if (Object.getOwnPropertyNames(vm.columns).length === 0) {
                        return;
                    }var col = fetchColumn(field);

                    var direction = "asc";

                    if (col.hasClass("asc")) direction = "desc";

                    cleanSortClasses();

                    col.addClass(direction);

                    vm.options.sorting.sort = [field + " " + direction];

                    sortChanged();
                }

                function cleanSortClasses() {
                    angular.forEach(Object.keys(vm.columns), function (col) {
                        if (vm.columns[col].field) {
                            var colElement = fetchColumn(vm.columns[col].field);
                            colElement.removeClass("desc");
                            colElement.removeClass("asc");
                        }
                    });
                }

                function fetchColumn(name) {
                    if (!name) {
                        return;
                    }var id = $attrs.tcOptions + "_" + name.replace(/\./g, "");
                    return angular.element(document.getElementById(id));
                }

                function addColumn(name) {
                    if (vm.columns.indexOf(name) == -1) vm.columns.push(name);
                }

                function updatePageSize() {
                    pageChanged();
                }

                function test() {
                    console.log("test");
                }
                this.test = test;
            }],
            controllerAs: "tcGrid"
        };
    }
    tcGrid.$inject = ["$parse", "$compile", "$templateCache", "$timeout"];

    function tcGridColumn() {
        return {
            restrict: "E",
            require: "^tcGrid",
            replace: true,
            transclude: true,
            template: "<div class='tc-display_td' ng-transclude></div>",
            scope: true
        };
    }
})();
angular.module("tc-grid").run(["$templateCache", function($templateCache) {$templateCache.put("tcGrid.html","<div class=\"tcGrid__scope\">\r\n    <div class=\"%GRIDCLASS%\">\r\n        <div class=\"tc-display_table tc-style_table\">\r\n            <div class=\"tc-display_thead tc-style_thead\">\r\n                <div class=\"tc-display_tr tc-style_tr\">\r\n                    %HEADER%\r\n                </div>\r\n            </div>\r\n            <div class=\"tc-display_tbody tc-style_tbody\">\r\n                <div class=\"tc-display_tr %ROWCLASS%\" ng-class=\"%ROWEXPRESSION%\" id=\"tc-row-container\" ng-repeat=\"row in tcGrid.data %FILTER%\" %ROWCLICK%>\r\n                    %CHILDREN%\r\n                </div>\r\n            </div>\r\n\r\n        </div>\r\n\r\n        <div class=\"tc-display_pager\" ng-show=\"tcGrid.showFooter && tcGrid.pageCount > 1\">\r\n            <div class=\"tc-display_item-total\">\r\n                {{(tcGrid.options.paging.currentPage - 1) * tcGrid.options.paging.pageSize + 1}}\r\n                -\r\n                {{tcGrid.options.paging.currentPage === tcGrid.pageCount ? tcGrid.options.paging.totalItemCount : tcGrid.options.paging.currentPage * tcGrid.options.paging.pageSize}}\r\n                of\r\n                {{tcGrid.options.paging.totalItemCount}}\r\n            </div>\r\n            <div class=\"tc-display_page-nav\">\r\n                <span class=\"tc-style_page-display\">{{tcGrid.options.paging.currentPage}} / {{tcGrid.pageCount}}</span>\r\n                <select ng-if=\"tcGrid.options.paging.pageSizeOptions.length\" ng-options=\"pageSize for pageSize in tcGrid.options.paging.pageSizeOptions\" ng-model=\"tcGrid.options.paging.pageSize\" ng-change=\"tcGrid.updatePageSize()\"></select>\r\n                <button class=\"tc-button\" ng-click=\"tcGrid.first()\" ng-disabled=\"tcGrid.options.paging.currentPage === 1\"><strong>|</strong>&#9668;</button>\r\n                <button class=\"tc-button\" ng-click=\"tcGrid.prev()\" ng-disabled=\"tcGrid.options.paging.currentPage === 1\">&#9668;</button>\r\n                <button class=\"tc-button\" ng-click=\"tcGrid.next()\" ng-disabled=\"tcGrid.options.paging.currentPage === tcGrid.pageCount\">&#9658;</button>\r\n                <button class=\"tc-button\" ng-click=\"tcGrid.last()\" ng-disabled=\"tcGrid.options.paging.currentPage === tcGrid.pageCount\">&#9658;<strong>|</strong></button>\r\n            </div>\r\n            <div class=\"clearfix\"></div>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n\r\n");}]);