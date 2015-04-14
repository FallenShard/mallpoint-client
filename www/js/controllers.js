angular.module('mallpoint.controllers', ['ionic'])

.controller('LoginController', function($rootScope, $scope, $state, Authentication) {
    var success = function(result) {
        $rootScope.activeUser = result;
        $state.go('app.map');
    };

    var error = function(reject) {
        console.error(reject);
    };

    Authentication.autologin($scope).then(success, error);

    $scope.login = function () {
        Authentication.login(this).then(success, error);
    };
})

.controller('RegisterController', function($rootScope, $scope, $state, Authentication) {
    var success = function(result) {
        $rootScope.activeUser = result;
        $state.go('app.map');
    };

    var error = function(reject) {
        console.error(reject);
    };

    $scope.register = function() {
        Authentication.register(this).then(success, error);
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

.controller('MapController', function($rootScope, $scope, $ionicActionSheet, Map, WebSocket, Geolocation, Mallpoints, IndexedDB) {

    IndexedDB.isSupported();

    var logError = function(error) {
        console.error(error);
    };

    var longClickCallback = function(event) {
        $ionicActionSheet.show({
            buttons: [
                { text: '<i class="icon ion-android-locate assertive"></i>Add on my location' },
                { text: '<i class="icon ion-arrow-graph-down-right assertive"></i>Add at clicked location' }
            ],
            titleText: 'New Mallpoint',
            buttonClicked: function(index) {
                switch(index) {
                    case 0: {
                        Mallpoints.create($scope, $scope.userMarker.getLatLng())
                        .then(Map.addMallpoint)
                        .catch(logError);
                        break;
                    }
                    case 1: {
                        Mallpoints.create($scope, event.latlng)
                        .then(Map.addMallpoint)
                        .catch(logError);
                        break;
                    }
                }
               return true;
            }
        });
    };



    $scope.map = Map.create('map');
    $scope.userMarker = Map.createUserMarker();
    Map.onLongClick(longClickCallback);

    Mallpoints.getAll()
    .then(Map.displayMallpoints)
    .catch(logError);

    // No click handler on this
    $scope.takePicture = function() {

        var displayImage = function(imageData) {
            var imgId = document.getElementById("myTestImage");
            imgId.src = "data:image/jpeg;base64," + imageData;
        };

        Camera.takePicture()
        .then(displayImage)
        .then(uploadPhoto)
        .then(function(data) {
            var elem = document.getElementById("debug");
            elem.innerHTML = "SUCCESS";
        })
        .catch(function(data) {
            var elem = document.getElementById("debug");
            elem.innerHTML = "FAIL";
        });
    };

    $scope.search = function() {
        Mallpoints.tagSearch(this)
        .then(Map.highlightMallpoints)
        .catch(logError);
    };

    var updateUserPosition = function(position) {
        var latLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
        $rootScope.activeUserLatLng = {};
        $rootScope.activeUserLatLng.lat = position.coords.latitude;
        $rootScope.activeUserLatLng.lng = position.coords.longitude;

        $scope.userMarker.setLatLng(latLng);
        $scope.map.setView(latLng);
    };

    var onMessageCallback = function(data) {
        console.log(data);
    }

    WebSocket.init();
    WebSocket.onMessage(onMessageCallback);
    WebSocket.startGeofencing($rootScope, 5000);

    Geolocation.watchPosition().then(updateUserPosition, logError);
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

.controller('FavoritesController', function($rootScope, $scope) {
    $scope.camPhoto = $rootScope.takenPhoto;
})

;
