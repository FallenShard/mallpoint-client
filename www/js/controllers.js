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
        $scope.showLoginError = true;
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

.controller('MapController', function($scope, $rootScope, $ionicActionSheet, $ionicLoading, $timeout, Geolocation, Mallpoints) {

    Mallpoints.getAll().
    success(function(data, status, headers, config) {
        console.log("Cool stuff");
        console.log(data);
    }).
    error(function(data, status, headers, config) {
        console.error("Failed to load mallpoints :(");
    });

    var mapOptions = {
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

    google.maps.event.addListener($scope.map, "mousedown", function(event) {
        console.log("onGoogleMapsMouseDown()");

        if (angular.isUndefined($scope.placeMarkerPromise)) {
            $scope.placeMarkerPromise = $timeout(function () { $scope.placeMarker(event.latLng); }, 1000);
        }
    });

    google.maps.event.addListener($scope.map, "mouseup", function() {
	    console.log("onGoogleMapsMouseUp()");

	    $scope.placeMarkerCancel();
	});

	google.maps.event.addListener($scope.map, "dragstart", function () {
	    console.log("onGoogleMapsDragStart()");

	    $scope.placeMarkerCancel();
    });

    $scope.placeMarker = function(latLng) {
        console.log("Long click!");
        var hideSheet = $ionicActionSheet.show({
            buttons: [
                { text: '<i class="icon ion-android-locate assertive"></i>Add on my location' },
                { text: '<i class="icon ion-arrow-graph-down-right assertive"></i>Add at clicked location' }
            ],
            titleText: 'New mallpoint',
            cancelText: 'Cancel',
            cancel: function() {
                // add cancel code..
            },
            buttonClicked: function(index) {
                switch(index) {
                    case 0: {
                        var marker = new google.maps.Marker({
                            position: $rootScope.activeUserLatLng,
                            animation:	google.maps.Animation.DROP,
                            map: $scope.map,
                            title: "A new marker on user!"});

                        var mallpoint = {};
                        mallpoint.latitude = $rootScope.activeUserLatLng.lat();
                        mallpoint.longitude = $rootScope.activeUserLatLng.lng();
                        mallpoint.name = "Lel whut";
                        Mallpoints.save(mallpoint, $rootScope.activeUser).
                        success(function() {
                            console.log("Nice! :D");
                        }).
                        error(function() {
                            console.error("Not nice! :(");
                        });

                        delete $scope.placeMarkerPromise;
                        break;
                    }
                    case 1: {
                        var marker = new google.maps.Marker({
                            position: latLng,
                            animation:	google.maps.Animation.DROP,
                            map: $scope.map,
                            title: "A new Marker!"});

                        delete $scope.placeMarkerPromise;
                        break;
                    }
                }

               return true;
           }
       });
    }

    $scope.placeMarkerCancel = function() {
	    if (angular.isUndefined($scope.placeMarkerPromise))
		    return;

		$timeout.cancel($scope.placeMarkerPromise);
		delete $scope.placeMarkerPromise;
	};

    var gpsParams = {};
    gpsParams.enableHighAccuracy = true;
    gpsParams.maximumAge = 3000;

    var showPosition = function(position) {
        var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        $rootScope.activeUserLatLng = latLng;

        if (!$scope.myMarker) {
            $scope.myMarker = new google.maps.Marker({
                position: latLng,
                map: $scope.map,
                title: "My location!"
            });
        }
        else {
            $scope.myMarker.setPosition(latLng);
        }

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


;
