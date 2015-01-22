##tc-grid
A declarative grid for AngularJS

##Requirements

- AngularJS
- Font Awesome
- Bootstrap

##Installation

```sh
bower install tc-grid
```

##Usage

Basic Usage

```javascript
angular.module('app', ['tc-grid']);
```

```html
<!-- Include dependencies -->
<link href="bower_components/tc-grid/dest/tc-grid.css" rel="stylesheet" type="text/css">
<script type="text/javascript" src="bower_components/tc-grid/dest/tc-grid.js"></script>
<script type="text/javascript" src="bower_components/tc-grid/dest/tc-grid-templates.js"></script>

<!--
	tc-grid-data: Array data source for grid
	tc-col-name: Header name for column
	row: single object from array data source
-->

<tc-grid tc-grid-data="dataSource">
	<tc-grid-column tc-col-name="Column Header Name">{{row.dataSourceProperty}}</tc-grid-column>
	<tc-grid-column tc-col-name="Column Header Name">{{row.dataSourceProperty}}</tc-grid-column>
	<tc-grid-column tc-col-name="Column Header Name">{{row.dataSourceProperty}}</tc-grid-column>
	<tc-grid-column tc-col-name="Column Header Name">{{row.dataSourceProperty}}</tc-grid-column>
</tc-grid>
```

Paging and Sorting 

```html
<!--
	tc-grid-options: options object to hold paging/sorting info
	tc-col-field: field name to sort on, usually property name
-->

<tc-grid tc-grid-data="dataSource" tc-grid-options="vm.myOptions">
	<tc-grid-column tc-col-name="Column Header Name" tc-col-field="dataSourceProperty">{{row.dataSourceProperty}}</tc-grid-column>	
</tc-grid>
```

```javascript
/*
	page(int): page to start grid on,
	pageSize(int): number of items per page,
	sort(array): array with string formatted by "prop dir",
	onPageChange(func): called on load and when page is changed,
	onSortChange(func): called on load and when sort is changed
*/

angular.module('app').controller('MyController', ['$scope', controller]);

function controller($scope) {
	var vm = {
		myOptions: {
			paging: {
				page: 1, //optional
				pageSize: 20, //optional
				totalItemCount: 200, //optional
				onPageChange: function(page, pageSize, sort) {
					loadData(page, pageSize, sort);
				}				
			},
			sorting: {
				sort: ['propName desc'],
				onSortChange: function(page, pageSize, sort) {
					loadData(page, pageSize, sort);
				}
			}
		}
	}

	function loadData(page, pageSize, sort) {
		//returns data from server
	}
}
```

##API

Coming soon

##Build

navigate to directory

```sh
#install gulp
npm install gulp -g

#install build dependencies
npm install

#run gulp to compile less and js
gulp
```

##Contributers
Zach Barnes<br/>
Tim Jones<br/>
Michael Breedlove<br/>
Sean Goodpasture<br/>

