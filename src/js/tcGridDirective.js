(function () {
    'use strict';
    angular.module('tc-grid', []);
    angular.module('tc-grid').directive('tcGrid', tcGrid);
    angular.module('tc-grid').directive('tcGridColumn', tcGridColumn);

    function tcGrid($parse, $templateCache) {
        return {
            restrict: 'E',
            compile: function (element, attrs, transclude) {
                var children = element.children();

                var headerHtml = "";
                _.each(children, function (child) {
                    var el = angular.element(child);

                    var colField = el.attr('tc-col-field');
                    var colName = el.attr('tc-col-name') || colField || '';
                    var sort = el.attr('tc-col-sort');
                    var ignoreClick = el.attr('tc-ignore-click');

                    var sortExpression = (sort) ? (',\'' + sort + '\'') : '';

                    var sortFn = '';

                    if(colField || sort)
                        sortFn = ' ng-click="' + attrs.tcGridOptions + '.internal.sort(\'' + (sort || colField) + '\'' + sortExpression + ')"';

                    if (ignoreClick) 
                        el.attr('ng-click', '$event.stopPropagation();');
                    

                    if (el.html() === '' && colField)
                        el.html('{{row.' + colField + '}}');

                    headerHtml += '<div class="tc-grid_th tc-grid_sort" id="' + attrs.tcGridOptions + '_' + (colField || sort) + '"' + sortFn + '>' + colName + '</div>';
                });

                var templateHtml = $templateCache.get('tcGrid.html');

                templateHtml = templateHtml.replace(/%OPTIONS%/g, attrs.tcGridOptions);
                templateHtml = templateHtml.replace(/%HEADER%/g, headerHtml);
                templateHtml = templateHtml.replace(/%DATA%/g, attrs.tcGridData);
                templateHtml = templateHtml.replace(/%GRIDCLASS%/g, attrs.tcGridClass || 'tc-grid');                
                templateHtml = templateHtml.replace(/%ROWCLICK%/g, attrs.tcRowClick ? 'ng-click="' + attrs.tcRowClick + '"' : "");
                templateHtml = templateHtml.replace(/%FILTER%/g, attrs.tcGridFilter ? ' | filter: ' + attrs.tcGridFilter : "");
                templateHtml = templateHtml.replace(/%ROWCLASS%/g, attrs.tcRowClass);

                var template = angular.element(templateHtml);

                template.find('.tc-grid_tbody .tc-grid_tr').append(children);

                element.html('');
                element.append(template);

                return {
                    pre: function(scope, ele, attrs, ctrl) {},
                    post: function(scope, element, attrs, ctrl) {}
                };
            },
            controller: function($scope, $element, $attrs) {                

                // TODO: This could probably just be removed and replaced with code in the compile which already traverses the children elements
                this.addColumn = function (col) {
                    if (options && _.indexOf(options.internal.columns, col) == -1) {
                        options.internal.columns.push(col);
                    }
                };

                var options = $parse($attrs.tcGridOptions)($scope);

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
                        columns: []
                    };

                    if (options.paging)
                        initPaging();

                    if (options.sorting)
                        initSort();
                }

                function initWatch() {
                    $scope.$watch($attrs.tcGridOptions, _.after(2, pageCountWatcher), true);

                    function pageCountWatcher() {
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

                    _.each(options.sorting.sort, function (sortItem) {
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
                    _.each(options.internal.columns, function (col) {
                        var colElement = fetchColumn(col);
                        colElement.removeClass('desc');
                        colElement.removeClass('asc');
                    });
                }

                function fetchColumn(name) {
                    var id = ($attrs.tcGridOptions + '_' + name).replace(/\./g, '\\.');
                    return angular.element('#' + id);
                }
            }
        };


    }

    function tcGridColumn() {
        return {
            link: link,
            restrict: 'E',
            require: '^tcGrid',
            replace: true,
            transclude: true,
            template: "<div class='tc-grid_td' ng-transclude=''></div>"
        };

        function link(scope, element, attrs, tcGridCtrl) {
            if (attrs.tcColField || attrs.tcColSort) {
                tcGridCtrl.addColumn(attrs.tcColField || attrs.tcColSort);
            }            
        }
    }    
}());
