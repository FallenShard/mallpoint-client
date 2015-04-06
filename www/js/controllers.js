angular.module('mallpoint.controllers', ['ionic'])

.controller('LoginController', function($scope, $state, $ionicLoading, LocalStorage) {

    LocalStorage.clear();
    var passHash = LocalStorage.get('passwordHash', '');

    if (passHash === '')
        console.log("No user data here");
    else
    {
        console.log("Logging in our user...");
        $ionicLoading.show({ template: 'User logged in!', noBackdrop: true, duration: 2000 });
    }


    $scope.login = function (user) {
        console.log(user);
        if (user && user.email === "admin" && user.password === "admin")
        {
            $ionicLoading.show({ template: 'User logged in!', noBackdrop: true, duration: 2000 });
            LocalStorage.set('passwordHash', user.password);
            $state.go('app.geolocation');
        }
        else
            $ionicLoading.show({ template: 'Incorrect password and/or email!', noBackdrop: true, duration: 2000});
    }
})

.controller('RegisterController', function($scope, $ionicLoading) {
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

.controller('GeolocationController', function($scope, Geolocation) {

    console.log("Entering GeoLocationController!");
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



;
