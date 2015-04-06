// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('mallpoint', ['ionic',
                             'mallpoint.controllers',
                             'mallpoint.services'])

.run(function($ionicPlatform, $rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

  $rootScope.$on('$stateChangeStart', function(event, toState){
      console.log('Entering state: ' + toState.name);
  });
})

.config(function($stateProvider, $urlRouterProvider) {
    $stateProvider

    .state('signin', {
        url: "/sign-in",
        views: {
            'rootView': {
                templateUrl: "templates/sign-in.html",
                controller: 'SignInController'
            }
        }
    })

    .state('signup', {
        url: "/sign-up",
        views: {
            'rootView': {
                templateUrl: "templates/sign-up.html",
                controller: 'SignUpController'
            }
        }
    });
    //
    // .state('app', {
    //     abstract: true,
    //     url: "/app",
    //     views: {
    //         'rootView': {
    //             templateUrl: "templates/sidemenu.html"
    //         }
    //     }
    // })
    //
    // .state('app.geolocation', {
    //     url: "/geolocation",
    //     views: {
    //         'menuContent': {
    //             templateUrl: "templates/geolocation.html",
    //             controller: 'GeolocationController'
    //         }
    //     }
    // })
    //
    // .state('app.map', {
    //     url: "/map",
    //     views: {
    //         'menuContent': {
    //             templateUrl: "templates/map.html",
    //             controller: 'MapController'
    //         }
    //     }
    // })
    //
    // .state('app.tabs', {
    //     url: "/tabs",
    //     views: {
    //         'menuContent': {
    //             templateUrl: "templates/tabs.html",
    //         }
    //     }
    // })
    //
    // .state('app.tabs.dash', {
    //     url: "/dash",
    //     views: {
    //         'tab-dash': {
    //             templateUrl: "templates/tab-dash.html"
    //
    //         }
    //     }
    //
    // })
    //
    // .state('app.tabs.account', {
    //     url: "/account",
    //     views: {
    //         'tab-account': {
    //             templateUrl: "templates/tab-account.html"
    //         }
    //     }
    // });



    $urlRouterProvider.otherwise('/sign-in');
});
