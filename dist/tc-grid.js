"use strict";

(function () {
  "use strict";
  var tcGrid = function ($parse, $templateCache) {
    return {
      restrict: "E",
      compile: function (element, attrs, transclude) {
        var children = element.children();

        var headerHtml = "";

        attrs.columns = [];

        angular.forEach(children, function (child, index) {
          var el = angular.element(child);

          var colField = el.attr("tc-col-field");
          var colName = el.attr("tc-col-name") || colField || "";
          var sort = el.attr("tc-col-sort");
          var ignoreClick = el.attr("tc-ignore-click");
          var colClass = el.attr("tc-col-class");

          var sortExpression = sort ? ",'" + sort + "'" : "";

          var sortFn = "";

          if (colField || sort) {
            sortFn = " ng-click=\"" + attrs.tcGridOptions + ".internal.sort('" + (sort || colField) + "'" + sortExpression + ")\"";
            attrs.columns.push(sort || colField);
          }

          if (ignoreClick) el.attr("ng-click", "$event.stopPropagation();");

          if (el.html() === "" && colField) el.html("{{row." + colField + "}}");

          el.addClass(colClass || "tc-style_td");
          el.attr("tc-col-index", index + 1);

          headerHtml += "<div class=\"tc-display_th tc-style_th tc-display_sort tc-style_sort\" id=\"" + attrs.tcGridOptions + "_" + (colField || sort).replace(/\./g, "") + "\"" + sortFn + ">" + colName + "</div>";
        });

        var templateHtml = $templateCache.get("tcGrid.html");
        templateHtml = templateHtml.replace(/%OPTIONS%/g, attrs.tcGridOptions);
        templateHtml = templateHtml.replace(/%HEADER%/g, headerHtml);
        templateHtml = templateHtml.replace(/%DATA%/g, attrs.tcGridData);
        templateHtml = templateHtml.replace(/%GRIDCLASS%/g, attrs.tcGridClass || "tc-grid");
        templateHtml = templateHtml.replace(/%ROWCLICK%/g, attrs.tcRowClick ? "ng-click=\"" + attrs.tcRowClick + "\"" : "");
        templateHtml = templateHtml.replace(/%FILTER%/g, attrs.tcGridFilter ? " | filter: " + attrs.tcGridFilter : "");
        templateHtml = templateHtml.replace(/%ROWCLASS%/g, attrs.tcRowClass || "tc-style_tr");
        templateHtml = templateHtml.replace(/%CHILDREN%/g, children.parent().html());

        var template = angular.element(templateHtml);

        element.html("");
        element.append(template);

        return {
          pre: function (scope, ele, attrs, ctrl) {},
          post: function (scope, element, attrs, ctrl) {}
        };
      },
      controller: ["$scope", "$element", "$attrs", function ($scope, $element, $attrs) {
        var init = function () {
          initOptions();
          initWatch();

          if (options) {
            if (options.sorting.onSortChange) sortChanged();else if (options.paging.onPageChange) pageChanged();
          }
        };

        var initOptions = function () {
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

          if (options.paging) initPaging();

          if (options.sorting) initSort();
        };

        var initWatch = function () {
          var pageCountWatcher = function () {
            if (!watchInitialized) {
              watchInitialized = true;
              return;
            }

            options = $parse($attrs.tcGridOptions)($scope);

            if (options && options.paging) getPageCount();
          };

          $scope.$watch($attrs.tcGridOptions, pageCountWatcher, true);
        };

        var initPaging = function () {
          if (!options.paging.pageSize || options.paging.pageSize < 1) options.paging.pageSize = 20;

          if (!options.paging.totalItemCount || options.paging.totalItemCount < 0) options.paging.totalItemCount = 0;

          if (!options.paging.currentPage || options.paging.currentPage < 1) options.paging.currentPage = 1;

          getPageCount();

          options.internal.showFooter = true;
        };

        var initSort = function () {
          if (!options.sorting.sort) return;

          angular.forEach(options.sorting.sort, function (sortItem) {
            var col = sortItem.split(" ")[0];
            var dir = sortItem.split(" ")[1] || "asc";

            var column = fetchColumn(col);
            column.addClass(dir.toLowerCase());
          });
        };

        var getPageCount = function () {
          options.internal.pageCount = options.paging.totalItemCount > 0 ? Math.ceil(options.paging.totalItemCount / options.paging.pageSize) : 0;

          if (options.internal.pageCount < 1) {
            options.internal.pageCount = 1;
          }
        };

        var first = function () {
          options.paging.currentPage = 1;
          pageChanged();
        };

        var prev = function () {
          options.paging.currentPage -= 1;
          if (options.paging.currentPage < 1) {
            options.paging.currentPage = 1;
          }
          pageChanged();
        };

        var next = function () {
          options.paging.currentPage += 1;
          if (options.paging.currentPage > options.internal.pageCount) {
            options.paging.currentPage = options.internal.pageCount;
          }
          pageChanged();
        };

        var last = function () {
          options.paging.currentPage = options.internal.pageCount;
          pageChanged();
        };

        var pageChanged = function () {
          if (options.paging.onPageChange) {
            options.paging.onPageChange(options.paging.currentPage, options.paging.pageSize, options.sorting.sort);
          }
        };

        var sortChanged = function () {
          if (options.sorting.onSortChange) {
            if (options.paging) {
              options.paging.currentPage = 1;
              options.sorting.onSortChange(options.paging.currentPage, options.paging.pageSize, options.sorting.sort);
            } else {
              options.sorting.onSortChange(null, null, options.sorting.sort);
            }
          }
        };

        var sort = function (field, expression) {
          if (options.internal.columns.length === 0) return;

          var col = fetchColumn(field);

          var direction = "asc";

          if (col.hasClass("asc")) direction = "desc";

          cleanSortClasses();

          col.addClass(direction);

          options.sorting.sort = [(expression || field) + " " + direction];

          sortChanged();
        };

        var cleanSortClasses = function () {
          angular.forEach(options.internal.columns, function (col) {
            var colElement = fetchColumn(col);
            colElement.removeClass("desc");
            colElement.removeClass("asc");
          });
        };

        var fetchColumn = function (name) {
          var id = $attrs.tcGridOptions + "_" + name.replace(/\./g, "");
          return angular.element(document.getElementById(id));
        };

        var options = $parse($attrs.tcGridOptions)($scope);

        var watchInitialized = false;

        return init();
      }]
    };

  };
  tcGrid.$inject = ["$parse", "$templateCache"];

  var tcGridColumn = function () {
    return {
      restrict: "E",
      require: "^tcGrid",
      replace: true,
      transclude: true,
      template: "<div class='tc-display_td' ng-transclude=''></div>"
    };
  };

  angular.module("tc-grid", []).directive("tcGrid", tcGrid).directive("tcGridColumn", tcGridColumn);
})();
angular.module("tc-grid").run(["$templateCache", function($templateCache) {$templateCache.put("tcGrid.html","<div class=\"tcGrid__scope\">\r\n    <div class=\"%GRIDCLASS%\">\r\n        <div class=\"tc-display_table tc-style_table\">\r\n            <div class=\"tc-display_thead tc-style_thead\">\r\n                <div class=\"tc-display_tr tc-style_tr\">\r\n                    %HEADER%\r\n                </div>\r\n            </div>\r\n            <div class=\"tc-display_tbody tc-style_tbody\">\r\n                <div class=\"tc-display_tr %ROWCLASS%\" id=\"tc-row-container\" ng-repeat=\"row in %DATA% %FILTER%\" %ROWCLICK%>\r\n                    %CHILDREN%\r\n                </div>\r\n            </div>\r\n           \r\n        </div>       \r\n        \r\n        <div class=\"tc-style_pager\" ng-show=\"%OPTIONS%.internal.showFooter && %OPTIONS%.internal.pageCount > 1\">\r\n            <div class=\"tc-style_item-total\">\r\n                {{(%OPTIONS%.paging.currentPage - 1) * %OPTIONS%.paging.pageSize + 1}}\r\n                -\r\n                {{%OPTIONS%.paging.currentPage === %OPTIONS%.internal.pageCount ? %OPTIONS%.paging.totalItemCount : %OPTIONS%.paging.currentPage * %OPTIONS%.paging.pageSize}}\r\n                of\r\n                {{%OPTIONS%.paging.totalItemCount}}\r\n            </div>\r\n            <div class=\"tc-style_page-nav\">\r\n                <span class=\"tc-style_page-display\">{{%OPTIONS%.paging.currentPage}} / {{%OPTIONS%.internal.pageCount}}</span>\r\n                <button class=\"tc-button\" ng-click=\"%OPTIONS%.internal.first()\" ng-disabled=\"%OPTIONS%.paging.currentPage === 1\"><strong>|</strong>&#9668;</button>\r\n                <button class=\"tc-button\" ng-click=\"%OPTIONS%.internal.prev()\" ng-disabled=\"%OPTIONS%.paging.currentPage === 1\">&#9668;</button>\r\n                <button class=\"tc-button\" ng-click=\"%OPTIONS%.internal.next()\" ng-disabled=\"%OPTIONS%.paging.currentPage === %OPTIONS%.internal.pageCount\">&#9658;</button>\r\n                <button class=\"tc-button\" ng-click=\"%OPTIONS%.internal.last()\" ng-disabled=\"%OPTIONS%.paging.currentPage === %OPTIONS%.internal.pageCount\">&#9658;<strong>|</strong></button>\r\n            </div>\r\n            <div class=\"clearfix\"></div>\r\n        </div>\r\n    </div>\r\n\r\n</div>");}]);