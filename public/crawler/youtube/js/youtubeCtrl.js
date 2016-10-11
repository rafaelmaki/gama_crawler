var app = angular.module('primeiroEnemAdmin', ['ngJsonExportExcel']);

app.constant('_', _);
app.constant('moment', moment);

app.controller('YoutubeCtrl', function($scope, $http, $window, _, moment) {

    $scope.total = 0;
    $scope.pages = [];
    $scope.mostrarTotal = false;
    $scope.mostrarLista = false;
    $scope.error = "";
    $scope.model = {};
    $scope.searching = false;

    $scope.buscarPaginas = function() {
        $scope.searching = true;
        $http.post('/api/crawler/youtube', $scope.model)
            .success(function(data) {
                $scope.pages = data;
                $scope.mostrarTotal = true;
                $scope.mostrarLista = true;
                $scope.searching = false;
                $scope.total = data.length;
            })
            .error(function(err) {
                console.log('Error: ' + err);
                $scope.error = err;
                $scope.pages = [];
                $scope.mostrarTotal = false;
                $scope.mostrarLista = false;
                $scope.searching = false;
            });
    }
    
});
