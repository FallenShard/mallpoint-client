angular.module('mallpoint.filters', [])

.filter('tagsFormatter', function() {
  return function(input) {
    var result = '';

    if (!input || !input.length)
        return result;

    for (var i = 0; i < input.length; i++) {
        result += input[i] + ', ';
    }
    return result.slice(0, -2);
  };
});
