"use strict";

(function () {
    "use strict";
    angular.module("tc-grid", []).directive("tcGrid", tcGrid).directive("tcColumn", tcGridColumn);

    function tcGrid($parse, $compile, $templateCache, $timeout) {
        return {
            restrict: "E",
            scope: true,
            compile: function compile(element, attrs) {
                var children = element.find("tc-column");

                attrs.defaultHeaders = [];

                angular.forEach(children, function (child, index) {
                    var childClass = child.getAttribute("tc-class");

                    child.setAttribute("data-identifier", Math.random());
                    child.setAttribute("tc-col-index", index + 1);
                    child.className += " " + (childClass || "tc-style_td");

                    attrs.defaultHeaders.push({
                        element: element,
                        options: {
                            tcName: child.getAttribute("tc-name"),
                            tcField: child.getAttribute("tc-field"),
                            identifier: child.getAttribute("data-identifier")
                        }
                    });
                });

                var templateHtml = $templateCache.get("tcGrid.html");
                templateHtml = templateHtml.replace(/%GRIDCLASS%/g, attrs.tcGridClass || "tc-grid");
                templateHtml = templateHtml.replace(/%ROWCLASS%/g, attrs.tcRowClass ? "" : "tc-style_tr");
                templateHtml = templateHtml.replace(/%ROWEXPRESSION%/g, attrs.tcRowClass || "");
                templateHtml = templateHtml.replace(/%ROWCLICK%/g, attrs.tcRowClick ? "ng-click=\"" + attrs.tcRowClick + "\"" : "");
                templateHtml = templateHtml.replace(/%ROWLINK%/g, attrs.tcRowLink ? " ng-href=\"" + attrs.tcRowLink + "\"" : "");
                templateHtml = templateHtml.replace(/%FILTER%/g, attrs.tcGridFilter ? " | filter: " + attrs.tcGridFilter : "");

                var template = angular.element(templateHtml);
                var row = template[0].querySelector(".tc-display_tbody .tc-display_tr");
                attrs.rowTemplate = angular.element(row);
                attrs.rowTemplate.append(children);
                row = null;

                element.html("");
                element.append(template);

                template = null;

                return {
                    pre: function () {},
                    post: function () {}
                };
            },
            controller: ["$scope", "$element", "$attrs", function tcGridController($scope, $element, $attrs) {
                var watchInitialized = false;
                var headTimeout;
                var bodyTimeout;

                var vm = this;
                vm.pageCount = 1;
                vm.showFooter = false;
                vm.columns = [];
                vm.columnTemplates = [];
                vm.headerTemplates = [];
                vm.rowTemplate = $attrs.rowTemplate;

                $attrs.rowTemplate = null;

                vm.addColumn = addColumn;
                vm.prev = prev;
                vm.next = next;
                vm.first = first;
                vm.last = last;
                vm.sort = sort;
                vm.updatePageSize = updatePageSize;
                vm.orderColumns = orderColumns;
                vm.registerColumn = registerColumn;

                init();

                $scope.$on("$destroy", function () {
                    if (headTimeout) $timeout.cancel(headTimeout);
                    if (bodyTimeout) $timeout.cancel(bodyTimeout);
                });

                function init() {
                    vm.options = $parse($attrs.tcOptions)($scope.$parent);
                    vm.data = $parse($attrs.tcData)($scope.$parent);

                    initColumns();
                    initOptions();
                    initWatch();

                    if (vm.options) {
                        if (vm.options.onLoad && typeof vm.options.onLoad === "function") vm.options.onLoad();else if (vm.options.sorting.onSortChange) sortChanged();else if (vm.options.paging.onPageChange) pageChanged();
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
                    var header;
                    while ((header = $attrs.defaultHeaders.shift()) != null) {
                        registerColumn(header.element, header.options);
                        header.element = null;
                    }
                }

                function registerColumn(element, options) {
                    if (hasColumn(options)) {
                        return;
                    }var sortFn;
                    var headerId;
                    var hideFn;

                    options.tcField = options.tcField || "";
                    options.tcName = options.tcName || options.tcField;

                    var index = vm.headerTemplates.length;
                    if (options.tcField) {
                        sortFn = " ng-click=\"tcGrid.sort('" + options.tcField + "')\"";
                        headerId = " id=\"" + $attrs.tcOptions + "_" + options.tcField.replace(/\./g, "") + "\"";
                    } else {
                        sortFn = "";
                        headerId = "";
                    }

                    hideFn = " ng-class=\"{'tc-hide-col': !tcGrid.columns['" + index + "'].visible}\"";

                    var header = "<div class=\"tc-display_th tc-style_th\" tc-col-index=\"" + (index + 1) + "\"" + headerId + sortFn + hideFn + ">" + options.tcName + "<span class=\"tc-display_sort tc-style_sort\"></span></div>";
                    var headerEl = angular.element(header);
                    vm.headerTemplates.push(headerEl);
                    vm.columnTemplates.push(element.clone());

                    element = null;
                    headerEl = null;

                    addColumn(options);
                    orderColumns();
                }

                function hasColumn(options) {
                    for (var i = 0; i < vm.columns.length; i++) {
                        if (vm.columns[i].identifier === options.identifier) {
                            return true;
                        }
                    }

                    return false;
                }

                function orderColumns(columnOrder) {
                    if (!columnOrder) {
                        var columnOrder = [];
                        for (var i = 0; i < vm.columns.length; i++) {
                            columnOrder.push(i + 1);
                        }
                    }

                    if (vm.columns.length) {
                        var table = getTable();
                        updateHead(table, columnOrder);
                        //updateBody(table, columnOrder);
                        table = null;
                    }
                }

                //TODO: fix body
                function updateBody(table, columnOrder) {
                    var body = angular.element("<div class=\"tc-display_tbody tc-style_tbody\"></div>");
                    var row = angular.element(vm.rowTemplate);

                    if (table.tbody && table.tbody.parentNode) {
                        table.tbody.parentNode.removeChild(table.tbody);
                    }

                    row.html("");

                    for (var i in columnOrder) {
                        var col = getTemplate(vm.columnTemplates, columnOrder[i]);
                        col.removeAttr("ng-transclude");
                        row.append(col.clone());
                        col = null;
                    }

                    body.append(row);
                    $compile(body)($scope);
                    table = angular.element(table);
                    table.append(body);

                    body = null;
                    row = null;
                    table = null;
                }

                function updateHead(table, columnOrder) {
                    var head = angular.element(table.thead);
                    var row = angular.element(head.find("div")[0]);
                    row.html("");
                    for (var i in columnOrder) {
                        var col = getTemplate(vm.headerTemplates, columnOrder[i]);
                        row.append(col.clone());
                        col = null;
                    }

                    $compile(head)($scope);
                    row = null;
                    head = null;

                    initSort();
                }

                function getTemplate(templates, identifier) {
                    for (var i in templates) {
                        var colIndex = templates[i].attr("tc-col-index");
                        var colName = templates[i].attr("tc-name");
                        var colField = templates[i].attr("tc-field");
                        if (colIndex == identifier || colName == identifier || colField == identifier) {
                            return templates[i];
                        }
                    }

                    console.log(templates, identifier);
                }

                function getTable() {
                    //TODO: refactor to not be shitty
                    var table = $element.children().children().children()[0];
                    var tableChildren = Array.prototype.slice.call(table.children);
                    var thead, tbody, node;

                    for (var i in tableChildren) {
                        node = tableChildren[i];
                        if (node.className && node.className.indexOf("tc-display_thead") > -1) {
                            thead = node;
                        } else if (node.className && node.className.indexOf("tc-display_tbody") > -1) {
                            tbody = node;
                            tbody.parent = node.parentNode;
                        }
                    }

                    table.tbody = tbody;
                    table.thead = thead;

                    tbody = null;
                    thead = null;
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
                    vm.options.prev = prev;
                    vm.options.next = next;
                    vm.options.first = first;
                    vm.options.last = last;
                    vm.options.sort = sort;

                    if (vm.options.paging) initPaging();else vm.options.paging = {};

                    if (vm.options.sorting) initSort();else vm.options.sorting = {};
                }

                function initWatch() {
                    if ($attrs.tcOptions) {
                        $scope.$parent.$watch($attrs.tcOptions, function (newVal, oldVal) {
                            vm.options = newVal;

                            if (newVal == oldVal && newVal.columnDisplay) {
                                orderColumns(vm.options.columnDisplay);
                            } else if (newVal == oldVal && !newVal.columnDisplay) {
                                var colDisplay = [];
                                for (var i = 0; i < vm.columns.length; i++) {
                                    colDisplay.push(i + 1);
                                }
                                orderColumns(colDisplay);
                            } else if (newVal.columnDisplay != oldVal.columnDisplay) {
                                orderColumns(vm.options.columnDisplay);
                            }

                            pageCountWatcher();
                        }, true);
                    }

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
                    if (!vm.options || !vm.options.sorting.sort) {
                        return;
                    }angular.forEach(vm.options.sorting.sort, function (sortItem) {
                        var col = sortItem.split(" ")[0];
                        var dir = sortItem.split(" ")[1] || "asc";

                        var column = fetchColumn(col);
                        if (column) {
                            column.addClass(dir.toLowerCase());
                            column = null;
                        }
                    });
                }

                function getPageCount() {
                    vm.pageCount = vm.options.paging.totalItemCount > 0 ? Math.ceil(vm.options.paging.totalItemCount / vm.options.paging.pageSize) : 0;

                    if (vm.pageCount < 1) {
                        vm.pageCount = 1;
                    }

                    vm.options.paging.pageCount = vm.pageCount;
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

                    if (col) {
                        var direction = "asc";

                        if (col.hasClass("asc")) direction = "desc";

                        cleanSortClasses();

                        col.addClass(direction);

                        vm.options.sorting.sort = [field + " " + direction];

                        sortChanged();

                        col = null;
                    }
                }

                function cleanSortClasses() {
                    angular.forEach(Object.keys(vm.columns), function (col) {
                        if (vm.columns[col].field) {
                            var colElement = fetchColumn(vm.columns[col].field);
                            if (colElement) {
                                colElement.removeClass("desc");
                                colElement.removeClass("asc");
                                colElement = null;
                            }
                        }
                    });
                }

                function fetchColumn(name) {
                    if (!name) {
                        return;
                    }var id = $attrs.tcOptions + "_" + name.replace(/\./g, "");
                    var col = document.getElementById(id);

                    if (col) {
                        var children = col.childNodes;

                        for (var s in children) {
                            if (children[s].className && children[s].className.indexOf("tc-display_sort") > -1) {
                                return angular.element(children[s]);
                            }
                        }
                    }

                    return null;
                }

                function addColumn(options) {
                    vm.columns.push({
                        field: options.tcField,
                        identifier: options.identifier,
                        visible: true
                    });
                }

                function updatePageSize() {
                    getPageCount();
                    if (vm.options.paging.currentPage > vm.pageCount) {
                        vm.options.paging.currentPage = vm.pageCount;
                    } else if (vm.options.paging.currentPage < 0) {
                        vm.options.paging.currentPage = 0;
                    }

                    pageChanged();
                }
            }],
            controllerAs: "tcGrid"
        };
    }
    tcGrid.$inject = ["$parse", "$compile", "$templateCache", "$timeout"];

    function tcGridColumn() {
        return {
            restrict: "E",
            require: "^?tcGrid",
            replace: true,
            transclude: true,
            template: "<div class='tc-display_td' ng-transclude></div>",
            compile: function compile(element, attrs) {
                return {
                    pre: function (scope, element, attrs, ctrl) {
                        if (ctrl) {
                            ctrl.registerColumn(element, attrs);
                        }
                    }
                };
            }
        };
    }
})();
angular.module("tc-grid").run(["$templateCache", function($templateCache) {$templateCache.put("tcGrid.html","<div class=\"tcGrid__scope\">\r\n    <div class=\"%GRIDCLASS%\">\r\n        <div class=\"tc-display_table tc-style_table\">\r\n            <div class=\"tc-display_thead tc-style_thead\">\r\n                <div class=\"tc-display_tr tc-style_tr\"></div>\r\n            </div>\r\n            <div class=\"tc-display_tbody tc-style_tbody\">\r\n                <a class=\"tc-display_tr %ROWCLASS%\" ng-class=\"%ROWEXPRESSION%\" id=\"tc-row-container\" ng-repeat=\"row in tcGrid.data %FILTER%\" %ROWCLICK% %ROWLINK%></a>\r\n            </div>\r\n\r\n        </div>\r\n\r\n        <div class=\"tc-display_pager tc-style_pager\" ng-show=\"tcGrid.showFooter && tcGrid.pageCount > 1\">\r\n            <div class=\"tc-display_item-total\">\r\n                {{(tcGrid.options.paging.currentPage - 1) * tcGrid.options.paging.pageSize + 1}}\r\n                -\r\n                {{tcGrid.options.paging.currentPage === tcGrid.pageCount ? tcGrid.options.paging.totalItemCount : tcGrid.options.paging.currentPage * tcGrid.options.paging.pageSize}}\r\n                of\r\n                {{tcGrid.options.paging.totalItemCount}}\r\n            </div>\r\n            <div class=\"tc-display_page-nav\">\r\n                <span class=\"tc-style_page-display\">{{tcGrid.options.paging.currentPage}} / {{tcGrid.pageCount}}</span>\r\n                <select class=\"tc-select\" ng-if=\"tcGrid.options.paging.pageSizeOptions.length\" ng-options=\"pageSize for pageSize in tcGrid.options.paging.pageSizeOptions\" ng-model=\"tcGrid.options.paging.pageSize\" ng-change=\"tcGrid.updatePageSize()\"></select>\r\n                <button class=\"tc-button\" ng-click=\"tcGrid.first()\" ng-disabled=\"tcGrid.options.paging.currentPage === 1\"><strong>|</strong>&#9668;</button>\r\n                <button class=\"tc-button\" ng-click=\"tcGrid.prev()\" ng-disabled=\"tcGrid.options.paging.currentPage === 1\">&#9668;</button>\r\n                <button class=\"tc-button\" ng-click=\"tcGrid.next()\" ng-disabled=\"tcGrid.options.paging.currentPage === tcGrid.pageCount\">&#9658;</button>\r\n                <button class=\"tc-button\" ng-click=\"tcGrid.last()\" ng-disabled=\"tcGrid.options.paging.currentPage === tcGrid.pageCount\">&#9658;<strong>|</strong></button>\r\n            </div>\r\n            <div class=\"clearfix\"></div>\r\n        </div>\r\n    </div>\r\n</div>\r\n\r\n\r\n");}]);