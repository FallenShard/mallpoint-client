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
        console.log(status);
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

.controller('RegisterController', function($state, $scope, $ionicPopup, Authentication) {

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

.controller('DebugController', function($scope, $timeout, Geolocation) {



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

.controller('MapController', function($scope, $interval, $ionicNavBarDelegate, $rootScope, $ionicPopup, $ionicActionSheet, MapService, $ionicPopup, $ionicLoading, $timeout, Geolocation, Mallpoints) {

    // No click handler on this
    $scope.takePictureNotAccessible = function() {
        navigator.camera.getPicture(function(imageURI) {
        // imageURI is the URL of the image that we can use for
        // an <img> element or backgroundImage.

        var imgId = document.getElementById("myTestImage");
        console.log(imgId);

        imgId.src = "data:image/jpeg;base64," + imageURI;

        Mallpoints.uploadPhoto({ data: imageURI}).
        success(function (data) {
            $ionicLoading.show({ template: "it worked!", noBackdrop: true, duration: 1000 });
            var elem = document.getElementById("debug");
            elem.innerHTML = "SUCCESS";
        }).
        error(function (data) {
            $ionicLoading.show({ template: "it failed!", noBackdrop: true, duration: 1000 });
            var elem = document.getElementById("debug");
            elem.innerHTML = "FAIL";
        });

        }, function(err) {

        // Ruh-roh, something bad happened
        var elem = document.getElementById("debug");
        elem.innerHTML = "BIG FAIL";

    }, {quality: 75,
      targetWidth: 500,
      targetHeight: 500,
      saveToPhotoAlbum: false,
      destinationType: Camera.DestinationType.DATA_URL});
    };

    $scope.search = function() {
        $scope.searchFilter = {};
        $ionicPopup.show({
            templateUrl: 'templates/search-popup.html',
            title: 'Tag Search',
            scope: $scope,
            buttons: [{
                text: 'OK',
                type: 'button-assertive',
                onTap: function(e) {
                    if (!$scope.searchFilter.tags &&
                        !$scope.searchFilter.size) {
                    }
                    else {
                        if ($scope.searchFilter.tags)
                            $scope.searchFilter.tags = $scope.searchFilter.tags.toString().replace(/\s*\t*,+\s*\t*/g, ",").trim();

                        Mallpoints.tagSearch($scope.searchFilter).
                        success(function (data) {

                            var shopIconFaded = new L.Icon(MapService.createMarker('shop', { outlineColor:'rgba(204, 51, 0, 0.2)', color:'rgba(255, 255, 255, 0.2)'}));
                            var mallIconFaded = new L.Icon(MapService.createMarker('mall', { outlineColor:'rgba(0, 0, 0, 0.2)', color:'rgba(255, 255, 255, 0.2)'}));
                            var shopIcon = new L.Icon(MapService.createMarker('shop'));
                            var mallIcon = new L.Icon(MapService.createMarker('mall'));

                            var rootDataLength = $rootScope.mallpoints.length;
                            for (var i = 0; i < rootDataLength; i++) {

                                var size = $rootScope.mallpoints[i].model.size;
                                if (size === 'Shop')
                                    $rootScope.mallpoints[i].view.setIcon(shopIconFaded);
                                else
                                    $rootScope.mallpoints[i].view.setIcon(mallIconFaded);

                                for (var j = 0; j < data.length; j++) {
                                    if (data[j]._id === $rootScope.mallpoints[i].model._id) {
                                        if (size === 'Shop')
                                            $rootScope.mallpoints[i].view.setIcon(shopIcon);
                                        else
                                            $rootScope.mallpoints[i].view.setIcon(mallIcon);
                                    }
                                }
                            }
                        }).
                        error(function (data) {
                            console.error("Bad stuff");
                        });
                    }
                }
            },
            {
                text: 'Cancel',
                type: 'button-assertive button-clear',
                onTap: function(e) {
                }
            }]
        })
    };

    $scope.map = new L.Map('map');
    var osmUrl='http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
	var osmAttrib='Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
	var osm = new L.TileLayer(osmUrl, {minZoom: 8, maxZoom: 18, attribution: osmAttrib});

    $scope.map.addLayer(osm);
    $scope.map.setZoom(16);

    $scope.userMarker = new L.marker([0, 0]).addTo($scope.map).bindPopup("My location!");
    $scope.userMarker.setZIndexOffset(999);

    Mallpoints.getAll().
    success(function(data, status, headers, config) {

        var shopIcon = new L.Icon(MapService.createMarker('shop'));
        var mallIcon = new L.Icon(MapService.createMarker('mall'));

        $rootScope.mallpoints = [];
        for (var i = 0; i < data.length; i++) {

            var mallpoint = {};
            mallpoint.model = data[i];
            mallpoint.view = new L.marker([data[i].latitude, data[i].longitude], {
                bounceOnAdd: true,
                icon: data[i].size === 'Shop' ? shopIcon : mallIcon
            }).addTo($scope.map).bindPopup(data[i].name);

            $rootScope.mallpoints.push(mallpoint);
        }
    }).
    error(function(data, status, headers, config) {
        console.error("Failed to load mallpoints :(");
    });

    $scope.map.on('contextmenu', function(event) {
        var hideSheet = $ionicActionSheet.show({
            buttons: [
                { text: '<i class="icon ion-android-locate assertive"></i>Add on my location' },
                { text: '<i class="icon ion-arrow-graph-down-right assertive"></i>Add at clicked location' }
            ],
            titleText: 'New Mallpoint',
            buttonClicked: function(index) {
                switch(index) {
                    case 0: {
                        Mallpoints.showConfirmPopup($rootScope, $scope, $scope.userMarker.getLatLng());
                        break;
                    }
                    case 1: {
                        Mallpoints.showConfirmPopup($rootScope, $scope, event.latlng);
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
        var latLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
        $rootScope.activeUserLatLng = {};
        $rootScope.activeUserLatLng.lat = position.coords.latitude;
        $rootScope.activeUserLatLng.lng = position.coords.longitude;

        $scope.userMarker.setLatLng(latLng);
        $scope.map.setView(latLng);
    };

    var errorCallback = function(error) {
        // error
    };

    $scope.debug = {};
    $scope.ws = new WebSocket("ws://192.168.0.12:5001");
    $scope.ws.onopen = function(){
        console.log("Registering on the server...");

        $scope.ws.send("Hello!");
    };

    $scope.ws.onmessage = function(event) {
        console.log("Client received " + event.data);

        if (event.data)
            $ionicLoading.show({ template: event.data, noBackdrop: true, duration: 1000 });
    };

    $scope.ws.onclose = function(event) {
        console.log("CLOSING MAH SOCKATZ");
        var message = {};
        message.type = "remove";
        message.username = $rootScope.activeUser.username;

        $scope.ws.send(JSON.stringify(message));
    }

    $interval(function () {
        if ($scope.activeUserLatLng)
        {
            var userData = {};
            userData.username = $rootScope.activeUser.username;
            userData.coords = $rootScope.activeUserLatLng;
            $scope.ws.send(JSON.stringify(userData));
        }

    }, 5000);

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

.controller('FavoritesController', function($rootScope, $scope) {
    $scope.camPhoto = $rootScope.takenPhoto;
})

;
