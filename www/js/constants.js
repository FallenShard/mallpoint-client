angular.module('mallpoint.constants', [])

// Server configuration
.constant('ServerConfig', {
    ip: '192.168.0.17',
    port: '5000',
    baseUrl: '/api',
    baseRoute: function() {
        return 'http://' + this.ip + ":" + this.port + this.baseUrl;
    }
});
