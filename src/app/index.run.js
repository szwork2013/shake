(function() {
  'use strict';

  angular
    .module('shake')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
