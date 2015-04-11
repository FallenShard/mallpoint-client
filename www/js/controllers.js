angular.module('mallpoint.controllers', ['ionic'])

.controller('LoginController', function($rootScope, $scope, $state, $ionicPopup, LocalStorage, Authentication) {

    var loginSuccess = function(data, status, headers, config) {
        // Store this for autologin on next start-ups
        var creds = {};
        creds.email = data.email;
        creds.passwordHash = data.passwordHash;
        LocalStorage.setObject('credentials', creds);

        // Make sure we can access the user from other states
        $rootScope.activeUser = data;

        $state.go('app.map');
    };

    var loginError = function(data, status, headers, config) {
        var myPopup = $ionicPopup.show({
            template: '<div>Invalid email and/or password provided. Please try again.</div>',
            title: 'Invalid Credentials',
            scope: $scope,
            buttons: [
                {
                    text: 'OK',
                    type: 'button-assertive',
                    onTap: function(e) {
                    }
                }
            ]
          });
    };

    var cred = LocalStorage.getObject('credentials');

    // Check if the object is not empty and attempt auto-login
    if (Object.keys(cred).length > 0)
    {
        Authentication.autologin(cred).
        success(loginSuccess).
        error(loginError);
    }

    $scope.login = function (user) {
        Authentication.login(user).
        success(loginSuccess).
        error(loginError);
    };
})

.controller('RegisterController', function($state, $scope, $ionicPopup, $ionicLoading, Authentication) {

    var registrationSuccess = function(data, status, headers, config) {
        // Store the account details and perform login
        var creds = {};
        creds.email = data.email;
        creds.passwordHash = data.passwordHash;
        LocalStorage.setObject('credentials', creds);

        // Make sure we can access the user from other states
        $rootScope.activeUser = data;

        $state.go('app.map');
    };

    var registrationError = function(data, status, headers, config) {
        var reg = $ionicPopup.show({
            template: data.error,
            title: 'Registration Failure',
            scope: $scope,
            buttons: [
                {
                    text: 'OK',
                    type: 'button-assertive',
                    onTap: function(e) {
                    }
                }
            ]
          });
    };

    $scope.register = function(newUser) {
        if (newUser)
        {
            if (newUser.password === newUser.repeatPassword)
            {
                // attempt register
                Authentication.register(newUser).
                success(registrationSuccess).
                error(registrationError);
            }
            else
            {
                var myPopup = $ionicPopup.show({
                    template: "Passwords must match!",
                    title: 'Invalid Form Input',
                    scope: $scope,
                    buttons: [
                        {
                            text: 'OK',
                            type: 'button-assertive',
                            onTap: function(e) {
                            }
                        }
                    ]
                  });
            }
        }
    }
})

.controller('DebugController', function($scope, Geolocation) {

    $scope.coords = {};
    $scope.coords.lat = -1;
    $scope.coords.long = -1;

    var el = document.getElementById("spinner");
    el.style.visibility = "visible";

    var gpsParams = {};
    gpsParams.enableHighAccuracy = true;
    gpsParams.maximumAge = 1000;

    Geolocation.getCurrentPosition(gpsParams).then(showPosition, errorCallback);

    function showPosition(position) {
        el.style.visibility = "hidden";

        $scope.coords.lat = position.coords.latitude;
        $scope.coords.long = position.coords.longitude;
    }

    function errorCallback(position) {
        el.style.visibility = "hidden";
        console.error("Error retrieving position");
    }
})

.controller('MapController', function($scope, $rootScope, $ionicActionSheet, MapService, $ionicPopup, $ionicLoading, $timeout, Geolocation, Mallpoints, MarkerFactory) {

    var mapOptions = {
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
    $scope.userMarker = new google.maps.Marker({
        map: $scope.map,
        title: "My location!",
        zIndex: 999
    });

    Mallpoints.getAll().
    success(function(data, status, headers, config) {

        var icon = MapService.createMarker('shop');
        var mallIcon = MapService.createMarker('mall');

        $rootScope.mallpoints = [];
        for (var i = 0; i < data.length; i++) {

            var mallpoint = {};
            mallpoint.model = data[i];
            mallpoint.view = new google.maps.Marker({
                position: new google.maps.LatLng(data[i].latitude, data[i].longitude),
                animation: google.maps.Animation.DROP,
                map: $scope.map,
                icon: data[i].type === 'Shop' ? icon : mallIcon,
                title: data[i].title
            });

            $rootScope.mallpoints.push(mallpoint);
        }
    }).
    error(function(data, status, headers, config) {
        console.error("Failed to load mallpoints :(");
    });

    MapService.addLongTapListener($scope.map, function(event) {
        console.log("Long click!");
        var hideSheet = $ionicActionSheet.show({
            buttons: [
                { text: '<i class="icon ion-android-locate assertive"></i>Add on my location' },
                { text: '<i class="icon ion-arrow-graph-down-right assertive"></i>Add at clicked location' }
            ],
            titleText: 'New Mallpoint',
            buttonClicked: function(index) {
                switch(index) {
                    case 0: {
                        Mallpoints.showConfirmPopup($rootScope, $scope, $rootScope.activeUserLatLng);
                        break;
                    }
                    case 1: {
                        Mallpoints.showConfirmPopup($rootScope, $scope, event.latLng);
                        break;
                    }
                }
               return true;
           }
        });
    });

    var gpsParams = {};
    gpsParams.enableHighAccuracy = true;
    gpsParams.maximumAge = 3000;

    var showPosition = function(position) {
        var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        $rootScope.activeUserLatLng = latLng;

        $scope.userMarker.setPosition(latLng);
        $scope.map.setCenter(latLng);
    };

    var errorCallback = function(error) {
        // error
    };

    Geolocation.watchPosition(gpsParams).then(showPosition, errorCallback);
})

.controller('LogoutController', function($state, LocalStorage) {
    LocalStorage.clear();
    console.log("storage cleared!");
    $state.go('login');
})

.controller('MyMallpointsController', function($rootScope, $scope, Mallpoints) {
    Mallpoints.getAllFromUser($rootScope.activeUser).
    success(function(data) {
        $scope.mallpoints = data;
    }).
    error(function(data) {
        console.log("not nice");
    });
})

.controller('FavoritesController', function($scope) {

})

;
