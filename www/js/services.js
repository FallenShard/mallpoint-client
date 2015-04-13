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

// Camera service
.factory('Camera', function($q) {
    return {
        takePicture: function(params) {
            var deferred = $q.defer();
            navigator.camera.getPicture(
                function(result) {
                    deferred.resolve(result);
                },
                function(error) {
                    deferred.reject(error);
                },
                params);

            return deferred.promise;
        }
    }
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

.factory('Mallpoints', function($http, $ionicPopup, ServerConfig, MapService) {

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
        tagSearch: function(filter) {
            return $http.post(ServerConfig.baseRoute() + "/mallpoints/search", filter);
        },
        uploadPhoto: function(data) {
            return $http.post(ServerConfig.baseRoute() + "/mallpoints/photo", data);
        },
        showConfirmPopup: function($rootScope, $scope, latLng) {
            $scope.mpData = {};
            $scope.mpData.size = 'Shop';
            $ionicPopup.show({
                templateUrl: 'templates/mallpoint-popup.html',
                title: 'Confirm New Mallpoint',
                scope: $scope,
                buttons: [{
                    text: 'OK',
                    type: 'button-assertive',
                    onTap: function(e) {
                        if (!$scope.mpData.name ||
                            !$scope.mpData.type) {
                            e.preventDefault();
                        }
                        else {
                            var mallpoint = {};
                            mallpoint.latitude = latLng.lat;
                            mallpoint.longitude = latLng.lng;
                            mallpoint.name = $scope.mpData.name;
                            mallpoint.type = $scope.mpData.type;
                            mallpoint.tags = $scope.mpData.tags.toString().replace(/\s*\t*,+\s*\t*/g, ",").trim();
                            mallpoint.size = $scope.mpData.size;
                            save(mallpoint, $rootScope.activeUser).
                            success(function() {
                                var icon;
                                if (mallpoint.size === 'Shop')
                                    icon = new L.Icon(MapService.createMarker('shop'));
                                else
                                    icon = new L.Icon(MapService.createMarker('mall'));
                                var marker = new L.marker([mallpoint.latitude, mallpoint.longitude], {
                                    bounceOnAdd: true,
                                    icon: icon
                                }).addTo($scope.map).bindPopup(mallpoint.name);

                                var mpModelView = {};
                                    mpModelView.model = mallpoint;
                                    mpModelView.view = marker;
                                    $rootScope.mallpoints.push(mpModelView);
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

    var createCanvasMarker = function(params) {
        var canvas, context;

        var width = params.width || 40;
        var height = params.height || 40;
        var radius = params.radius || 5;
        var glowSize = params.glowSize || Math.min(width, height) / 5;
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
            context.shadowBlur = glowSize * 1.5;
            context.shadowColor = outlineColor;
        }

        context.strokeStyle = outlineColor;
        context.fillStyle = color;
        context.lineWidth = 2;
        context.fill();

        context.shadowBlur = 0;
        context.stroke();

        context.shadowBlur = 0;

        context.fillStyle = outlineColor;
        context.font = (height / 3) + "px UbuntuTitling";
        var size = context.measureText(text);
        context.fillText(text, width / 2 - size.width / 2, height * 3 / 5);

        return {
            iconUrl: canvas.toDataURL(),
            iconAnchor: [width/2, height/2]
        }
    };

    return {
        addLongTapListener: function(elem, callback) {

            // elem.on('mousedown', function(event) {
            //     console.log("onLeafletMapMouseDown()");
            //
            //     if (angular.isUndefined(longTap.promise)) {
            //         longTap.promise = $timeout(function () {
            //             callback(event);
            //             delete longTap.promise;
            //         }, 1000);
            //     }
            // });
            //
            // elem.on('mouseup', function() {
            //     console.log("onLeafletMapMouseUp()");
            //
            //     longTapCancel();
            // });
            //
            // elem.on('mousemove', function() {
            //     console.log("onLeafletMapMouseMove()");
            //
            //     longTapCancel();
            // });
        },
        createMarker: function(type, params) {
            params = params || {};
            switch(type) {
                case 'mall':
                    params.width = 50;
                    params.height = 50;
                    params.outlineColor = params.outlineColor || 'black';
                    break;
            }
            return createCanvasMarker(params);
        }
    }
})

.search

;
