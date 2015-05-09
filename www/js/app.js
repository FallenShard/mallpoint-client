angular.module('mallpoint', ['ionic',
                             'mallpoint.controllers',
                             'mallpoint.services',
                             'mallpoint.values',
                             'mallpoint.filters'])

.run(function($ionicPlatform, $ionicLoading, $rootScope) {
  $ionicPlatform.ready(function() {

    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });

  $rootScope.$on('$stateChangeStart', function(event, toState) {
      console.log('Entering state: ' + toState.name);
  });
})

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider

    .state('login', {
        url: "/login",
        views: {
            'rootView': {
                templateUrl: "templates/login.html",
                controller: 'LoginController'
            }
        }
    })

    .state('register', {
        url: "/register",
        views: {
            'rootView': {
                templateUrl: "templates/register.html",
                controller: 'RegisterController'
            }
        }
    })

    .state('app', {
        abstract: true,
        url: "/app",
        views: {
            'rootView': {
                templateUrl: "templates/sidemenu.html"
            }
        }
    })

    .state('app.map', {
        url: "/map",
        views: {
            'menuContent': {
                templateUrl: "templates/map.html",
                controller: 'MapController'
            }
        }
    })

    .state('app.favorites', {
        url: "/favorites",
        views: {
            'menuContent': {
                templateUrl: "templates/favorites.html",
                controller: 'FavoritesController'
            }
        }
    })

    .state('app.settings', {
        url: "/settings",
        views: {
            'menuContent': {
                templateUrl: "templates/settings.html",
                controller: 'SettingsController'
            }
        }
    })

    .state('app.about', {
        url: "/about",
        views: {
            'menuContent': {
                templateUrl: "templates/about.html"
            }
        }
    })

    .state('app.logout', {
        url: "/logout",
        views: {
            'menuContent': {
                controller: 'LogoutController'
            }
        }
    });

    $urlRouterProvider.otherwise('/login');
});
