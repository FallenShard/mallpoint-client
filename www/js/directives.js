angular.module('mallpoint.directives', [])

.directive('searchBar', [function () {
	return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/search-directive.html',

		// scope: {
		// 	ngModel: '='
		// },
		//require: ['^ionNavBar', '?ngModel']
        //
		// link: function($scope, $element, $attrs, ctrls) {
        //     // var navBarCtrl = ctrls[0];
        //     // $scope.navElement = $attrs.side === 'right' ? navBarCtrl.rightButtonsElement : navBarCtrl.leftButtonsElement;
        //
        //     // console.log("LinkFunc: " );
        //     // console.log($scope);
        //     // console.log($element);
        //     // console.log($attrs);
        //     // console.log(ctrls);
        // },
        //
		// controller: ['$scope','$ionicNavBarDelegate', '$ionicLoading', function($scope,$ionicNavBarDelegate, $ionicLoading) {
		// 	var title, definedClass;
        //     // console.log("ControllerFunc");
        //     // console.log($ionicNavBarDelegate);
        //     // console.log($scope);
        //     // console.log($ionicLoading);
        //     // console.log($ionicNavBarDelegate.title('Lelwhut'));
		// 	// $scope.$watch('ngModel.show', function(showing, oldVal, scope) {
		// 	// 	if(showing!==oldVal) {
		// 	// 		if(showing) {
		// 	// 			if(!definedClass) {
		// 	// 				var numicons=$scope.navElement.children().length;
		// 	// 				angular.element($scope.navElement[0].querySelector('.searchBar')).addClass('numicons'+numicons);
		// 	// 			}
        //     //
        //     //             console.log($ionicNavBarDelegate);
        //     //
		// 	// 			title = $ionicNavBarDelegate.title();
		// 	// 			$ionicNavBarDelegate.title('');
		// 	// 		} else {
		// 	// 			$ionicNavBarDelegate.title(title);
		// 	// 		}
		// 	// 	} else if (!title) {
		// 	// 		title = $ionicNavBarDelegate.title();
		// 	// 	}
		// 	// });
		// }]
	};
}]);
