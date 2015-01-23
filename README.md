##tc-grid
A declarative grid for AngularJS

##Requirements

- AngularJS
- Font Awesome

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
#### [grid options](#gridOptions)
 * tc-grid
 * tc-grid-data
 * tc-grid-options
 * tc-grid-class
 * tc-grid-filter

#### [row options](#rowOptions)
 * tc-row-click
 * tc-row-class

#### [column options](#columnOptions)
 * row
 * tc-grid-column
 * tc-col-name
 * tc-col-field
 * tc-col-sort
 * tc-col-class
 * tc-ignore-click

### <a name="gridOptions">Grid Options</a>
##### tc-grid
Initialize the grid
```html
<tc-grid></tc-grid>
```

##### tc-grid-data
Set the grid's data source
```html
<tc-grid tc-grid-data="dataSource"></tc-grid>
```

##### tc-grid-options
Set the grid's options object
```html
<tc-grid tc-grid-options="gridOptions"></tc-grid>
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
object available inside tc-grid-column tags giving access to the individual element
##### tc-grid-column
individual column element in the grid<br/>
supports html markup between the tags
```html
<tc-grid>
    <tc-grid-column>{{row.date | date: 'MM/dd/yyyy'}}</tc-grid-column
</tc-grid>
```

##### tc-col-name
header name for the column, supports html markup
```html
<tc-grid>
    <tc-grid-column tc-col-name="MyColumn"></tc-grid-column
</tc-grid>
```

##### tc-col-field
field to sort on for an individual column
```html
<tc-grid>
    <tc-grid-column tc-col-field="myColumn"></tc-grid-column
</tc-grid>
```
##### tc-col-sort
See tc-col-field

##### tc-col-class
class to apply to indiviudal columns
```html
<tc-grid>
    <tc-grid-column tc-col-class="myClass"></tc-grid-column>
</tc-grid>
```

##### tc-ignore-click
Ignore the row click for the individual column
```html
<tc-grid tc-row-click="performAction">
    <!-- calls performAction -->
    <tc-grid-column><iput type="checkbox"/></tc-grid-column>
    <!-- doesn't call performAction -->
    <tc-grid-column tc-ignore-click><iput type="checkbox"/></tc-grid-column>
</tc-grid>
```

#### tc-grid-options
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

