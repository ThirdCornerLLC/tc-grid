(function() {

    var app = angular.module('MyApp', ['tc-grid']);

    app.controller('MyController', ['$scope', '$timeout', MyController]);

    function MyController($scope, $timeout) {
        var loadingTime = 1000;

        var dataOrig =  [
            {
                Id: 1,
                Name: 'John',
                Email: 'John@john.com',
                Status: 'Online'
            },
            {
                Id: 2,
                Name: 'Zach',
                Email: 'Zach@zach.com',
                Status: 'Online'
            },
            {
                Id: 3,
                Name: 'Tim',
                Email: 'Tim@tim.com',
                Status: 'Offline'
            },
            {
                Id: 4,
                Name: 'Michael',
                Email: 'Michael@Michael.com',
                Status: 'Online'
            }
        ];

        var vm = {
            data: [],
            gridOptions: {
                paging: {
                    onPageChange: function (page, count, sort) {
                        vm.data = [];
                        $timeout(function() {
                            vm.data = dataOrig.slice((page - 1) * count, page * count);
                        }, loadingTime);
                    },
                    totalItemCount: 4,
                    pageSize: 2,
                    pageSizeOptions: [1, 2, 3]
                },
                sorting: {
                    onSortChange: function (page, count, sort) {
                        if (!sort || sort.length === 0) return;
                        sort = sort[0];
                        var descending = (sort.indexOf('desc') > -1);

                        sort = sort.replace(/\s\w*/, '');

                        var data = dataOrig.sort(sortBy(sort));

                        vm.data = [];
                        $timeout(function() {
                            vm.data = (descending) ? data.reverse() : data;
                            vm.data = vm.data.slice((page - 1) * count, page * count);
                        }, loadingTime);


                    }
                },
                columnDisplay: [1,2,3,4,5]
            },
            show: {
                Id: true,
                Name: true,
                Email: true,
                Status: true,
                Controls: true
            },
            prev: function() {
                vm.gridOptions.prev();
            },
            next: function() {
                vm.gridOptions.next();
            },
            test: function() {
                alert("I'm the controller");
            },
            sorter: sorter
        };

        init();

        function init() {
            $scope.vm = vm;
            vm.data = [];

            //simulate loading from server
            $timeout(function() {
                vm.data = dataOrig.slice(0, 2);
            }, loadingTime);
        }

        function sorter() {
            for(let i = 0; i < 100000; i++) {
                vm.gridOptions.sort();
            }
        }

        function sortBy(field) {
            return function(a, b) {
                if(!isNaN(a[field]) && !isNaN(b[field])) {
                    return a[field] - b[field];
                } else {
                    return a[field] > b[field] ? 1 : -1;
                }
            }
        }
    }

}());