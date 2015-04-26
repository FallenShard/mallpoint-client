angular.module('mallpoint.filters', [])

.filter('tagsFormatter', function() {
  return function(input) {
    var result = '';
    for (var i = 0; i < input.length; i++) {
        result += input[i] + ', ';
    }
    return result.slice(0, -2);
  };
});
