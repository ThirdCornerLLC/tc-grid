##tc-grid
A declarative grid for AngularJS

###[Demo](http://codepen.io/Zacharias3690/pen/avbBoq?editors=101)

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
<link href="bower_components/tc-grid/dest/tc-grid.css" rel="stylesheet" type="text/css">
<script type="text/javascript" src="bower_components/tc-grid/dest/tc-grid.js"></script>

<!--
	tc-data: Array data source for grid
	tc-name: Header name for column
	row: single object from array data source
-->

<tc-grid tc-data="dataSource">
	<tc-column tc-name="Column Header Name">{{row.dataSourceProperty}}</tc-column>
	<tc-column tc-name="Column Header Name">{{row.dataSourceProperty}}</tc-column>
	<tc-column tc-name="Column Header Name">{{row.dataSourceProperty}}</tc-column>
	<tc-column tc-name="Column Header Name">{{row.dataSourceProperty}}</tc-column>
</tc-grid>
```

Paging and Sorting 

```html
<!--
	tc-options: options object to hold paging/sorting info
	tc-field: field name to sort on, usually property name
-->

<tc-grid tc-data="dataSource" tc-options="vm.myOptions">
	<tc-column tc-name="Column Header Name" tc-field="dataSourceProperty">{{row.dataSourceProperty}}</tc-column>	
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
#### [grid options](#gridOptions)
 * tc-grid
 * tc-data
 * tc-options
 * tc-grid-class
 * tc-grid-filter

#### [row options](#rowOptions)
 * tc-row-click
 * tc-row-class

#### [column options](#columnOptions)
 * row
 * tc-column
 * tc-name
 * tc-field
 * tc-col-class
 * tc-ignore-click
 * tc-visible

### <a name="gridOptions">Grid Options</a>
##### tc-grid
Initialize the grid
```html
<tc-grid></tc-grid>
```

##### tc-data
Set the grid's data source
```html
<tc-grid tc-data="dataSource"></tc-grid>
```

##### tc-options
Set the grid's options object
```html
<tc-grid tc-options="gridOptions"></tc-grid>
```

##### tc-grid-class
Set a custom class for the grid
```html
<tc-grid tc-grid-class="gridClass"></tc-grid>
```

##### tc-grid-filter
Set a filter function for the grid
``` html
<input type="text" ng-model="filterString"/>
<tc-grid tc-grid-filter="myFilter"></tc-grid>
```
```javascript
function myFilter(item) {
    if(item.Name.indexOf($scope.filterString)) 
        return true;
    return false;
}
```
    
### <a name="rowOptions">Row Options</a>
##### tc-row-click
function called when a row is clicked
```html
<tc-grid tc-row-click="performAction"></tc-grid>
```
```javascript
function performAction(row) {
    //do something...
}
```

##### tc-row-class
class to apply to each row
```html
<tc-grid tc-row-class"myClass"></tc-grid>
```
    
### <a name="columnOptions">Column Options</a>
##### row
object available inside tc-column tags giving access to the individual element
##### tc-column
individual column element in the grid<br/>
supports html markup between the tags
```html
<tc-grid>
    <tc-column>{{row.date | date: 'MM/dd/yyyy'}}</tc-column>
</tc-grid>
```

##### tc-name
header name for the column, supports html markup
```html
<tc-grid>
    <tc-column tc-name="MyColumn"></tc-column>
</tc-grid>
```

##### tc-field
field to sort on for an individual column
```html
<tc-grid>
    <tc-column tc-field="myColumn"></tc-column>
</tc-grid>
```

##### tc-col-class
class to apply to indiviudal columns
```html
<tc-grid>
    <tc-column tc-col-class="myClass"></tc-column>
</tc-grid>
```

##### tc-ignore-click
Ignore the row click for the individual column
```html
<tc-grid tc-row-click="performAction">
    <!-- calls performAction -->
    <tc-column><input type="checkbox"/></tc-column>
    <!-- doesn't call performAction -->
    <tc-column tc-ignore-click><input type="checkbox"/></tc-column>
</tc-grid>
```

##### tc-visible
Toggle column visibility
```html
<input type="checkbox" ng-model="showCol"/>
<tc-grid tc-row-click="performAction">
    <tc-column tc-visible="showCol">{{row.name}}</tc-column>
</tc-grid>
```

#### tc-options
##### paging
  * page
    * page to start gird on
  * pageSize
    * items per page
  * totalItemCount
    * total items
  * onPageChange
    * called when the page number changes, used to update grid data

##### sorting
  * sort
      * initial sort to start grid on<br/>
          ['field dir']
  * onSortChange
      * Called when grid is sorted

##### column display
  * columnDisplay
      * array of column indexes, names, and/or fields to determine column visibility and order

##### functions
  * reset
  	  * sets paging and sorting to page 1 and no sort

##Build

navigate to directory

```sh
#install gulp
npm install gulp -g

#install build dependencies
npm install

#run gulp to build less and js
gulp build
```
