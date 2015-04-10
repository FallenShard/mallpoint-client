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

.controller('MapController', function($scope, $rootScope, $ionicActionSheet, GoogleMaps, $ionicPopup, $ionicLoading, $timeout, Geolocation, Mallpoints) {

    var mapOptions = {
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

    Mallpoints.getAll().
    success(function(data, status, headers, config) {

        $rootScope.mallpoints = [];
        for (var i = 0; i < data.length; i++) {

            var mallpoint = {};
            mallpoint.model = data[i];
            mallpoint.view = new google.maps.Marker({
                position: new google.maps.LatLng(data[i].latitude, data[i].longitude),
                animation: google.maps.Animation.DROP,
                map: $scope.map,
                title: data[i].title
            });

            $rootScope.mallpoints.push(mallpoint);
        }
    }).
    error(function(data, status, headers, config) {
        console.error("Failed to load mallpoints :(");
    });


    GoogleMaps.addLongTapListener($scope.map, function(latLng) {
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
                        $scope.mpData = {};
                        $scope.mpData.type = 'Shop';
                        var mpPopup = $ionicPopup.show({
                            templateUrl: 'templates/mallpoint-popup.html',
                            title: 'Confirm New Mallpoint',
                            scope: $scope,
                            buttons: [{
                                    text: 'OK',
                                    type: 'button-assertive',
                                    onTap: function(e) {
                                        if (!$scope.mpData.name) {
                                            e.preventDefault();
                                        }
                                        else {
                                            var mallpoint = {};
                                            mallpoint.latitude = $rootScope.activeUserLatLng.lat();
                                            mallpoint.longitude = $rootScope.activeUserLatLng.lng();
                                            mallpoint.name = $scope.mpData.name;
                                            mallpoint.type = $scope.mpData.type;
                                            Mallpoints.save(mallpoint, $rootScope.activeUser).
                                            success(function() {
                                                var marker = new google.maps.Marker({
                                                    position: new google.maps.LatLng(mallpoint.latitude, mallpoint.longitude),
                                                    animation: google.maps.Animation.DROP,
                                                    map: $scope.map,
                                                    title: mallpoint.name
                                                });
                                                var mpModelView = {};
                                                mpModelView.model = mallpoint;
                                                mpModelView.view = marker;
                                                $rootScope.mallpoints.push(mpModelView);
                                            })
                                        }
                                    }
                                },
                                {
                                    text: 'Cancel',
                                    type: 'button-assertive button-clear',
                                    onTap: function(e) {

                                    }
                                }]
                          });
                        delete $scope.placeMarkerPromise;
                        break;
                    }
                    case 1: {
                        var mallpoint = {};
                        mallpoint.latitude = latLng.lat();
                        mallpoint.longitude = latLng.lng();
                        mallpoint.name = "At Click Marker!";
                        Mallpoints.save(mallpoint, $rootScope.activeUser).
                        success(function() {
                            var marker = new google.maps.Marker({
                                position: latLng,
                                animation:	google.maps.Animation.DROP,
                                map: $scope.map,
                                title: "A new Marker!"});
                            console.log("Nice, new marker at loc");
                        }).
                        error(function() {
                        });
                        delete $scope.placeMarkerPromise;
                        break;
                    }
                }
               return true;
           }
        });
    });

    // google.maps.event.addListener($scope.map, "mousedown", function(event) {
    //     console.log("onGoogleMapsMouseDown()");
    //
    //     if (angular.isUndefined($scope.placeMarkerPromise)) {
    //         $scope.placeMarkerPromise = $timeout(function () { $scope.placeMarker(event.latLng); }, 1000);
    //     }
    // });
    //
    // google.maps.event.addListener($scope.map, "mouseup", function() {
	//     console.log("onGoogleMapsMouseUp()");
    //
	//     $scope.placeMarkerCancel();
	// });
    //
	// google.maps.event.addListener($scope.map, "dragstart", function () {
	//     console.log("onGoogleMapsDragStart()");
    //
	//     $scope.placeMarkerCancel();
    // });
    //
    // $scope.placeMarker = function(latLng) {
    //     console.log("Long click!");
    //     var hideSheet = $ionicActionSheet.show({
    //         buttons: [
    //             { text: '<i class="icon ion-android-locate assertive"></i>Add on my location' },
    //             { text: '<i class="icon ion-arrow-graph-down-right assertive"></i>Add at clicked location' }
    //         ],
    //         titleText: 'New mallpoint',
    //         cancelText: 'Cancel',
    //         cancel: function() {
    //             // add cancel code..
    //         },
    //         buttonClicked: function(index) {
    //             switch(index) {
    //                 case 0: {
    //
    //                     $scope.mpData = {};
    //                     $scope.mpData.type = 'Shop';
    //
    //                     var mpPopup = $ionicPopup.show({
    //                         templateUrl: 'templates/mallpoint-popup.html',
    //                         title: 'Confirm New Mallpoint',
    //                         scope: $scope,
    //                         buttons: [
    //                             {
    //                                 text: 'OK',
    //                                 type: 'button-assertive',
    //                                 onTap: function(e) {
    //                                     if (!$scope.mpData.name) {
    //                                         e.preventDefault();
    //                                     }
    //                                     else {
    //                                         var mallpoint = {};
    //                                         mallpoint.latitude = $rootScope.activeUserLatLng.lat();
    //                                         mallpoint.longitude = $rootScope.activeUserLatLng.lng();
    //                                         mallpoint.name = $scope.mpData.name;
    //                                         mallpoint.type = $scope.mpData.type;
    //                                         Mallpoints.save(mallpoint, $rootScope.activeUser).
    //                                         success(function() {
    //                                             var marker = new google.maps.Marker({
    //                                                 position: new google.maps.LatLng(mallpoint.latitude, mallpoint.longitude),
    //                                                 animation: google.maps.Animation.DROP,
    //                                                 map: $scope.map,
    //                                                 title: mallpoint.name
    //                                             });
    //
    //                                             var mpModelView = {};
    //                                             mpModelView.model = mallpoint;
    //                                             mpModelView.view = marker;
    //                                             $rootScope.mallpoints.push(mpModelView);
    //                                         })
    //                                     }
    //                                 }
    //                             }
    //                         ]
    //                       });
    //
    //                     delete $scope.placeMarkerPromise;
    //                     break;
    //                 }
    //                 case 1: {
    //                     var mallpoint = {};
    //                     mallpoint.latitude = latLng.lat();
    //                     mallpoint.longitude = latLng.lng();
    //                     mallpoint.name = "At Click Marker!";
    //                     Mallpoints.save(mallpoint, $rootScope.activeUser).
    //                     success(function() {
    //                         var marker = new google.maps.Marker({
    //                             position: latLng,
    //                             animation:	google.maps.Animation.DROP,
    //                             map: $scope.map,
    //                             title: "A new Marker!"});
    //                         console.log("Nice, new marker at loc");
    //                     }).
    //                     error(function() {
    //
    //                     });
    //
    //                     delete $scope.placeMarkerPromise;
    //                     break;
    //                 }
    //             }
    //
    //            return true;
    //        }
    //    });
    // }
    //
    // $scope.placeMarkerCancel = function() {
	//     if (angular.isUndefined($scope.placeMarkerPromise))
	// 	    return;
    //
	// 	$timeout.cancel($scope.placeMarkerPromise);
	// 	delete $scope.placeMarkerPromise;
	// };

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
