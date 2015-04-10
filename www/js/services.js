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

.factory('Mallpoints', function($http, ServerConfig) {
    return {
        getAll: function() {
            return $http.get(ServerConfig.baseRoute() + "/mallpoints");
        },
        save: function(mallpoint, user) {
            mallpoint.userId = user._id;
            return $http.post(ServerConfig.baseRoute() + "/mallpointcreate", mallpoint);
        }
    }
})

.factory('GoogleMaps', function($timeout) {

    var longTap = {};

    var longTapCancel = function() {
        if (angular.isUndefined(longTap.promise))
            return;

        $timeout.cancel(longTap.promise);
        delete longTap.promise;
    };

    return {
        addLongTapListener: function(elem, callback) {
            google.maps.event.addListener(elem, "mousedown", function(event) {
                console.log("onGoogleMapsMouseDown()");

                if (angular.isUndefined(longTap.promise)) {
                    longTap.promise = $timeout(function () { callback(event.latLng); }, 1000);
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
        }
    }
})

;
