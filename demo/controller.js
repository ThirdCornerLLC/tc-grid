(function() {

    var app = angular.module('MyApp', ['tc-grid']);

    app.controller('MyController', ['$scope', MyController]);

    function MyController($scope) {
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
                        vm.data = dataOrig.slice((page - 1) * count, page * count);
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

                        var data = _(dataOrig).sortBy(sort);

                        vm.data = (descending) ? data.reverse().value() : data.value();
                        vm.data = vm.data.slice((page - 1) * count, page * count);
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
            test: function() {
                alert("I'm the controller");
            },
            shuffleColumns: function() {
                vm.gridOptions.columnDisplay = _.shuffle(vm.gridOptions.columnDisplay);
            }
        };

        init();

        function init() {
            $scope.vm = vm;
            vm.data = dataOrig.slice(0, 2);
        }
    }

}());