angular.module('mallpoint.controllers', ['ionic'])

.controller('LoginController', function($rootScope, $scope, $state, Authentication, WiFi) {
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
            $rootScope.forceSync = true;
        };
    };

    $scope.serverConfig = function() {
        WiFi.setServerIP($scope);
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

.controller('MapController', function($rootScope, $scope, $ionicModal, $ionicActionSheet, $ionicLoading, $interval,
                                      Map, Geofencing, Geolocation, Mallpoints, User) {
    // This is for the side-menu title
    $rootScope.username = User.getData().username;

    var logError = function(error) {
        console.error(error);
    };

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
    $scope.myMallpointsModal = [];
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
        var  index = $scope.notifications.indexOf(mallpoint);
        if (index !== -1) {
            $scope.notifications.splice(index, 1);
        }

        this.showOnMap(mallpoint, $scope.notificationsModal);
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
                for (var i = 0; i < $scope.favorites.length; i++) {
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

    var tempLatLng = null;

    $scope.userMarker.on('drag', function(evt) {
        tempLatLng = $scope.userMarker.getLatLng();
        console.log(tempLatLng);
    });

    $interval(function() {
        if (tempLatLng !== null) {
            var position = {};
            position.coords = {};
            position.coords.latitude = tempLatLng.lat;
            position.coords.longitude = tempLatLng.lng;
            updateUserPosition(position);
        }
    }, 5000);

    /*
    ////////////////////////////////////////
    MALLPOINTS
    ////////////////////////////////////////
    */
    $scope.search = function() {
        Mallpoints
        .tagSearch(this)
        .then(Map.highlightSearchResults)
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

    Mallpoints
    .getUserFavorites($rootScope.forceSync)
    .then(function(favorites) {
        $scope.favorites = favorites.data;

        return favorites;
    })
    .then(Map.displayMallpoints)
    .catch(logError);

    Mallpoints
    .getAllOwnedByUser($rootScope.forceSync)
    .then(function(mallpoints) {
        $scope.myMallpoints = mallpoints.data;

        return mallpoints;
    })
    .then(Map.displayMallpoints)
    .catch(logError);

    $rootScope.forceSync = false;

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

    var onNewNotifications = function(mallpoints) {
        $scope.notifications = $scope.notifications.concat(mallpoints);
        $scope.$digest();
    }

    Geofencing.init();
    Geofencing.onMessage(onNewNotifications);
    Geofencing.start(5000);
})

.controller('LogoutController', function($ionicHistory, $state, $scope, $window, LocalStorage, Geofencing) {
    $scope.$on( "$ionicView.enter", function(scopes, states) {
        LocalStorage.clear();
        Geofencing.stop();
        $window.location.reload(true);
        $state.go('login');
    });
})

.controller('SettingsController', function($scope, Geofencing, Map, User) {
    $scope.searchCircle = { visible: true, radius: 300 };

    $scope.$on("$ionicView.leave", function() {
        User.setRadius($scope.searchCircle.radius);
        Map.setCircleRadius($scope.searchCircle.radius);
        Map.showCircle($scope.searchCircle.visible);
        Geofencing.setRadius($scope.searchCircle.radius);
    })
})

;
