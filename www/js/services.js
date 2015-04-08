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
            return $http.post(ServerConfig.baseRoute() + "/savemp", mallpoint);
        }
    }
});
