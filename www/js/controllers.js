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
    .catch(logError);
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
                                      Map, Geofencing, Geolocation, Mallpoints, User) {
    var logError = function(error) {
        console.error(error);
    };

    $rootScope.username = User.getData().username;

    /*
    ////////////////////////////////////////
    MODAL COMMON
    ////////////////////////////////////////
    */
    $scope.openModal = function(modal) {
        modal.show();
    };

    $scope.closeModal = function(modal) {
        modal.hide();
    };

    $scope.showOnMap = function(mallpoint, modal) {
        modal.hide();
        Map.highlight(mallpoint);
    };

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

    /*
    ////////////////////////////////////////
    FAVORITES
    ////////////////////////////////////////
    */
    $scope.favorites = [];

    $ionicModal.fromTemplateUrl('templates/favorites.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.favoritesModal = modal;
    });

    /*
    ////////////////////////////////////////
    NOTIFICATIONS
    ////////////////////////////////////////
    */
    $scope.notifications = [];

    $ionicModal.fromTemplateUrl('templates/notifications.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        $scope.notificationsModal = modal;
    });

    $scope.consumeNotification = function(mallpoint) {
        $scope.notificationsModal.hide();
        var  index = $scope.notifications.indexOf(mallpoint);
        if (index !== -1) {
            $scope.notifications.splice(index, 1);
        }

        Map.highlight(mallpoint);
    };

    $scope.dismissNotification = function(index) {
        $scope.notifications.splice(index, 1);
    };

    /*
    ////////////////////////////////////////
    MAP
    ////////////////////////////////////////
    */
    var longClickCallback = function(event) {

        var addToScope = function(mallpoint) {
            $scope.myMallpoints.push(mallpoint);
        };
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
                .then(Map.addMarker)
                .then(addToScope)
                .catch(logError);

                return true;
            }
        });
    };

    var markerClickCallback = function(op, mallpoint) {
        switch(op) {
            case 'add': {
                $scope.favorites.push(mallpoint);
                return;
            }

            case 'remove': {
                for (var i = 0; i < $scope.favorites; i++) {
                    if ($scope.favorites[i]._id.toString() === mallpoint._id.toString()) {
                        $scope.favorites.splice(i, 1);
                        return;
                    }
                }
            }
        }
    };

    $scope.map = Map.create('map');
    $scope.userMarker = Map.createUserMarker();
    $scope.userCircle = Map.createUserCircle();
    Map.onLongClick(longClickCallback);
    Map.onMarkerClick(markerClickCallback);

    /*
    ////////////////////////////////////////
    MALLPOINTS
    ////////////////////////////////////////
    */
    Mallpoints
    .getUserFavorites()
    .then(function(favorites) {
        $scope.favorites = favorites.data;
        Map.displayMallpoints(favorites);
    })
    .catch(logError);

    Mallpoints
    .getAllOwnedByUser()
    .then(function(owned) {
        $scope.myMallpoints = owned.data;
        Map.displayMallpoints(owned);
    })
    .catch(logError);

    $scope.search = function() {
        Mallpoints
        .tagSearch(this)
        .then(Map.highlightMallpoints)
        .catch(logError);
    };

    $scope.clearSearch = function() {
        Map.clearHighlights();
    };

    $scope.sync = function() {
        Mallpoints
        .getUserFavorites(true)
        .then(function(favorites) {
            $scope.favorites = favorites.data;

            return favorites;
        })
        .then(Map.displayMallpoints)
        .catch(logError);

        Mallpoints
        .getAllOwnedByUser(true)
        .then(function(mallpoints) {
            $scope.myMallpoints = mallpoints.data;

            return mallpoints;
        })
        .then(Map.displayMallpoints)
        .catch(logError);

        $scope.notifications = [];

        Mallpoints
        .getAllInUserRadius()
        .then(Map.displayMallpoints)
        .catch(logError);
    };

    /*
    ////////////////////////////////////////
    GEOFENCING
    ////////////////////////////////////////
    */
    var updateUserPosition = function(position) {
        var latLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
        User.setLatLng({ lat: position.coords.latitude, lng: position.coords.longitude });

        $scope.userMarker.setLatLng(latLng);
        $scope.userCircle.setLatLng(latLng);
        $scope.map.setView(latLng);

        Mallpoints
        .getAllInUserRadius()
        .then(Map.displayMallpoints)
        .catch(logError);
    };

    Geolocation
    .watchPosition()
    .then(updateUserPosition)
    .catch(logError);

    $scope.notifButton = document.getElementById("notif-button");

    var onNewNotifications = function(mallpoints) {
        $scope.notifications = $scope.notifications.concat(mallpoints);
        $scope.$digest();
    }

    Geofencing.init();
    Geofencing.onMessage(onNewNotifications);
    Geofencing.start(5000);
})

.controller('LogoutController', function($ionicHistory, $state, $rootScope, LocalStorage) {
    LocalStorage.clear();
    $ionicHistory.clearCache();
    $ionicHistory.clearHistory();
    console.log("storage cleared!");
    $state.go('login');
})

.controller('SettingsController', function($rootScope, $scope) {
    $scope.goOnline = { checked: true, disabled: true };
})

;
