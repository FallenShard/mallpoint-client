angular.module('mallpoint.constants', [])

// Server configuration
.constant('ServerConfig', {
    ip: '192.168.0.12',
    port: '5000',
    baseUrl: '/api',
    baseRoute: function() {
        return 'http://' + this.ip + ":" + this.port + this.baseUrl;
    }
})

.constant('WebSocketConfig', {
    ip: '192.168.0.12',
    port: '5001',
    baseUrl: '',
    baseRoute: function() {
        return 'ws://' + this.ip + ':' + this.port + this.baseUrl;
    }
})

.constant('IDBStores', {
    Favorites: 'favorites',
    Owned: 'mallpoints'
});
