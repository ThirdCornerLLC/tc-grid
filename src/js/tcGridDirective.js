(function () {
    'use strict';
    angular.module('tc-grid', [])
        .directive('tcGrid', tcGrid)
        .directive('tcColumn', tcGridColumn);

    function tcGrid($parse, $compile, $templateCache, $timeout) {
        return {
            restrict: 'E',
            scope: true,
            compile: (element, attrs) => {
                var children = element.find('tc-column');
                var headerHtml = "";

                attrs.columns = {};
                attrs.colTemplates = [];
                attrs.headerTemplates = [];

                angular.forEach(children, (child, index) => {
                    var el = angular.element(child);
                    var colField = el.attr('tc-field');
                    var colName = el.attr('tc-name') || colField || '';
                    var sort = el.attr('tc-sort');
                    var ignoreClick = el.attr('tc-ignore-click');
                    var colClass = el.attr('tc-class');

                    var sortFn = '';
                    var headerId = '';
                    var hideFn = '';

                    if (colField) {
                        sortFn = ' ng-click="tcGrid.sort(\'' + (colField) + '\')"';
                        headerId = ' id="' + attrs.tcOptions + "_" + colField.replace(/\./g, "") + '"';

                        if(el.html() === '') {
                            el.html('{{row.' + colField + '}}');
                        }
                    }

                    attrs.columns[index] = {
                        field: colField,
                        visible: el.attr('tc-visible')
                    };

                    if (ignoreClick)
                        el.attr('ng-click', '$event.stopPropagation();');


                    el.addClass(colClass || 'tc-style_td');
                    el.attr('tc-col-index', index + 1);


                    if(el.attr('tc-visible')) {
                        el.attr('ng-class', "{'tc-hide-col': !tcGrid.columns['"+ index +"'].visible}");
                        hideFn = "ng-class=\"{'tc-hide-col': !tcGrid.columns[\'"+ index +"\'].visible}\"";
                    }

                    var header = '<div class="tc-display_th tc-style_th" tc-col-index="'+ (index + 1) +'"' + headerId + sortFn + hideFn + '>' + colName + '<span class="tc-display_sort tc-style_sort"></span></div>';
                    headerHtml += header;

                    if(colName) {
                        var mobileHeader = '<div class="tc-mobile-header">' + colName + '</div>';
                        el.prepend(mobileHeader);
                    }
                    attrs.headerTemplates.push(angular.element(header));
                    attrs.colTemplates.push(el.clone());
                });

                var templateHtml = $templateCache.get('tcGrid.html');
                templateHtml = templateHtml.replace(/%OPTIONS%/g, attrs.tcOptions);
                templateHtml = templateHtml.replace(/%HEADER%/g, headerHtml);
                templateHtml = templateHtml.replace(/%GRIDCLASS%/g, attrs.tcGridClass || 'tc-grid');
                templateHtml = templateHtml.replace(/%ROWCLICK%/g, attrs.tcRowClick ? 'ng-click="' + attrs.tcRowClick + '"' : "");
                templateHtml = templateHtml.replace(/%FILTER%/g, attrs.tcGridFilter ? ' | filter: ' + attrs.tcGridFilter : "");
                templateHtml = templateHtml.replace(/%ROWCLASS%/g, attrs.tcRowClass ? '' : 'tc-style_tr');
                templateHtml = templateHtml.replace(/%ROWEXPRESSION%/g, attrs.tcRowClass || '');
                templateHtml = templateHtml.replace(/%CHILDREN%/g, children.parent().html());

                var template = angular.element(templateHtml);
                var divs = template.find('div');
                var row;
                for(var item in divs) {
                    if(divs[item].id == "tc-row-container") {
                        row = divs[item];
                        break;
                    }
                }

                attrs.rowTemplate = angular.element(row);
                attrs.rowTemplate.html("");

                element.html('');
                element.append(template);

                return {
                    pre: () => {},
                    post: () => {}
                };
            },
            controller: function($scope, $element, $attrs) {
                var watchInitialized = false;
                var headTimeout;
                var bodyTimeout;

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

                $scope.$on('$destroy', function() {
                    if(headTimeout)
                        $timeout.cancel(headTimeout);
                    if(bodyTimeout)
                        $timeout.cancel(bodyTimeout);
                });

                function init() {
                    vm.options = $parse($attrs.tcOptions)($scope.$parent);
                    vm.data = $parse($attrs.tcData)($scope.$parent);

                    initColumns();
                    initOptions();
                    initWatch();

                    if (vm.options) {
                        if (vm.options.onLoad && typeof vm.options.onLoad === 'function')
                            vm.options.onLoad();
                        else if (vm.options.sorting.onSortChange)
                            sortChanged();
                        else if (vm.options.paging.onPageChange)
                            pageChanged();
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
                    for(var idx in $attrs.columns) {
                        if($attrs.columns[idx].visible) {
                            watchColumn(idx, $attrs.columns[idx].visible);
                            vm.columns[idx] = {
                                field: $attrs.columns[idx].field,
                                visible: $parse($attrs.columns[idx].visible)($scope.$parent)
                            }
                        } else {
                            vm.columns[idx] = {
                                field: $attrs.columns[idx].field,
                                visible: true
                            }
                        }
                    }
                }

                function orderColumns(columnOrder) {
                    var table = getTable();
                    updateHead(table, columnOrder);
                    updateBody(table, columnOrder);
                }

                function updateBody(table, columnOrder) {
                    var body = angular.element('<div class="tc-display_tbody tc-style_tbody"></div>');
                    var row = angular.element(vm.rowTemplate);

                    bodyTimeout = $timeout(function() {
                        row.html('');
                        table.tbody.parentNode.removeChild(table.tbody);
                        for(var i in columnOrder) {
                            var col = getTemplate(vm.columnTemplates, columnOrder[i]);
                            col.removeAttr("ng-transclude");
                            row.append(col.clone());
                        }
                        body.append(row);
                        $compile(body)($scope);
                        table = angular.element(table);
                        table.append(body);
                        $scope.$apply();
                    });
                }

                function updateHead(table, columnOrder) {
                    var head = angular.element(table.thead);
                    var row = angular.element(head.find('div')[0]);
                    headTimeout = $timeout(function() {
                        row.html('');
                        for(var i in columnOrder) {
                            var col = getTemplate(vm.headerTemplates, columnOrder[i]);
                            row.append(col.clone());
                        }
                        $compile(head)($scope);
                        initSort();
                    });
                }

                function getTemplate(templates, identifier) {
                    for(var i in templates) {
                        var colIndex = templates[i].attr("tc-col-index");
                        var colName = templates[i].attr('tc-name');
                        var colField = templates[i].attr('tc-field');
                        if(colIndex == identifier || colName == identifier || colField == identifier) {
                            return templates[i];
                        }
                    }
                }

                function getTable() {
                    var table = document.getElementsByClassName('tc-display_table')[0];
                    var thead, tbody, node;

                    for(var i in table.children) {
                        node = table.children[i];
                        if(node.className && node.className.indexOf("tc-display_thead") > -1) {
                            thead = node;
                        } else if(node.className && node.className.indexOf('tc-display_tbody') > -1) {
                            tbody = node;
                            tbody.parent = node.parentNode;
                        }
                    }

                    table.tbody = tbody;
                    table.thead = thead;

                    return table;
                }

                function watchColumn(colIndex, visibleVar) {
                    $scope.$parent.$watch(visibleVar, function(newVal, oldVal) {
                        if(newVal != oldVal) {
                            vm.columns[colIndex].visible = newVal;
                        }
                    });
                }


                function initOptions() {
                    if (!vm.options) return;

                    vm.options.reset = reset;
                    vm.options.prev = prev;
                    vm.options.next = next;
                    vm.options.first = first;
                    vm.options.last = last;
                    vm.options.sort = sort;

                    if (vm.options.paging)
                        initPaging();
                    else
                        vm.options.paging = {};

                    if (vm.options.sorting)
                        initSort();
                    else
                        vm.options.sorting = {};
                }

                function initWatch() {
                    if($attrs.tcOptions) {
                        $scope.$parent.$watch($attrs.tcOptions, function(newVal, oldVal) {
                            vm.options = newVal;

                            if(newVal == oldVal && newVal.columnDisplay) {
                                orderColumns(vm.options.columnDisplay);
                            } else if(newVal == oldVal && !newVal.columnDisplay) {
                                var colDisplay = [];
                                for(var i = 0; i < vm.columns.length; i++) {
                                    colDisplay.push(i+1);
                                }
                                orderColumns(colDisplay);
                            } else if(newVal.columnDisplay != oldVal.columnDisplay) {
                                orderColumns(vm.options.columnDisplay);
                            }

                            pageCountWatcher();
                        }, true);
                    }

                    $scope.$parent.$watchCollection($attrs.tcData, function(newVal) {
                        vm.data = newVal;
                    });

                    function pageCountWatcher() {
                        if(!watchInitialized) {
                            watchInitialized = true;
                            return;
                        }

                        if (vm.options && vm.options.paging)
                            getPageCount();
                    }
                }

                function initPaging() {
                    if (!vm.options.paging.pageSize || vm.options.paging.pageSize < 1)
                    {
                        if(vm.options.paging.pageSizeOptions) {
                            vm.options.paging.pageSize = vm.options.paging.pageSizeOptions[0];
                        } else {
                            vm.options.paging.pageSize = 20;
                        }
                    }
                    if (!vm.options.paging.totalItemCount || vm.options.paging.totalItemCount < 0)
                        vm.options.paging.totalItemCount = 0;

                    if (!vm.options.paging.currentPage || vm.options.paging.currentPage < 1)
                        vm.options.paging.currentPage = 1;

                    getPageCount();

                    if(!$attrs.tcHideFooter) {
                        vm.showFooter = true;
                    }
                }

                function initSort() {
                    if(!vm.options.sorting.sort) return;

                    angular.forEach(vm.options.sorting.sort, (sortItem) => {
                        var col = sortItem.split(' ')[0];
                        var dir = sortItem.split(' ')[1] || 'asc';

                        var column = fetchColumn(col);
                        if(column) {
                            column.addClass(dir.toLowerCase());
                        }
                    });
                }


                function getPageCount() {
                    vm.pageCount = (vm.options.paging.totalItemCount > 0)
                        ? Math.ceil(vm.options.paging.totalItemCount / vm.options.paging.pageSize)
                        : 0;

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
                    if (Object.getOwnPropertyNames(vm.columns).length === 0)
                        return;

                    var col = fetchColumn(field);

                    if(col) {
                        var direction = 'asc';

                        if (col.hasClass('asc'))
                            direction = 'desc';

                        cleanSortClasses();

                        col.addClass(direction);

                        vm.options.sorting.sort = [field + ' ' + direction];

                        sortChanged();
                    }
                }

                function cleanSortClasses() {
                    angular.forEach(Object.keys(vm.columns), col => {
                        if(vm.columns[col].field) {
                            var colElement = fetchColumn(vm.columns[col].field);
                            if(colElement) {
                                colElement.removeClass('desc');
                                colElement.removeClass('asc');
                            }
                        }
                    });
                }

                function fetchColumn(name) {
                    if(!name) return;
                    var id = $attrs.tcOptions + '_' + name.replace(/\./g, '');
                    var col = document.getElementById(id);

                    if(col) {
                        var children = col.childNodes;

                        for(var s in children) {
                            if(children[s].className && children[s].className.indexOf("tc-display_sort") > -1) {
                                return angular.element(children[s]);
                            }
                        }
                    }

                    return null;
                }

                function addColumn(name) {
                    if(vm.columns.indexOf(name) == -1)
                        vm.columns.push(name);
                }

                function updatePageSize() {
                    getPageCount();
                    if (vm.options.paging.currentPage > vm.pageCount) {
                        vm.options.paging.currentPage = vm.pageCount;
                    } else if(vm.options.paging.currentPage < 0) {
                        vm.options.paging.currentPage = 0;
                    }

                    pageChanged();
                }
            },
            controllerAs: 'tcGrid'
        };


    }

    function tcGridColumn() {
        return {
            restrict: 'E',
            require: '^tcGrid',
            replace: true,
            transclude: true,
            template: "<div class='tc-display_td' ng-transclude></div>"
        };
    }

}());
