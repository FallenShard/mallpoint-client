angular.module('mallpoint.values', [])

// Server configuration
.value('ServerConfig', {
    ip: '192.168.0.12',
    port: '5000',
    baseUrl: '/api',
    baseRoute: function() {
        return 'http://' + this.ip + ":" + this.port + this.baseUrl;
    }
})

.value('WebSocketConfig', {
    ip: '192.168.0.12',
    port: '5001',
    baseUrl: '',
    baseRoute: function() {
        return 'ws://' + this.ip + ':' + this.port + this.baseUrl;
    }
})

.value('IDBStores', {
    Favorites: 'favorites',
    Owned: 'mallpoints'
});
