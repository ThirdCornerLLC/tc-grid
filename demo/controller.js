(function() {

	var app = angular.module('MyApp', ['tc-grid']);

	app.controller('MyController', ['$scope', MyController]) 

	function MyController($scope) {
		var vm = {
			data: [
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

			],
			gridOptions: {
				paging: {
					onPageChange: function(page, count, sort) {						
					}
				},
				sorting: {
					onSortChange: function(page, count, sort) {

					}
				}
			}
		};

		init();

		function init() {
			$scope.vm = vm;
			vm.gridOptions.paging.totalItemCount = 1000;
		}
	}

}());