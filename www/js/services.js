angular.module('mallpoint.services', ['ngResource'])

// Geolocation service
.factory('Geolocation', function($q) {
    return {
        getCurrentPosition: function(params) {
            var deferred = $q.defer();
            navigator.geolocation.getCurrentPosition(
                function(result) {
                    deferred.resolve(result);
                },
                function(error) {
                    deferred.reject(error);
                },
                params);

            return deferred.promise;
        },
        watchPosition: function(params) {
            var deferred = $q.defer();
            navigator.geolocation.getCurrentPosition(
                function(result) {
                    deferred.resolve(result);
                },
                function(error) {
                    deferred.reject(error);
                },
                params);

            return deferred.promise;
        }
    };
})

// LocalStorage service
.factory('LocalStorage', function($window) {
    return {
        set: function(key, value) {
            $window.localStorage[key] = value;
        },
        get: function(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function(key) {
            return JSON.parse($window.localStorage[key] || '{}');
        },
        clear: function() {
            $window.localStorage.clear();
        }
    };
})

.factory('Authentication', function($http, ServerConfig) {
    return {
        login: function(credentials) {
            return $http.post(ServerConfig.baseRoute() + "/login", credentials);
        },
        autologin: function(credentials) {
            return $http.post(ServerConfig.baseRoute() + "/autologin", credentials);
        },
        register: function(userData) {
            return $http.post(ServerConfig.baseRoute() + "/register", userData);
        }
    };
})

.factory('Mallpoints', function($http, $ionicPopup, ServerConfig) {

    var save = function(mallpoint, user) {
        mallpoint.userId = user._id;
        return $http.post(ServerConfig.baseRoute() + "/mallpointcreate", mallpoint);
    };

    return {
        getAll: function() {
            return $http.get(ServerConfig.baseRoute() + "/mallpoints");
        },
        getAllFromUser: function(user) {
            return $http.post(ServerConfig.baseRoute() + "/mallpoints/user", user);
        },
        showConfirmPopup: function($rootScope, $scope, latLng) {
            $scope.mpData = {};
            $scope.mpData.type = 'Shop';
            $ionicPopup.show({
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
                            mallpoint.latitude = latLng.lat();
                            mallpoint.longitude = latLng.lng();
                            mallpoint.name = $scope.mpData.name;
                            mallpoint.type = $scope.mpData.type;
                            save(mallpoint, $rootScope.activeUser).
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
            })
        }
    }
})

.factory('MapService', function($timeout) {

    var longTap = {};

    var longTapCancel = function() {
        if (angular.isUndefined(longTap.promise))
            return;

        $timeout.cancel(longTap.promise);
        delete longTap.promise;
    };

    var createShopMarker = function(params) {
        var canvas, context;

        var width = params.width || 30;
        var height = params.height || 30;
        var radius = params.radius || 5;
        var glowSize = params.glowSize || 2;
        var color = params.color || 'white';
        var outlineColor = params.outlineColor || '#CC3300';
        var text = params.text || 'mp';

        canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        context = canvas.getContext("2d");
        context.clearRect(0, 0, width, height);

        context.beginPath();
        context.moveTo(radius + glowSize, glowSize);
        context.lineTo(width - radius - glowSize, glowSize);
        context.quadraticCurveTo(width - glowSize, glowSize, width - glowSize, radius + glowSize);
        context.lineTo(width - glowSize, height - radius - glowSize);
        context.quadraticCurveTo(width - glowSize, height - glowSize, width - radius - glowSize, height - glowSize);
        context.lineTo(radius + glowSize, height - glowSize);
        context.quadraticCurveTo(glowSize, height - glowSize, glowSize, height - radius - glowSize);
        context.lineTo(glowSize, radius + glowSize);
        context.quadraticCurveTo(glowSize, glowSize, radius + glowSize, glowSize);
        context.closePath();

        if (glowSize > 0) {
            context.shadowBlur = glowSize;
            context.shadowColor = outlineColor;
        }

        context.strokeStyle = outlineColor;
        context.fillStyle = color;
        context.lineWidth = 2;
        context.fill();
        context.stroke();

        context.fillStyle = outlineColor;
        context.font = (height / 2) + "px UbuntuTitling";
        var size = context.measureText(text);
        context.fillText(text, width / 2 - size.width / 2, height * 3 / 5);

        return canvas.toDataURL();
    };

    var createMallMarker = function(params) {
        var canvas, context;

        var radius = params.radius || 20;
        var glowSize = params.glowSize || 2;
        var color = params.color || 'white';
        var outlineColor = params.outlineColor || '#CC3300';
        var text = params.text || 'MP';

        canvas = document.createElement("canvas");
        canvas.width = radius * 2;
        canvas.height = radius * 2;
        var height = canvas.height;
        var width = canvas.width;

        context = canvas.getContext("2d");
        context.clearRect(0, 0, width, height);

        context.beginPath();
        context.arc(radius, radius, radius - 2, 0, 2 * Math.PI);

        if (glowSize > 0) {
            context.shadowBlur = glowSize;
            context.shadowColor = outlineColor;
        }

        context.strokeStyle = outlineColor;
        context.lineWidth = 2;
        context.fillStyle = color;
        context.fill();
        context.stroke();

        context.fillStyle = outlineColor;
        context.font = (height / 2) + "px UbuntuTitling";
        var size = context.measureText(text);
        context.fillText(text, width / 2 - size.width / 2, height * 6.5 / 10);

        return canvas.toDataURL();
    };

    return {
        addLongTapListener: function(elem, callback) {
            google.maps.event.addListener(elem, "mousedown", function(event) {
                console.log("onGoogleMapsMouseDown()");

                if (angular.isUndefined(longTap.promise)) {
                    longTap.promise = $timeout(function () {
                        callback(event);

                        delete longTap.promise;
                        }, 1000);
                }
            });

            google.maps.event.addListener(elem, "mouseup", function() {
        	    console.log("onGoogleMapsMouseUp()");

                longTapCancel();
        	});

        	google.maps.event.addListener(elem, "dragstart", function () {
        	    console.log("onGoogleMapsDragStart()");

                longTapCancel();
            });
        },
        createMarker: function(type, params) {
            params = params || {};
            switch(type) {
                case 'shop':
                    return createShopMarker(params);
                    break;

                case 'mall':
                    return createMallMarker(params);
                    break;

                default:
                    params.width = 25;
                    params.height = 25;
                    params.radius = 4;
                    params.color = "black";
                    return createShopMarker(params);
            }
        }

    }
})

.factory('MarkerFactory', function($window) {

    return {
        createMarker: function(width, height, radius, color) {
            var canvas, context;

            canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            //
            context = canvas.getContext("2d");
            //
            context.clearRect(0,0,width,height);

            // background is yellow
            context.fillStyle = "white";
            //
            // border is black
            context.strokeStyle = color;

            context.shadowBlur = 2;
            context.shadowColor = color;
            context.beginPath();
            context.moveTo(radius + 2, 2);
            context.lineTo(width - radius - 2, 2);
            context.quadraticCurveTo(width - 2, 2, width - 2, radius + 2);
            context.lineTo(width - 2, height - radius - 2);
            context.quadraticCurveTo(width - 2, height - 2, width - radius - 2, height - 2);
            context.lineTo(radius + 2, height - 2);
            context.quadraticCurveTo(2, height - 2, 2, height - radius - 2);
            context.lineTo(2, radius - 2);
            context.quadraticCurveTo(2, 2, radius + 2, 2);
            context.closePath();

            context.fill();
            context.stroke();

            context.fillStyle = color;
            context.font="12px UbuntuTitling";
            context.fillText("mp", 4, 15);
            //
            return canvas.toDataURL();
        }
    }
})

;
