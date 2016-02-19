/* global malarkey:false, moment:false */
(function() {
  'use strict';
  //默认clientapi配置
  var CLIENTAPI_CONFIG={
    uri:location.origin,
      debug:false,
      wxdebug:false,
  };

  //测试配置
  if(location.href.match("localhost")||location.href.match("192.168.1")){

    CLIENTAPI_CONFIG={
      uri:"http://dev1.comeoncloud.net",
      debug:false,
      wxdebug:false,
    }

    SHAKE_CONFIG = {

    };
  }


  angular
    .module('shake')
    .constant('malarkey', malarkey)
    .constant('moment', moment)
    //clientapi配置
    .constant('CLIENTAPI_CONFIG',CLIENTAPI_CONFIG)
    //摇一摇配置
    .constant('SHAKE_CONFIG', SHAKE_CONFIG)
    ;

})();
