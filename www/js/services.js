angular.module('mallpoint.services', [])

.factory('Geolocation', function($q) {

    var defaultParams = { enableHighAccuracy: true, maximumAge: 3000 };

    return {
        getCurrentPosition: function(params) {
            var deferred = $q.defer();

            params = angular.extend({}, defaultParams, params);
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

            params = angular.extend({}, defaultParams, params);
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

.factory('WiFi', function($ionicPlatform, $ionicPopup, $q, ServerConfig, WebSocketConfig) {
    var checkConnection = function() {
        if (!navigator.connection)
            return true;
        else if (navigator.connection.type === Connection.NONE)
            return false;
        else
            return true;
    };

    var showNoWifiPopup = function($scope) {
        $ionicPopup.show({
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
    };

    var showConfigPopup = function($scope) {
        $scope.config = {};
        var configPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="config.address">',
            title: 'Enter Server IP',
            subTitle: 'Please use xxx.xxx.xxx.xxx notation',
            scope: $scope,
            buttons: [
                {
                    text: 'Cancel',
                    type: 'button-assertive button-clear',
                    onTap: function(e) {
                        return '192.168.0.12';
                    }
                },
                {
                    text: 'Save',
                    type: 'button-assertive',
                    onTap: function(e) {
                        if (!$scope.config.address) {
                            e.preventDefault();
                        } else {
                            return $scope.config.address;
                        }
                    }
                }
            ]
        });

        return configPopup;
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
                    showNoWifiPopup($scope);
                    deferred.reject("Server might be offline.");
                }
            });

            return deferred.promise;
        },
        setServerIP: function($scope) {
            var configPopup = showConfigPopup($scope);

            configPopup.then(function(res) {
                console.log('New server address: ', res);
                ServerConfig.ip = res;
                WebSocketConfig.ip = res;
            });
        }
    };
})

.factory('IndexedDB', function($q, $window, IDBStores) {

    var dbName = "Mallpoints";
    var db = null;

    var openPriv = function() {
        var deferred = $q.defer();

        if (db) {
            deferred.resolve(db);
        }
        else {
            var request = $window.indexedDB.open(dbName, 5);
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
        addAll: function(data, origin) {
            var deferred = $q.defer();

            openPriv().then(function(db) {
                var transaction = db.transaction([IDBStores[origin]], "readwrite");
                var store = transaction.objectStore(IDBStores[origin]);

                for (var i = 0; i < data.length; i++) {
                    var request = store.add(data[i]);
                    request.onsuccess = function(e) {
                    };
                    request.onerror = function(e) {
                        deferred.reject(e);
                    };
                };

                transaction.oncomplete = function(event) {
                    deferred.resolve("Success!");
                };

                transaction.onerror = function(event) {
                    deferred.reject("Error working with IndexedDB");
                };
            });

            return deferred.promise;
        },
        add: function(mallpoint, origin) {
            var deferred = $q.defer();

            openPriv().then(function(db) {
                var transaction = db.transaction([IDBStores[origin]], "readwrite");
                var store = transaction.objectStore(IDBStores[origin]);

                var request = store.add(mallpoint);
                request.onsuccess = function(e) {
                };
                request.onerror = function(e) {
                    deferred.reject(e);
                };

                transaction.oncomplete = function(event) {
                    deferred.resolve(mallpoint);
                };

                transaction.onerror = function(event) {
                    deferred.reject("Error working with IndexedDB");
                };
            });

            return deferred.promise;
        },
        readAll: function(origin) {
            var deferred = $q.defer();

            openPriv().then(function(db) {
                var transaction = db.transaction([IDBStores[origin]], "readonly");
                var store = transaction.objectStore(IDBStores[origin]);
                var result = [];

                var cursor = store.openCursor();
                cursor.onsuccess = function(evt) {
                    var readCursor = evt.target.result;
                    if (readCursor) {
                        result.push(readCursor.value);
                        readCursor.continue();
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
        deleteAll: function(origin) {
            var deferred = $q.defer();

            openPriv().then(function(db) {
                var transaction = db.transaction([IDBStores[origin]], "readwrite");
                var store = transaction.objectStore(IDBStores[origin]);
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
                    deferred.resolve("Success");
                }
            });

            return deferred.promise;
        },
        delete: function(objectId, origin) {
            var deferred = $q.defer();

            openPriv().then(function(db) {
                var transaction = db.transaction([IDBStores[origin]], "readwrite");
                var store = transaction.objectStore(IDBStores[origin]);
                var request = store.delete(objectId);
                request.onerror = function(error) {
                    deferred.reject(error);
                }

                transaction.oncomplete = function(event) {
                    deferred.resolve("Success");
                }
            });

            return deferred.promise;
        }
    }
})

.factory('User', function() {
    var user = null;
    var latLng = null;
    var radius = 0.3;

    return {
        setData: function(activeUser) {
            user = activeUser;
        },
        getData: function() {
            return user;
        },
        setLatLng: function(latLong) {
            latLng = latLong;
        },
        getLatLng: function() {
            return latLng;
        },
        setRadius: function(radMeters) {
            radius = radMeters / 1000.0;
        },
        getRadius: function() {
            return radius;
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

.factory('Geofencing', function($interval, $timeout, WebSocketConfig, User) {
    var webSocket = null;
    var connectionToken = -1;
    var intervalPromise = null;
    var recAttempt = 1;

    var dataCallback = null;

    var radius = 0.3;

    var initPriv = function() {
        if (webSocket) {
            webSocket.close();
            webSocket = null;
        }

        webSocket = new WebSocket(WebSocketConfig.baseRoute());

        webSocket.onmessage = function(event) {
            var message = JSON.parse(event.data);

            switch(message.type) {
                case 'hello':
                    connectionToken = message.token;
                    break;

                case 'mallpoints':
                    if (dataCallback)
                        dataCallback(message.mallpoints);
                    break;
            }
        };

        webSocket.onclose = function(event) {
            console.log("Lost connection to the server");
            webSocket = null;
            reconnect();
        };

        webSocket.onerror = function(event) {
            console.log("Error in connection!");
            webSocket = null;
            reconnect();
        };
    };

    var reconnect = function() {
        var recPromise = $interval(function() {
            console.log("Reconnection attempt: " + recAttempt + "/3");

            if (webSocket === null)
                initPriv();

            recAttempt++;

            if (recAttempt > 3 || webSocket) {
                $interval.cancel(recPromise);
            }
        }, 3000);
    }

    return {
        init: initPriv,
        onMessage: function(callback) {
            dataCallback = callback;
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
        start: function(interval) {
            interval = interval || 5000;
            intervalPromise = $interval(function () {
                if (User.getLatLng())
                {
                    var message = {};
                    message.type = 'data';
                    message.token = connectionToken;
                    message.radius = radius;
                    message.coords = User.getLatLng();
                    if (webSocket && webSocket.readyState === WebSocket.OPEN)
                        webSocket.send(JSON.stringify(message));
                    else
                        $interval.cancel(intervalPromise);
                }
            }, interval);
        },
        stop: function() {
            $interval.cancel(intervalPromise);
        },
        setRadius: function(rad) {
            radius = rad / 1000.0;
        }
    }
})

.factory('Mallpoints', function($http, $q, $ionicPopup, ServerConfig, User, IndexedDB) {
    var mallpoints = {};
    mallpoints['Favorites'] = [];
    mallpoints['Owned'] = [];
    mallpoints['Radius'] = [];

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
                if (!$scope.mpData.name || !$scope.mpData.type) {
                    e.preventDefault();
                }
                else {
                    var newMallpoint = {};
                    newMallpoint.name = $scope.mpData.name;
                    newMallpoint.type = $scope.mpData.type;
                    newMallpoint.tags = $scope.mpData.tags ? $scope.mpData.tags.toString().replace(/\s*\t*,+\s*\t*/g, ",").trim() : '';
                    newMallpoint.size = $scope.mpData.size;
                    return newMallpoint;
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

        $ionicPopup.show(options)
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

    var getFavoritesOffline = function() {
        var deferred = $q.defer();

        if (mallpoints['Favorites'].length > 0) {
            var result = {};
            result.data = mallpoints['Favorites'];
            result.origin = 'Favorites';

            deferred.resolve(result);
        }
        else {
            IndexedDB.readAll('Favorites').then(function(favorites) {
                if (favorites.length > 0) {
                    var result = {};
                    result.data = favorites;
                    result.origin = 'Favorites';

                    mallpoints['Favorites'] = favorites;

                    console.log('Favorites data (from DB):', result.data.length);
                    deferred.resolve(result);
                }
                else {
                    deferred.reject(null);
                }
            })
            .catch(function() {
                deferred.reject(null);
            });
        }

        return deferred.promise;
    };

    var getFavoritesFromServer = function() {
        var deferred = $q.defer();

        var postData = {};
        postData.email = User.getData().email;

        $http.post(ServerConfig.baseRoute() + "/favorites", postData)
        .then(function(response) {
            var result = {};
            result.data = response.data;
            result.origin = 'Favorites';

            mallpoints['Favorites'] = result.data;

            IndexedDB.deleteAll('Favorites').then(function() {
                IndexedDB.addAll(result.data, 'Favorites');
            });

            console.log('Favorites data (from server):', result.data.length);
            deferred.resolve(result);
        })
        .catch(function(error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    var getOwnedOffline = function() {
        var deferred = $q.defer();

        if (mallpoints['Owned'].length > 0) {
            var result = {};
            result.data = mallpoints['Owned'];
            result.origin = 'Owned';

            deferred.resolve(result);
        }
        else {
            IndexedDB.readAll('Owned').then(function(owned) {
                if (owned.length > 0) {
                    var result = {};
                    result.data = owned;
                    result.origin = 'Owned';

                    mallpoints['Owned'] = owned;

                    console.log('Owned data (from DB):', result.data.length);
                    deferred.resolve(result);
                }
                else {
                    deferred.reject(null);
                }
            })
            .catch(function() {
                deferred.reject(null);
            });
        }

        return deferred.promise;
    };

    var getOwnedFromServer = function() {
        var deferred = $q.defer();

        var postData = {};
        postData.userId = User.getData()._id;

        $http.post(ServerConfig.baseRoute() + "/mallpoints/user", postData)
        .then(function(response) {
            var result = {};
            result.data = response.data;
            result.origin = 'Owned';

            mallpoints['Owned'] = result.data;

            IndexedDB.deleteAll('Owned').then(function() {
                IndexedDB.addAll(result.data, 'Owned');
            });

            console.log('Owned data (from server):', result.data.length);
            deferred.resolve(result);
        })
        .catch(function(error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };

    return {
        get: function(origin) {
            return mallpoints[origin];
        },
        getUserFavorites: function(refresh) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            if (refresh === undefined || refresh === false) {
                getFavoritesOffline()
                .then(function(favorites) {
                    deferred.resolve(favorites);
                })
                .catch(function() {
                    promise = getFavoritesFromServer();
                });
            }
            else {
                promise = getFavoritesFromServer();
            }

            return promise;
        },
        getAllOwnedByUser: function(refresh) {
            var deferred = $q.defer();
            var promise = deferred.promise;

            if (refresh === undefined || refresh === false) {
                getOwnedOffline()
                .then(function(favorites) {
                    deferred.resolve(favorites);
                })
                .catch(function() {
                    promise = getOwnedFromServer();
                });
            }
            else {
                promise = getOwnedFromServer();
            }

            return promise;
        },
        getAllInUserRadius: function() {
            var deferred = $q.defer();

            var postData = {};
            postData.lat = User.getLatLng().lat;
            postData.lng = User.getLatLng().lng;
            postData.radius = User.getRadius();
            postData.userId = User.getData()._id;

            $http.post(ServerConfig.baseRoute() + "/mallpoints/radius", postData)
            .then(function(response) {
                var result = {};
                result.data = response.data;
                result.origin = 'Radius';

                mallpoints['Radius'] = result.data;

                console.log('Radius data:', result.data.length);
                deferred.resolve(result);
            })
            .catch(function(error) {
                deferred.reject(error);
            });

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
        create: function($scope, latLng) {
            var deferred = $q.defer();

            showConfirmPopup($scope)
            .then(function(mallpoint) {
                mallpoint.latitude = latLng.lat;
                mallpoint.longitude = latLng.lng;
                mallpoint.userId = User.getData()._id;

                $http.post(ServerConfig.baseRoute() + "/mallpoints/create", mallpoint)
                .then(function(result) {
                    mallpoints['Owned'].push(result.data);
                    IndexedDB.add(result.data, 'Owned');
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
        addToFavorites: function(mallpoint) {
            var deferred = $q.defer();

            var data = {};
            data.email = User.getData().email;
            data.mallpointId = mallpoint._id;

            $http.post(ServerConfig.baseRoute() + "/favorites/add", data)
            .then(function(result) {
                IndexedDB.add(mallpoint, 'Favorites');
                deferred.resolve(result.data);
            })
            .catch(function(error) {
                deferred.reject(error);
            });

            return deferred.promise;
        },
        removeFromFavorites: function(mallpoint) {
            var deferred = $q.defer();

            var data = {};
            data.email = User.getData().email;
            data.mallpointId = mallpoint._id;

            $http.post(ServerConfig.baseRoute() + "/favorites/remove", data)
            .then(function(result) {
                IndexedDB.delete(mallpoint._id, 'Favorites');
                deferred.resolve(result.data);
            })
            .catch(function(error) {
                deferred.reject(error);
            });

            return deferred.promise;
        }
    }
})

.factory('Map', function($timeout, $interval, User, Mallpoints) {
    var map = null;
    var mapLayer = null;
    var userMarker = null;
    var userCircle = null;
    var userRadius = 300;
    var highlightedMarker = null;

    var markerCallback = null;

    var markers = [];

    var priorities = {};
    priorities['Radius'] = 0;
    priorities['Owned'] = 1;
    priorities['Favorites'] = 2;

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

    var initIconCache = function() {
        iconCache.shopOwned = new L.Icon(createCanvasIcon({}));
        iconCache.shopRadius = new L.Icon(createCanvasIcon({ outlineColor: 'black'}));
        iconCache.shopFavorites = new L.Icon(createCanvasIcon({ outlineColor: '#ffc900'}));
        iconCache.shopHighlighted = new L.Icon(createCanvasIcon({ outlineColor: '#886aea'}));

        iconCache.mallOwned = new L.Icon(createCanvasIcon({ width: 50, height: 50, color: '#CC3300', outlineColor: 'white' }));
        iconCache.mallRadius = new L.Icon(createCanvasIcon({ width: 50, height: 50, color: 'black', outlineColor: 'white' }));
        iconCache.mallFavorites = new L.Icon(createCanvasIcon({ width: 50, height: 50, color: '#ffc900', outlineColor: 'white' }));
        iconCache.mallHighlighted = new L.Icon(createCanvasIcon({ width: 50, height: 50, color: '#886aea', outlineColor: 'white' }));
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

    var updateFavoriteStatus = function(marker) {
        return function() {
            var operation = '';
            if (marker.origin !== 'Favorites') {
                marker.view.setIcon(iconCache[marker.model.size.toLowerCase() + 'Favorites']);
                marker.origin = 'Favorites';
                Mallpoints.addToFavorites(marker.model);
                operation = 'add';
            }
            else {
                var userIdStr = User.getData()._id.toString();
                if (marker.model.owner.toString() === userIdStr) {
                    marker.view.setIcon(iconCache[marker.model.size.toLowerCase() + 'Owned']);
                    marker.origin = 'Owned';
                }
                else {
                    marker.view.setIcon(iconCache[marker.model.size.toLowerCase() + 'Radius']);
                    marker.origin = 'Radius';
                }

                Mallpoints.removeFromFavorites(marker.model);
                operation = 'remove';
            }

            if (markerCallback)
                markerCallback(operation, marker.model);
        }
    };

    var markerIndexOf = function(mallpoint) {
        for (var i = 0, len = markers.length; i < len; i++) {
            if (mallpoint._id.toString() === markers[i].model._id.toString())
                return i;
        }

        return -1;
    };

    var processMallpoints = function(mallpoints, origin) {
        for (var i = 0; i < markers.length; i++) {
            if (markers[i].origin === origin) {
                map.removeLayer(markers[i].view);
                markers.splice(i, 1);
                i--;
            }
        }

        for (var i = 0, len = mallpoints.length; i < len; i++) {
            var index = markerIndexOf(mallpoints[i]);
            if (index !== -1) {
                if (priorities[origin] > priorities[markers[index].origin]) {
                    markers[index].origin = origin;
                    markers[index].view.setIcon(iconCache[mallpoints[i].size.toLowerCase() + origin]);
                    markers[index].model = mallpoints[i];
                }
            }
            else {
                addMarkerPriv(mallpoints[i], origin);
            }
        }
    };

    var addMarkerPriv = function(mallpoint, origin) {
        var newMarker = {};
        newMarker.model = mallpoint;
        newMarker.origin = origin;
        newMarker.view = new L.marker([mallpoint.latitude, mallpoint.longitude], {
            opacity: 0.0,
            icon: iconCache[mallpoint.size.toLowerCase() + origin]
        }).addTo(map).bindPopup(mallpoint.name);
        newMarker.view.on('contextmenu', updateFavoriteStatus(newMarker));

        animateMarker(function(progress) {
            newMarker.view.setOpacity(progress);
        }, 33, 30);

        markers.push(newMarker);
    };

    var animateMarker = function(callback, delay, repetitions) {
        var reps = 0;
        var progress = 0;
        var step = 1.0 / repetitions;
        var animPromise = $interval(function () {

            callback(progress);

            progress += step;
            if (++reps === repetitions) {
                $interval.cancel(animPromise);
            }
        }, delay);
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
            processMallpoints(mallpoints.data, mallpoints.origin);
        },
        addMarker: function(mallpoint) {
            addMarkerPriv(mallpoint, 'Owned');
        },
        highlightSearchResults: function(mallpoints) {
            for (var j = 0, markLen = markers.length; j < markLen; j++) {
                    markers[j].view.setOpacity(0.2);
            }

            for (var i = 0, len = mallpoints.length; i < len; i++) {
                for (var j = 0, markLen = markers.length; j < markLen; j++) {
                    if (markers[j].model._id.toString() === mallpoints[i]._id.toString()) {
                        markers[j].view.setOpacity(1.0);
                    }
                }
            }
        },
        highlight: function(mallpoint) {
             if (highlightedMarker)
                 highlightedMarker.view.setIcon(iconCache[highlightedMarker.model.size.toLowerCase()
                      + highlightedMarker.origin]);

             for (var i = 0; i < markers.length; i++) {
                 if (markers[i].model._id.toString() === mallpoint._id.toString()) {
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
        onMarkerClick: function(markerCb) {
            markerCallback = markerCb;
        },
        createUserMarker: function() {
            userMarker = new L.marker([0, 0], {draggable: 'true'}).addTo(map).bindPopup('My Location!');
            userMarker.setZIndexOffset(999);

            return userMarker;
        },
        createUserCircle: function() {
            userCircle = new L.circle([0, 0], 300).addTo(map);

            return userCircle;
        },
        setCircleRadius: function(radius) {
            userRadius = radius;
            userCircle.setRadius(radius);
            Mallpoints
            .getAllInUserRadius()
            .then(this.displayMallpoints);
        },
        showCircle: function(visible) {
            if (visible) {
                userCircle.setRadius(userRadius);
            }
            else {
                userCircle.setRadius(0);
            }
        },
        clearHighlights: function() {
            for (var i = 0; i < markers.length; i++) {
                markers[i].view.setIcon(iconCache[markers[i].model.size.toLowerCase() + markers[i].origin]);
                markers[i].view.setOpacity(1.0);
            }
        }
    }
})

;
