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
					},
					totalItemCount: 100
				},
				sorting: {
					onSortChange: function(page, count, sort) {
						if(!sort) return;
						sort = sort[0];
						var descending = (sort.indexOf('desc') > -1);
						
						sort = sort.replace(/\s\w*/, '');						
						
						var data = _(vm.data).sortBy(sort);
																	
						vm.data = (descending) ? data.reverse().value() : data.value();
					}
				}
			}
		};

		init();
		
		function init() {
			$scope.vm = vm;
		}
	}

}());