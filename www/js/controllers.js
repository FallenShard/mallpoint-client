angular.module('mallpoint.controllers', ['ionic'])

.controller('LoginController', function($scope, $state, Authentication, WiFi) {
    var showMap = function() {
        $state.go('app.map');
    };

    var logError = function(reject) {
        console.error(reject);
    };

    var setupLogin = function(result) {
        $scope.connection.active = true;

        Authentication
        .autologin($scope)
        .then(showMap)
        .catch(logError);

        $scope.login = function () {
            Authentication
            .login(this)
            .then(showMap)
            .catch(logError);
        };
    };

    $scope.connection = {};
    $scope.connection.active = false;

    WiFi
    .isActive($scope)
    .then(setupLogin)
    .catch(WiFi.showNoWifiPopup);
})

.controller('RegisterController', function($scope, $state, Authentication) {
    var showMap = function(userData) {
        $state.go('app.map');
    };

    var logError = function(reject) {
        console.error(reject);
    };

    $scope.register = function() {
        Authentication
        .register(this)
        .then(showMap)
        .catch(logError);
    };
})

.controller('MapController', function($rootScope, $scope, $ionicModal, $ionicActionSheet, $ionicLoading,
                                      Map, WebSocket, Geolocation, Mallpoints, User) {
    var logError = function(error) {
        console.error(error);
    };

    $rootScope.activeUser = {};
    $rootScope.activeUser.username = User.getData().username;

    /*
    ////////////////////////////////////////
    MY MALLPOINTS
    ////////////////////////////////////////
    */
    $ionicModal.fromTemplateUrl('templates/my-mallpoints.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.myMallpointsModal = modal;
    });

    $scope.openMyMallpoints = function() {
        Mallpoints.getAllFromUser(User.getData()).
        then(function(mallpoints) {
            $scope.myMallpoints = mallpoints.data;
            $scope.myMallpointsModal.show();
        })
        .catch(function(data) {
            console.log("not nice");
        });
    };

    $scope.closeMyMallpoints = function() {
        $scope.myMallpointsModal.hide();
    };

    $scope.showOnMap = function(mallpoint) {
        $scope.myMallpointsModal.hide();
        Map.highlight(mallpoint);
    };

    Mallpoints
    .getAllFromUser(User.getData())
    .then(Map.displayMallpoints)
    .catch(logError);

    /*
    ////////////////////////////////////////
    MAP RESOURCE
    ////////////////////////////////////////
    */
    var longClickCallback = function(event) {
        $ionicActionSheet.show({
            buttons: [
                { text: '<i class="icon ion-android-locate assertive"></i>Add on my location' },
                { text: '<i class="icon ion-arrow-graph-down-right assertive"></i>Add at clicked location' }
            ],
            titleText: 'New Mallpoint',
            buttonClicked: function(index) {
                var creationPromise = null;
                switch(index) {
                    case 0: {
                        creationPromise = Mallpoints.create($scope, $scope.userMarker.getLatLng());
                        break;
                    }
                    case 1: {
                        creationPromise = Mallpoints.create($scope, event.latlng);
                        break;
                    }
                }
                creationPromise
                .then(Map.addMallpoint)
                .catch(logError);

                return true;
            }
        });
    };

    $scope.map = Map.create('map');
    $scope.userMarker = Map.createUserMarker();
    $scope.userCircle = Map.createUserCircle();
    Map.onLongClick(longClickCallback);

    /*
    ////////////////////////////////////////
    MALLPOINTS RESOURCE
    ////////////////////////////////////////
    */

    $scope.search = function() {
        Mallpoints
        .tagSearch(this)
        .then(Map.highlightMallpoints)
        .catch(logError);
    };

    $scope.clearSearch = function() {
        Map.clearHighlights();
    };

    /*
    ////////////////////////////////////////
    WEBSOCKETS/GEOLOCATION RESOURCE
    ////////////////////////////////////////
    */
    var updateUserPosition = function(position) {
        var latLng = new L.LatLng(position.coords.latitude, position.coords.longitude);

        User.setLatLng({ lat: position.coords.latitude, lng: position.coords.longitude });

        $scope.userMarker.setLatLng(latLng);
        $scope.userCircle.setLatLng(latLng);
        $scope.map.setView(latLng);

        Mallpoints
        .radiusSearch(latLng, User.getData()._id)
        .then(Map.displayMallpoints)
        .catch(logError);
    };

    Geolocation
    .watchPosition()
    .then(updateUserPosition)
    .catch(logError);

    var onMessageCallback = function(data) {
        console.log(data);
    }

    // WebSocket.init();
    // WebSocket.onMessage(onMessageCallback);
    // WebSocket.startGeofencing($rootScope, 5000);
})

.controller('LogoutController', function($ionicHistory, $state, $rootScope, LocalStorage) {
    $rootScope.logout = function() {
        LocalStorage.clear();
        $ionicHistory.clearCache();
        console.log("storage cleared!");
        $state.go('login');
    };
})

.controller('FavoritesController', function($rootScope, $scope) {
    $scope.camPhoto = $rootScope.takenPhoto;
})

.controller('SettingsController', function($rootScope, $scope) {
    $scope.goOnline = { checked: true, disabled: true };
})

;
