(function () {
    'use strict';
    angular.module('tc-grid', [])
        .directive('tcGrid', tcGrid)
        .directive('tcColumn', tcGridColumn);

    function tcGrid($parse, $compile, $templateCache) {
        return {
            restrict: 'E',
            scope: true,
            compile: (element, attrs, transclude) => {
                var children = element.children();
                var headerHtml = "";

                attrs.columns = {};

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
                        sortFn = ' ng-click="vm.sort(\'' + (colField) + '\')"';
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
                        el.attr('ng-class', "{'tc-hide-col': !vm.columns['"+ index +"'].visible}");
                        hideFn = "ng-class=\"{'tc-hide-col': !vm.columns[\'"+ index +"\'].visible}\"";
                    }

                    headerHtml += '<div class="tc-display_th tc-style_th tc-display_sort tc-style_sort"' + headerId + sortFn + hideFn + '>' + colName + '</div>';

                    if(colName) {
                        var mobileHeader = '<div class="tc-mobile-header">' + colName + '</div>';
                        el.prepend(mobileHeader);
                    }
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

                element.html('');
                element.append(template);

                return {
                    pre: (scope, ele, attrs, ctrl) => {},
                    post: (scope, element, attrs, ctrl) => {}
                };
            },
            controller: function($scope, $element, $attrs) {
                this.addColumn = addColumn;

                var watchInitialized = false;

                var vm = {
                    pageCount: 1,
                    showFooter: false,
                    prev: prev,
                    next: next,
                    first: first,
                    last: last,
                    sort: sort,
                    columns: [],
                    updatePageSize: updatePageSize
                };

                init();

                function init() {
                    $scope.vm = vm;
                    $scope.options = $parse($attrs.tcOptions)($scope.$parent);
                    $scope.options.reset = reset;
                    $scope.data = $parse($attrs.tcData)($scope.$parent);

                    initColumns();
                    initOptions();
                    initWatch();

                    if ($scope.options) {
                        if ($scope.options.sorting.onSortChange)
                            sortChanged();
                        else if ($scope.options.paging.onPageChange)
                            pageChanged();
                    }
                }

                function reset() {
                    $scope.options.paging.currentPage = 1;
                    $scope.options.sorting.sort = [];
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
                            vm.columns[col] = {
                                field: $attrs.columns[col].field,
                                visible: true
                            }
                        }
                    }
                }

                function watchColumn(colIndex, visibleVar) {
                    $scope.$parent.$watch(visibleVar, function(newVal, oldVal) {
                        if(newVal != oldVal) {
                            vm.columns[colIndex].visible = newVal;
                        }
                    });
                }


                function initOptions() {
                    if (!$scope.options) return;

                    if ($scope.options.paging)
                        initPaging();

                    if ($scope.options.sorting)
                        initSort();
                }

                function initWatch() {
                    $scope.$parent.$watch($attrs.tcOptions, function(newVal) {
                        $scope.options = newVal;
                        pageCountWatcher();
                    }, true);

                    $scope.$parent.$watchCollection($attrs.tcData, function(newVal) {
                        $scope.data = newVal;
                    });

                    function pageCountWatcher() {
                        if(!watchInitialized) {
                            watchInitialized = true;
                            return;
                        }

                        if ($scope.options && $scope.options.paging)
                            getPageCount();
                    }
                }

                function initPaging() {
                    if (!$scope.options.paging.pageSize || $scope.options.paging.pageSize < 1)
                    {
                        if(options.paging.pageSizeOptions) {
                            $scope.options.paging.pageSize = options.paging.pageSizeOptions[0];
                        } else {
                            $scope.options.paging.pageSize = 20;
                        }
                    }
                    if (!$scope.options.paging.totalItemCount || $scope.options.paging.totalItemCount < 0)
                        $scope.options.paging.totalItemCount = 0;

                    if (!$scope.options.paging.currentPage || $scope.options.paging.currentPage < 1)
                        $scope.options.paging.currentPage = 1;

                    getPageCount();

                    if(!$attrs.tcHideFooter) {
                        vm.showFooter = true;
                    }
                }

                function initSort() {
                    if(!$scope.options.sorting.sort) return;

                    angular.forEach($scope.options.sorting.sort, (sortItem) => {
                        var col = sortItem.split(' ')[0];
                        var dir = sortItem.split(' ')[1] || 'asc';

                        var column = fetchColumn(col);
                        column.addClass(dir.toLowerCase());
                    });
                }


                function getPageCount() {
                    vm.pageCount = ($scope.options.paging.totalItemCount > 0)
                        ? Math.ceil($scope.options.paging.totalItemCount / $scope.options.paging.pageSize)
                        : 0;

                    if (vm.pageCount < 1) {
                        vm.pageCount = 1;
                    }
                }

                function first() {
                    $scope.options.paging.currentPage = 1;
                    pageChanged();
                }

                function prev() {
                    $scope.options.paging.currentPage -= 1;
                    if ($scope.options.paging.currentPage < 1) {
                        $scope.options.paging.currentPage = 1;
                    }
                    pageChanged();
                }

                function next() {
                    $scope.options.paging.currentPage += 1;
                    if ($scope.options.paging.currentPage > vm.pageCount) {
                        $scope.options.paging.currentPage = vm.pageCount;
                    }
                    pageChanged();
                }

                function last() {
                    $scope.options.paging.currentPage = vm.pageCount;
                    pageChanged();
                }

                function pageChanged() {
                    if ($scope.options.paging.onPageChange) {
                        $scope.options.paging.onPageChange($scope.options.paging.currentPage, $scope.options.paging.pageSize, $scope.options.sorting.sort);
                    }
                }

                function sortChanged() {
                    if ($scope.options.sorting.onSortChange) {
                        if ($scope.options.paging) {
                            $scope.options.paging.currentPage = 1;
                            $scope.options.sorting.onSortChange($scope.options.paging.currentPage, $scope.options.paging.pageSize, $scope.options.sorting.sort);
                        } else {
                            $scope.options.sorting.onSortChange(null, null, $scope.options.sorting.sort);
                        }
                    }
                }

                function sort(field) {
                    if (Object.getOwnPropertyNames(vm.columns).length === 0)
                        return;

                    var col = fetchColumn(field);

                    var direction = 'asc';

                    if (col.hasClass('asc'))
                        direction = 'desc';

                    cleanSortClasses();

                    col.addClass(direction);

                    $scope.options.sorting.sort = [field + ' ' + direction];

                    sortChanged();
                }

                function cleanSortClasses() {
                    angular.forEach(Object.keys(vm.columns), col => {
                        if(vm.columns[col].field) {
                            var colElement = fetchColumn(vm.columns[col].field);
                            colElement.removeClass('desc');
                            colElement.removeClass('asc');
                        }
                    });
                }

                function fetchColumn(name) {
                    if(!name) return;
                    var id = $attrs.tcOptions + '_' + name.replace(/\./g, '');
                    return angular.element(document.getElementById(id));
                }

                function addColumn(name) {
                    if(vm.columns.indexOf(name) == -1)
                        vm.columns.push(name);
                }

                function updatePageSize() {
                    pageChanged();
                }
            }
        };


    }

    function tcGridColumn() {
        return {
            restrict: 'E',
            require: '^tcGrid',
            replace: true,
            transclude: true,
            template: "<div class='tc-display_td' ng-transclude></div>",
            scope: true
        };
    }
}());
