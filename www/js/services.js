angular.module('mallpoint.services', [])

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

.factory('WiFi', function($ionicPlatform, $ionicPopup, $q) {
    var checkConnection = function() {
        if (!navigator.connection)
            return true;
        else if (navigator.connection.type === Connection.NONE)
            return false;
        else
            return true;
    };

    return {
        isActive: function($scope) {
            var deferred = $q.defer();

            $ionicPlatform.ready(function() {
                var isActive = checkConnection();
                if (isActive) {
                    deferred.resolve(isActive);
                }

                else {
                    deferred.reject($scope);
                }
            });

            return deferred.promise;
        },
        showNoWifiPopup: function($scope) {
            var myPopup = $ionicPopup.show({
                title: 'No Connection Detected',
                scope: $scope,
                template: 'No active internet connection has been detected. Please turn on your network connection and try again.',
                buttons: [
                    {
                        text: 'OK',
                        type: 'button-assertive',
                        onTap: function() {
                        }
                    }
                ]
            });
        }
    };
})

.factory('IndexedDB', function($q, $window) {

    var dbName = "Mallpoints";
    var db = null;

    var openPriv = function() {
        var deferred = $q.defer();

        if (db) {
            deferred.resolve(db);
        }
        else {
            var request = $window.indexedDB.open(dbName, 3);
            request.onsuccess = function(e) {
                db = e.target.result;
                deferred.resolve(db);
            }
            request.onerror = function(e) {
                deferred.reject("Error opening the database!");
            }
            request.onupgradeneeded = function(e) {
                console.log("Performing one-time setup!");
                var thisDb = e.target.result;

                if (!thisDb.objectStoreNames.contains("mallpoints")) {
                    var mpObjectStore = thisDb.createObjectStore("mallpoints", { keyPath: "_id"});
                    mpObjectStore.createIndex("name", "name", { unique: false });
                    mpObjectStore.transaction.oncomplete = function(e) {
                        console.log('Object store "mallpoints" created!');
                    }
                }

                if (!thisDb.objectStoreNames.contains("favorites")) {
                    var favObjectStore = thisDb.createObjectStore("favorites", { keyPath: "_id"});
                    favObjectStore.createIndex("name", "name", { unique: false });
                    favObjectStore.transaction.oncomplete = function(e) {
                        console.log('Object store "favorites" created!');
                    };
                }
            }
        }

        return deferred.promise;
    };

    return {
        isSupported: function() {
            if ($window.indexedDB !== undefined) {
                console.log("Yay! IndexedDB is supported:)");
            }
        },
        delete: function(databaseName) {
            var deferred = $q.defer();

            var request = $window.indexedDB.deleteDatabase(dbName);
            request.onsuccess = function(e) {
                deferred.resolve(databaseName + " deleted successfully!");
            }
            request.onerror = function(e) {
                deferred.reject("Failed to delete " + databaseName);
            }
            request.onblocked = function() {
                deferred.reject("Got blocked in my attempt to delete " + databaseName);
            }

            return deferred.promise;
        },
        open: openPriv,
        close: function() {
            if (db)
                db.close();

        },
        addBatch: function(data) {

            var deferred = $q.defer();

            openPriv().then(function(db) {
                var transaction = db.transaction(["mallpoints"], "readwrite");
                var store = transaction.objectStore("mallpoints");

                for (var i = 0; i < data.length; i++) {
                    var request = store.add(data[i]);
                    request.onsuccess = function(e) {
                    };
                    request.onerror = function(e) {
                        deferred.reject(e);
                    }
                };

                transaction.oncomplete = function(event) {
                    deferred.resolve("Success!");
                };
            });

            return deferred.promise;
        },
        readAll: function() {
            var deferred = $q.defer();

            openPriv().then(function(db) {
                var transaction = db.transaction(["mallpoints"], "readonly");
                var store = transaction.objectStore('mallpoints');
                var result = [];

                var cursor = store.openCursor();
                cursor.onsuccess = function(evt) {
                    var cursor = evt.target.result;
                    if (cursor) {
                        result.push(cursor.value);
                        cursor.continue();
                    }
                }
                cursor.onerror = function(error) {
                    deferred.reject(error);
                }

                transaction.oncomplete = function(event) {
                    deferred.resolve(result);
                }
            });

            return deferred.promise;
        },
        deleteAll: function() {
            var deferred = $q.defer();

            openPriv().then(function(db) {
                var transaction = db.transaction(["mallpoints"], "readwrite");
                var store = transaction.objectStore('mallpoints');
                var result = [];

                var cursor = store.openCursor();
                cursor.onsuccess = function(evt) {
                    var delCursor = evt.target.result;
                    if (delCursor) {
                        delCursor.delete();
                        delCursor.continue();
                    }
                }
                cursor.onerror = function(error) {
                    deferred.reject(error);
                }

                transaction.oncomplete = function(event) {
                    deferred.resolve(result);
                }
            });

            return deferred.promise;
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
                    var message = {};
                    message.type = 'data';
                    message.token = connectionToken;
                    message.radius = 0.3;
                    message.coords = $rootScope.activeUserLatLng;
                    if (webSocket)
                        webSocket.send(JSON.stringify(message));
                    else
                        $interval.cancel(intervalPromise);
                }
            }, interval);
        },
        stopGeofencing: function() {
            $interval.cancel(intervalPromise);
        }
    }
})

.factory('User', function() {
    var user = {};
    var latLng = {};

    return {
        setData: function(activeUser) {
            user = activeUser;
        },
        getData: function() {
            return user;
        },
        setLatLng: function(latLng) {
            latLng = latLng;
        },
        getLatLng: function() {
            return latLng;
        }
    };
})

.factory('Authentication', function($http, $q, $ionicPopup, ServerConfig, LocalStorage, User) {
    var loginSuccess = function(result) {
        var creds = {};
        creds.email = result.data.email;
        creds.passwordHash = result.data.passwordHash;
        LocalStorage.setObject('credentials', creds);

        User.setData(result.data);
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
                    onTap: function() {
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
                deferred.resolve();
            })
            .catch(function(reject) {
                if (reject.status === 0) {
                    showErrorPoup('Connection Not Established',
                                  'Service might be offline or down for maintenance. Please try again later.',
                                  $scope);
                    deferred.reject("Server might be offline.");
                }

                else {
                    showErrorPoup('Invalid Credentials',
                                  'Invalid email and/or password provided. Please try again.',
                                  $scope);

                    deferred.reject("Invalid credentials in storage.");
                }
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
                    deferred.resolve();
                })
                .catch(function(reject) {
                    if (reject.status === 0) {
                        showErrorPoup('Connection Not Established',
                                      'Service might be offline or down for maintenance. Please try again later.',
                                      $scope);
                        deferred.reject("Server might be offline.");
                    }

                    else {
                        showErrorPoup('Invalid Credentials',
                                      'Invalid email and/or password provided. Please try again.',
                                      $scope);

                        deferred.reject("Invalid credentials in storage.");
                    }
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
                    deferred.resolve();
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
        }
    };
})

.factory('Mallpoints', function($http, $q, $ionicPopup, ServerConfig, Authentication, Map, IndexedDB) {
    var userMallpoints = [];
    var radiusMallpoints = [];
    var favorites = [];

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

        $ionicPopup
        .show(options)
        .then(function(result) {
            if (result === undefined)
                deferred.reject("Search canceled.");
            else
                deferred.resolve(result);
        })
        .catch(function(error) {
                deferred.reject("Search canceled.");
        });

        return deferred.promise;
    };

    return {
        // getAll: function(refresh) {
        //     var deferred = $q.defer();
        //
        //     if ((refresh !== undefined && refresh === true) || mallpoints.length === 0) {
        //         $http.get(ServerConfig.baseRoute() + "/mallpoints")
        //         .then(function(results) {
        //             mallpoints = results.data;
        //
        //             IndexedDB.deleteAll().then(function() {
        //                 IndexedDB.addBatch(mallpoints).then(function() {
        //                     console.log("Saved successfully to indexedDB");
        //                 });
        //             });
        //
        //             deferred.resolve(mallpoints);
        //         })
        //         .catch(function(error) {
        //             deferred.reject(error);
        //         });
        //     }
        //     else {
        //         deferred.resolve(mallpoints);
        //     }
        //
        //     return deferred.promise;
        // },
        radiusSearch: function(latLng, userId) {
            var deferred = $q.defer();

            var params = { lat: latLng.lat, lng: latLng.lng, userId: userId };
            $http.post(ServerConfig.baseRoute() + "/mallpoints/radius", params)
            .then(function(results) {
                var mallpoints = {};
                mallpoints.data = results.data;
                mallpoints.type = 'Radius';

                deferred.resolve(mallpoints);
            })
            .catch(function(error) {
                deferred.reject(error);
            });

            // if ((refresh !== undefined && refresh === true) || mallpoints.length === 0) {
            //     var params = { lat: latLng.lat, lng: latLng.lng };
            //     $http.post(ServerConfig.baseRoute() + "/mallpoints/radius", params)
            //     .then(function(results) {
            //         mallpoints = results.data;
            //
            //         IndexedDB.deleteAll().then(function() {
            //             IndexedDB.addBatch(mallpoints).then(function() {
            //             });
            //         });
            //
            //         deferred.resolve(mallpoints);
            //     })
            //     .catch(function(error) {
            //         deferred.reject(error);
            //     });
            // }
            // else {
            //     deferred.resolve(mallpoints);
            // }

            return deferred.promise;
        },
        getAllFromUser: function(user) {
            var deferred = $q.defer();

            $http.post(ServerConfig.baseRoute() + "/mallpoints/user", user)
            .then(function(result) {
                var mallpoints = {};
                mallpoints.data = result.data;
                mallpoints.type = 'Owned';

                deferred.resolve(mallpoints);
            })
            .catch(function(error) {
                deferred.eject(error);
            });

            return deferred.promise;
        },
        getAllOffline: function(refresh) {
            var deferred = $q.defer();

            if ((refresh !== undefined && refresh === true) || mallpoints.length === 0) {
                IndexedDB.readAll()
                .then(function(result) {
                    mallpoints = result;

                    deferred.resolve(mallpoints);
                })
                .catch(function(error) {
                    deferred.reject(error);
                });
            }
            else {
                deferred.resolve(mallpoints);
            }

            return deferred.promise;
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
        tagSearchOffline: function($scope) {
            var deferred = $q.defer();

            showSearchPopup($scope)
            .then(function(filter) {
                var filteredPoints = tagSearchOfflinePriv(filter);
                deferred.resolve(filteredPoints);
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

    var markers = {};
    markers['Owned'] = [];
    markers['Radius'] = [];
    markers['Favorites'] = [];

    var iconCache = {};
    var highlightedMarker = null;

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

    var initIconCache = function() {
        iconCache.shopOwned = new L.Icon(createCanvasIcon({}));
        iconCache.shopRadius = new L.Icon(createCanvasIcon({ outlineColor: 'black'}));
        iconCache.shopFavorite = new L.Icon(createCanvasIcon({ outlineColor: '#ffc900'}));
        iconCache.shopHighlighted = new L.Icon(createCanvasIcon({ outlineColor: '#0000FF'}));

        iconCache.mallOwned = new L.Icon(createCanvasIcon({ width: 50, height: 50, color: '#CC3300', outlineColor: 'white' }));
        iconCache.mallRadius = new L.Icon(createCanvasIcon({ width: 50, height: 50, color: 'black', outlineColor: 'white' }));
        iconCache.mallFavorite = new L.Icon(createCanvasIcon({ width: 50, height: 50, color: '#ffc900', outlineColor: 'white' }));
        iconCache.mallHighlighted = new L.Icon(createCanvasIcon({ width: 50, height: 50, color: '#0000FF', outlineColor: 'white' }));
    };

    var highlightMarkersPriv = function(markers, mallpoints) {
        for (var i = 0; i < markers.length; i++) {
            markers[i].view.setOpacity(0.3);

            for (var k = 0; k < mallpoints.length; k++) {
                if (mallpoints[k]._id === markers[i].model._id) {
                    markers[i].view.setOpacity(1.0);
                }
            }
        }
    };

    var clearHighlightsPriv = function(markers) {
        for (var i = 0; i < markers.length; i++)
            markers[i].view.setOpacity(1.0);
    };

    var onClickClosure = function(marker, type) {
        return function() {
            if (!marker.isFavorite)
                marker.view.setIcon(iconCache[marker.model.size.toLowerCase() + 'Favorite']);
            else
                marker.view.setIcon(iconCache[marker.model.size.toLowerCase() + type]);

            marker.isFavorite = !marker.isFavorite;
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

            initIconCache();

            return map;
        },
        displayMallpoints: function(mallpoints) {
            var shopIcon = iconCache['shop' + mallpoints.type];
            var mallIcon = iconCache['mall' + mallpoints.type];

            for (var i = 0; i < markers[mallpoints.type].length; i++) {
                map.removeLayer(markers[mallpoints.type][i].view);
            }

            markers[mallpoints.type] = [];

            for (var i = 0; i < mallpoints.data.length; i++) {
                var marker = {};
                marker.model = mallpoints.data[i];
                marker.isFavorite = false;
                marker.view = new L.marker([mallpoints.data[i].latitude, mallpoints.data[i].longitude], {
                    bounceOnAdd: true,
                    icon: mallpoints.data[i].size === 'Shop' ? shopIcon : mallIcon
                }).addTo(map).bindPopup(mallpoints.data[i].name);
                marker.view.on('click', onClickClosure(marker, mallpoints.type));

                markers[mallpoints.type].push(marker);
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
            highlightMarkersPriv(markers['Owned'], mallpoints);
            highlightMarkersPriv(markers['Radius'], mallpoints);
            highlightMarkersPriv(markers['Favorites'], mallpoints);
        },
        highlight: function(mallpoint) {
            if (highlightedMarker)
                highlightedMarker.view.setIcon(iconCache[highlightedMarker.model.size.toLowerCase()]);

            for (var i = 0; i < markers.length; i++) {
                if (markers[i].model._id === mallpoint._id) {
                    markers[i].view.setIcon(iconCache[markers[i].model.size.toLowerCase() + "Highlighted"]);
                    map.setView([markers[i].model.latitude, markers[i].model.longitude]);
                    highlightedMarker = markers[i];

                    break;
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
        },
        createUserCircle: function() {
            userCircle = new L.circle([0, 0], 300).addTo(map);

            return userCircle;
        },
        clearHighlights: function() {
            clearHighlightsPriv(markers['Owned']);
            clearHighlightsPriv(markers['Radius']);
            clearHighlightsPriv(markers['Favorites']);
        }
    }
})

;
