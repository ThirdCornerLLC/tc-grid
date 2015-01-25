(function () {
    'use strict';
    angular.module('tc-grid', [])
        .directive('tcGrid', tcGrid)
        .directive('tcGridColumn', tcGridColumn);

    function tcGrid($parse, $templateCache) {
        return {
            restrict: 'E',
            compile: (element, attrs, transclude) => {
                var children = element.children();

                var headerHtml = "";

                attrs.columns = [];

                angular.forEach(children, (child, index) => {
                    var el = angular.element(child);

                    var colField = el.attr('tc-col-field');
                    var colName = el.attr('tc-col-name') || colField || '';
                    var sort = el.attr('tc-col-sort');
                    var ignoreClick = el.attr('tc-ignore-click');
                    var colClass = el.attr('tc-col-class');

                    var sortExpression = (sort) ? (',\'' + sort + '\'') : '';

                    var sortFn = '';

                    if (colField || sort) {
                        sortFn = ' ng-click="' + attrs.tcGridOptions + '.internal.sort(\'' + (sort || colField) + '\'' + sortExpression + ')"';
                        attrs.columns.push(sort || colField);
                    }

                    if (ignoreClick) 
                        el.attr('ng-click', '$event.stopPropagation();');
                    
                    if (el.html() === '' && colField)
                        el.html('{{row.' + colField + '}}');
                    
                    el.addClass(colClass || 'tc-style_td');
                    el.attr('tc-col-index', index + 1);

                    headerHtml += '<div class="tc-display_th tc-style_th tc-display_sort tc-style_sort" id="' + attrs.tcGridOptions + '_' + (colField || sort).replace(/\./g, '') + '"' + sortFn + '>' + colName + '</div>';
                });
                
                var templateHtml = $templateCache.get('tcGrid.html');                
                templateHtml = templateHtml.replace(/%OPTIONS%/g, attrs.tcGridOptions);
                templateHtml = templateHtml.replace(/%HEADER%/g, headerHtml);
                templateHtml = templateHtml.replace(/%DATA%/g, attrs.tcGridData);
                templateHtml = templateHtml.replace(/%GRIDCLASS%/g, attrs.tcGridClass || 'tc-grid');                
                templateHtml = templateHtml.replace(/%ROWCLICK%/g, attrs.tcRowClick ? 'ng-click="' + attrs.tcRowClick + '"' : "");
                templateHtml = templateHtml.replace(/%FILTER%/g, attrs.tcGridFilter ? ' | filter: ' + attrs.tcGridFilter : "");
                templateHtml = templateHtml.replace(/%ROWCLASS%/g, attrs.tcRowClass || 'tc-style_tr');
                templateHtml = templateHtml.replace(/%CHILDREN%/g, children.parent().html());

                var template = angular.element(templateHtml);
                            
                element.html('');
                element.append(template);

                return {
                    pre: (scope, ele, attrs, ctrl) => {},
                    post: (scope, element, attrs, ctrl) => {}
                };
            },
            controller: ($scope, $element, $attrs) => {                
                var options = $parse($attrs.tcGridOptions)($scope);

                var watchInitialized = false;
                
                return init();

                function init() {
                    initOptions();
                    initWatch();

                    if (options) {
                        if (options.sorting.onSortChange)
                            sortChanged();
                        else if (options.paging.onPageChange)
                            pageChanged();
                    }
                }

                function initOptions() {
                    if (!options) return;

                    options.internal = {
                        pageCount: 1,
                        showFooter: false,
                        prev: prev,
                        next: next,
                        first: first,
                        last: last,
                        sort: sort,
                        columns: $attrs.columns
                    };

                    if (options.paging)
                        initPaging();

                    if (options.sorting)
                        initSort();
                }

                function initWatch() {
                    $scope.$watch($attrs.tcGridOptions, pageCountWatcher, true);

                    function pageCountWatcher() {
                        if(!watchInitialized) {
                            watchInitialized = true;
                            return;
                        }
                        
                        options = $parse($attrs.tcGridOptions)($scope);

                        if (options && options.paging)
                            getPageCount();                        
                    }
                }

                function initPaging() {
                    if (!options.paging.pageSize || options.paging.pageSize < 1)
                        options.paging.pageSize = 20;

                    if (!options.paging.totalItemCount || options.paging.totalItemCount < 0)
                        options.paging.totalItemCount = 0;

                    if (!options.paging.currentPage || options.paging.currentPage < 1)
                        options.paging.currentPage = 1;

                    getPageCount();

                    options.internal.showFooter = true;
                }

                function initSort() {
                    if(!options.sorting.sort) return;

                    angular.forEach(options.sorting.sort, (sortItem) => {
                        var col = sortItem.split(' ')[0];
                        var dir = sortItem.split(' ')[1] || 'asc';

                        var column = fetchColumn(col);
                        column.addClass(dir.toLowerCase());
                    });
                }


                function getPageCount() {
                    options.internal.pageCount = (options.paging.totalItemCount > 0)
                        ? Math.ceil(options.paging.totalItemCount / options.paging.pageSize)
                        : 0;

                    if (options.internal.pageCount < 1) {
                        options.internal.pageCount = 1;
                    }
                }

                function first() {
                    options.paging.currentPage = 1;
                    pageChanged();
                }

                function prev() {
                    options.paging.currentPage -= 1;
                    if (options.paging.currentPage < 1) {
                        options.paging.currentPage = 1;
                    }
                    pageChanged();
                }

                function next() {
                    options.paging.currentPage += 1;
                    if (options.paging.currentPage > options.internal.pageCount) {
                        options.paging.currentPage = options.internal.pageCount;
                    }
                    pageChanged();
                }

                function last() {
                    options.paging.currentPage = options.internal.pageCount;
                    pageChanged();
                }

                function pageChanged() {
                    if (options.paging.onPageChange) {
                        options.paging.onPageChange(options.paging.currentPage, options.paging.pageSize, options.sorting.sort);
                    }
                }

                function sortChanged() {
                    if (options.sorting.onSortChange) {
                        if (options.paging) {
							options.paging.currentPage = 1;
                            options.sorting.onSortChange(options.paging.currentPage, options.paging.pageSize, options.sorting.sort);
                        } else {
                            options.sorting.onSortChange(null, null, options.sorting.sort);
                        }
                    }
                }
                
                function sort(field, expression) {
                    if (options.internal.columns.length === 0)
                        return;

                    var col = fetchColumn(field);

                    var direction = 'asc';

                    if (col.hasClass('asc'))
                        direction = 'desc';

                    cleanSortClasses();

                    col.addClass(direction);

                    options.sorting.sort = [(expression || field) + ' ' + direction];

                    sortChanged();
                }

                function cleanSortClasses() {
                    angular.forEach(options.internal.columns, col => {
                        var colElement = fetchColumn(col);
                        colElement.removeClass('desc');
                        colElement.removeClass('asc');
                    });
                }

                function fetchColumn(name) {
                    var id = $attrs.tcGridOptions + '_' + name.replace(/\./g, '');
                    return angular.element(document.getElementById(id));
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
            template: "<div class='tc-display_td' ng-transclude=''></div>"
        };
    }    
}());
