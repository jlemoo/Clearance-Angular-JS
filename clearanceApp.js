var clearanceApp = angular.module('clearanceApp', [
'ngRoute',
'clearanceControllers',
'angularUtils.directives.dirPagination'
]);
clearanceApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/InProcess',{
        templateUrl: 'inProcessList.html',
        controller: 'inProcessCtrl'
        }).  
      when('/newClearance',{
        templateUrl: 'newClearance.html',
        controller: 'newClearanceCtrl'
        }).
      when('/viewClearance/:itemId',{
        templateUrl: 'viewClearance.html',
        controller: 'viewClearanceCtrl'
        }).
      when('/editClearance/:itemId',{
        templateUrl: 'editClearance.html',
        controller: 'editClearanceCtrl'
        }).
      when('/piClearance/:itemId',{
        templateUrl: 'piClearance.html',
        controller: 'piClearanceCtrl'
        }).
      when('/help',{
        templateUrl: 'clearanceHelp.html'
        }).   
        otherwise({
        redirectTo: '/InProcess'
      });
  }]);
