angular.module('mallpoint.controllers', ['ionic'])

.controller('LoginController', function($rootScope, $scope, $state, $ionicPopup, LocalStorage, Authentication) {

    var loginSuccess = function(data, status, headers, config) {
        // Store this for autologin on next start-ups
        var creds = {};
        creds.email = data.email;
        creds.passwordHash = data.passwordHash;
        LocalStorage.setObject('credentials', creds);

        // Make sure we can access the user from next states
        $rootScope.activeUser = data;

        $state.go('app.map');
    };

    var loginError = function(data, status, headers, config) {
        console.log("Login failed :(" + status);
        console.log(data);

        $scope.showLoginError = true;
    };

    var cred = LocalStorage.getObject('credentials');

    // Check if the object is not empty and attempt auto-login
    if (Object.keys(cred).length > 0)
    {
        console.log(cred);

        Authentication.autologin(cred).
        success(loginSuccess).
        error(loginError);
    }

    $scope.login = function (user) {
        console.log(user);

        Authentication.login(user).
        success(loginSuccess).
        error(loginError);
    };
})

.controller('RegisterController', function($state, $scope, $ionicLoading) {
    $scope.register = function(newUser) {
        if (newUser)
        {
            if (newUser.password === newUser.repeatPassword)
            {
                // attempt register
                $ionicLoading.show({ template: JSON.stringify(newUser), noBackdrop: true, duration: 2000 });
            }
            else
            {
                $ionicLoading.show({ template: "Passwords must match!", noBackdrop: true, duration: 2000 });
            }
        }
    }
})

.controller('DebugController', function($scope, Geolocation) {

    console.log("Entering DebugController!");
    $scope.coords = {};
    $scope.coords.lat = -1;
    $scope.coords.long = -1;

    var el = document.getElementById("spinner");
    el.style.visibility = "visible";

    var gpsParams = {};
    gpsParams.enableHighAccuracy = true;
    gpsParams.maximumAge = 1;

    Geolocation.getCurrentPosition().then(showPosition, errorCallback, gpsParams);

    function showPosition(position) {
        el.style.visibility = "hidden";

        //$scope.$apply(function() {
            $scope.coords.lat = position.coords.latitude;
            $scope.coords.long = position.coords.longitude;
        //});
        $scope.apply();
    }

    function errorCallback(position) {
        el.style.visibility = "hidden";
        $scope.$apply(function() {
            $scope.coords.lat = -255;
            $scope.coords.long = -255;
        });
    }
})

.controller('MapController', function($scope, $ionicLoading) {
    //google.maps.event.addDomListener(window, 'load', function() {

    console.log("Entering MapController!");
        var myLatLng = new google.maps.LatLng(43.00, 21.00);

        var mapOptions = {
            center: myLatLng,
            zoom: 16,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var map = new google.maps.Map(document.getElementById("map"), mapOptions);

        navigator.geolocation.watchPosition(function(pos) {
            map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            var myLocation = new google.maps.Marker({
                position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
                map: map,
                title: "My Location!"
            });
        });

        $scope.map = map;
    //});
})

.controller('LogoutController', function($state, LocalStorage) {
    LocalStorage.clear();
    console.log("storage cleared!");
    $state.go('login');
})


;
