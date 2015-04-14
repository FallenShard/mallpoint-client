angular.module('mallpoint.services', ['ngResource'])

.factory('Geolocation', function($q) {
    return {
        getCurrentPosition: function(params) {
            var deferred = $q.defer();

            params = params || {};
            params.enableHighAccuracy = params.enableHighAccuracy || true;
            params.maximumAge = params.maximumAge || 3000;
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

            params = params || {};
            params.enableHighAccuracy = params.enableHighAccuracy || true;
            params.maximumAge = params.maximumAge || 3000;
            navigator.geolocation.watchPosition(
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

.factory('Camera', function($q) {
    return {
        takePicture: function(params) {
            var deferred = $q.defer();

            params = params || {};
            params.quality = params.quality || 75;
            params.targetWidth = params.targetWidth || 500;
            params.targetHeight = params.targetHeight || 500;
            params.saveToPhotoAlbum = params.saveToPhotoAlbum || false;
            params.destinationType = params.destinationType || Camera.DestinationType.DATA_URL;
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

.factory('IndexedDB', function($q, $window) {
    return {
        isSupported: function() {
            if ($window.indexedDB !== undefined) {
                console.log("Yay! IndexedDB is supported:)");
            }
        }
    }
})

.factory('WebSocket', function($interval, $timeout, WebSocketConfig) {
    var webSocket = null;
    var connectionToken = -1;
    var intervalPromise = null;

    var messageCallback = null;

    var initPriv = function() {
        if (webSocket)
            webSocket.close();

        webSocket = new WebSocket(WebSocketConfig.baseRoute());

        webSocket.onopen = function(event) {
            // var message = {};
            // message.type = "hello";
            // message.body = "HelloWorld!";
            // webSocket.send(JSON.stringify(message));
        };

        webSocket.onmessage = function(event) {
            var message = JSON.parse(event.data);

            if (messageCallback)
                messageCallback(message);

            switch(message.type) {
                case 'hello':
                    connectionToken = message.token;
                    break;

                case 'mallpoints':
                    console.log(message.mallpoints);
                    break;
            }
        };

        webSocket.onclose = function(event) {
            console.log("Lost connection to the server");
            webSocket = null;
        };

        webSocket.onerror = function(event) {
            console.log("Error in connection!");
            webSocket = null;
            reconnect();
        };
    };

    var reconnect = function() {
        $timeout(function() {
            initPriv();
        }, 10000);
    }

    return {
        init: initPriv,
        onMessage: function(callback) {
            messageCallback = callback;
        },
        send: function(message) {
            webSocket.send(JSON.stringify(message));
        },
        close: function() {
            if (webSocket)
            {
                var message = {};
                message.type = 'remove';
                message.token = connectionToken;
                webSocket.send(JSON.stringify(message));
                webSocket.close();
                webSocket = null;
                connectionToken = -1;
            }
        },
        startGeofencing: function($rootScope, interval) {
            interval = interval || 5000;
            intervalPromise = $interval(function () {
                if ($rootScope.activeUserLatLng)
                {
                    console.log("Geofence message outgoing!");
                    var message = {};
                    message.type = 'data';
                    message.token = connectionToken;
                    message.radius = 0.3;
                    message.coords = $rootScope.activeUserLatLng;
                    webSocket.send(JSON.stringify(message));
                }
            }, interval);
        },
        stopGeofencing: function() {
            $interval.cancel(intervalPromise);
        }
    }
})

.factory('Authentication', function($http, $q, $ionicPopup, ServerConfig, LocalStorage) {
    var user = {};

    var loginSuccess = function(result) {
        // Store this for autologin on next start-ups
        var creds = {};
        creds.email = result.data.email;
        creds.passwordHash = result.data.passwordHash;
        LocalStorage.setObject('credentials', creds);

        user = result.data;
    };

    var showErrorPoup = function(title, template, $scope) {
        var myPopup = $ionicPopup.show({
            title: title,
            scope: $scope,
            template: template,
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

    return {
        login: function($scope) {
            var deferred = $q.defer();

            $http.post(ServerConfig.baseRoute() + "/login", $scope.user)
            .then(function(result) {
                loginSuccess(result);
                deferred.resolve(user);
            })
            .catch(function(reject) {
                showErrorPoup('Invalid Credentials',
                              'Invalid email and/or password provided. Please try again.',
                              $scope);
                deferred.reject("Invalid credentials provided.");
            });

            return deferred.promise;
        },
        autologin: function($scope) {
            var deferred = $q.defer();

            var credentials = LocalStorage.getObject('credentials');

            if (Object.keys(credentials).length > 0) {
                $http.post(ServerConfig.baseRoute() + "/autologin", credentials)
                .then(function(result) {
                    loginSuccess(result);
                    deferred.resolve(user);
                })
                .catch(function(reject) {
                    showErrorPoup('Invalid Credentials',
                                  'Invalid email and/or password provided. Please try again.',
                                  $scope);
                    deferred.reject("Invalid credentials in storage.");
                });
            }
            else
                deferred.reject("No credentials in local storage.");

            return deferred.promise;
        },
        register: function($scope) {
            var deferred = $q.defer();

            var newUser = $scope.newUser;

            if (newUser.password === newUser.repeatPassword) {
                $http.post(ServerConfig.baseRoute() + "/register", newUser)
                .then(function(result) {
                    loginSuccess(result);
                    deferred.resolve(user);
                })
                .catch(function(reject) {
                    showErrorPoup('Failed Registration Login',
                                  'Invalid credentials after registration. Please try again.',
                                  $scope);
                    deferred.reject("Invalid credentials after registration.");
                });
            }
            else {
                showErrorPoup('Invalid Form Input',
                              'Passwords must match!',
                              $scope);
                deferred.reject("Passwords must match.");
            }

            return deferred.promise;
        },
        getUser: function() {
            return user;
        }
    };
})

.factory('Mallpoints', function($http, $q, $ionicPopup, ServerConfig, Authentication, Map) {
    var mallpoints = [];

    var showConfirmPopup = function($scope) {
        var deferred = $q.defer();
        $scope.mpData = {};
        $scope.mpData.size = 'Shop';

        var options = {
            title: 'Confirm New Mallpoint',
            scope: $scope,
            templateUrl: 'templates/mallpoint-popup.html',
            buttons: []
        };

        var cancelButton = {
            text: 'Cancel',
            type: 'button-assertive button-clear',
            onTap: function(e) {
            }
        };

        var confirmButton = {
            text: 'OK',
            type: 'button-assertive',
            onTap: function(e) {
                if (!$scope.mpData.name ||
                    !$scope.mpData.type) {
                    e.preventDefault();
                }
                else {
                    var mallpoint = {};
                    mallpoint.name = $scope.mpData.name;
                    mallpoint.type = $scope.mpData.type;
                    mallpoint.tags = $scope.mpData.tags ? $scope.mpData.tags.toString().replace(/\s*\t*,+\s*\t*/g, ",").trim() : '';
                    mallpoint.size = $scope.mpData.size;
                    return mallpoint;
                }
            }
        };

        options.buttons.push(confirmButton);
        options.buttons.push(cancelButton);

        $ionicPopup.show(options).then(function(result) {
            if (result === undefined)
                deferred.reject('Mallpoint creation canceled.');
            else
                deferred.resolve(result);
        }, function(error) {
                deferred.reject('Mallpoint creation aborted.');
        });

        return deferred.promise;
    };

    var showSearchPopup = function($scope) {
        var deferred = $q.defer();
        $scope.searchFilter = {};

        var options = {
            title: 'Tag Search',
            scope: $scope,
            templateUrl: 'templates/search-popup.html',
            buttons: []
        };

        var okButton = {
            text: 'OK',
            type: 'button-assertive',
            onTap: function(e) {
                if (!$scope.searchFilter.tags && !$scope.searchFilter.size) {
                }
                else {
                    if ($scope.searchFilter.tags)
                        $scope.searchFilter.tags = $scope.searchFilter.tags.toString().replace(/\s*\t*,+\s*\t*/g, ",").trim();

                    return $scope.searchFilter;
                }
            }
        };

        var cancelButton = {
            text: 'Cancel',
            type: 'button-assertive button-clear',
            onTap: function(e) {
            }
        };

        options.buttons.push(okButton);
        options.buttons.push(cancelButton);

        $ionicPopup.show(options).then(function(result) {
            if (result === undefined)
                deferred.reject("Search canceled.");
            else
                deferred.resolve(result);
        }, function(error) {
                deferred.reject("Search canceled.");
        });

        return deferred.promise;
    };

    return {
        getAll: function() {
            var deferred = $q.defer();

            $http.get(ServerConfig.baseRoute() + "/mallpoints")
            .then(function(results) {
                mallpoints = results.data;

                deferred.resolve(mallpoints);
            })
            .catch(function(error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        getAllFromUser: function(user) {
            return $http.post(ServerConfig.baseRoute() + "/mallpoints/user", user);
        },
        tagSearch: function($scope) {
            var deferred = $q.defer();

            showSearchPopup($scope)
            .then(function(filter) {
                $http.post(ServerConfig.baseRoute() + "/mallpoints/search", filter)
                .then(function(result) {
                    deferred.resolve(result.data);
                })
                .catch(function(error) {
                    deferred.reject(error);
                });
            })
            .catch(function(error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        uploadPhoto: function(data) {
            var deferred = $q.defer();

            $http.post(ServerConfig.baseRoute() + "/mallpoints/photo", { imgData: data })
            .then(function(result) {
                deferred.resolve(result.data);
            })
            .catch(function(error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        create: function($scope, latLng) {
            var deferred = $q.defer();

            showConfirmPopup($scope)
            .then(function(mallpoint) {
                mallpoint.latitude = latLng.lat;
                mallpoint.longitude = latLng.lng;
                mallpoint.userId = Authentication.getUser()._id;

                $http.post(ServerConfig.baseRoute() + "/mallpoints/create", mallpoint)
                .then(function(result) {
                    deferred.resolve(result.data);
                })
                .catch(function(error) {
                    deferred.reject(error);
                });
            })
            .catch(function(error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }
    }
})

.factory('Map', function($timeout) {
    var map = null;
    var mapLayer = null;
    var userMarker = null;
    var markers = [];
    var iconCache = {};

    var createCanvasIcon = function(params) {
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
            iconAnchor: [width / 2, height / 2]
        }
    };

    return {
        create: function(domElement, params) {
            map = new L.Map(domElement);

            params = params || {};
            params.url = params.url || 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            params.attrib = params.attrib || 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors';
            params.minZoom = params.minZoom || 8;
            params.maxZoom = params.maxZoom || 18;
            params.zoom = params.zoom || 16;

            mapLayer = new L.TileLayer(params.url, {
                minZoom: params.minZoom,
                maxZoom: params.maxZoom,
                attribution: params.attrib
            });

            map.addLayer(mapLayer);
            map.setZoom(params.zoom);

            iconCache.shop = new L.Icon(createCanvasIcon({}));
            iconCache.shopFaded = new L.Icon(createCanvasIcon({ outlineColor:'rgba(204, 51, 0, 0.3)', color:'rgba(255, 255, 255, 0.3)'}));
            iconCache.mall = new L.Icon(createCanvasIcon({ width: 50, height: 50, color: '#CC3300', outlineColor: 'white' }));
            iconCache.mallFaded = new L.Icon(createCanvasIcon({ width: 50, height: 50, color:'rgba(204, 51, 0, 0.3)', outlineColor:'rgba(255, 255, 255, 0.3)'}));

            return map;
        },
        displayMallpoints: function(mallpoints) {
            var shopIcon = iconCache.shop;
            var mallIcon = iconCache.mall;

            markers = [];
            for (var i = 0; i < mallpoints.length; i++) {

                var marker = {};
                marker.model = mallpoints[i];
                marker.view = new L.marker([mallpoints[i].latitude, mallpoints[i].longitude], {
                    bounceOnAdd: true,
                    icon: mallpoints[i].size === 'Shop' ? shopIcon : mallIcon
                }).addTo(map).bindPopup(mallpoints[i].name);

                markers.push(marker);
            }
        },
        addMallpoint: function(mallpoint) {
            var marker = {};
            marker.model = mallpoint;
            marker.view = new L.marker([mallpoint.latitude, mallpoint.longitude], {
                bounceOnAdd: true,
                icon: iconCache[mallpoint.size.toLowerCase()]
            }).addTo(map).bindPopup(mallpoint.name);

            markers.push(marker);
        },
        highlightMallpoints: function(mallpoints) {
            for (var i = 0; i < markers.length; i++) {
                markers[i].view.setIcon(iconCache[markers[i].model.size.toLowerCase() + "Faded"]);

                for (var k = 0; k < mallpoints.length; k++) {
                    if (mallpoints[k]._id === markers[i].model._id) {
                        markers[i].view.setIcon(iconCache[markers[i].model.size.toLowerCase()]);
                    }
                }
            }
        },
        onLongClick: function(callback) {
            map.on('contextmenu', function(event) {
                callback(event);
            });
        },
        getMarkerIcon: function(type) {
            return iconCache[type];
        },
        createUserMarker: function() {
            userMarker = new L.marker([0, 0]).addTo(map).bindPopup('My Location!');
            userMarker.setZIndexOffset(999);

            return userMarker;
        }
    }
})

;
