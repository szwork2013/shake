(function() {
  'use strict';

  angular
    .module('shake')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('shake', {
        url: '/shake',
        templateUrl: 'app/shake/shake.html',
        controller: 'shakeCtrl',
        controllerAs: 'shake'
      });

    $urlRouterProvider.otherwise('/shake');
  }

})();
