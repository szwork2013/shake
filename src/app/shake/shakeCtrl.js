(function() {
  'use strict';

  angular
    .module('shake')
    .controller('shakeCtrl', shakeCtrl);

  /** @ngInject */
  /* jshint validthis: true */
  function shakeCtrl($stateParams,$timeout,nAPI,wLoading) {
    /* jshint validthis: true */
    var vm=this;
  //  vm.title=decodeURIComponent($stateParams.brand);  //这里可以传进来是哪里的摇一摇
    vm.titleNm='';
    vm.activeID=$stateParams.activityId; // 活动的ID
    //vm.activeID='419338';
    vm.isable=1;
    vm.useTen=false;
    vm.award_datas=[];
    vm.active_data='';
  //  vm.use_points=''; // 获取超过次数后每次需要多少积分
    vm.hasshaketotals='';//剩余的摇奖次数
    vm.shouldusepoints='';  // 获取超过次数后每次需要多少积分
    vm.customName='';
    vm.showcustom=false; //自定义中奖界面开关
    vm.Points='';
    vm.showpoints=false;  //积分中奖界面开关
    vm.showintegral=false; // 关闭优惠卷中奖界面
    vm.hasnopostage=false;  //免邮劵页面开关
    vm.hascoupons=false;  //100元券页面开关
    vm.noPostage=[];
    vm.couponName=[];
    vm.isStarted=0;  //是否到了抽奖或者过了抽奖时间  0表示正常 1表示还没到抽奖时间，2表示过了抽奖时间

    vm.shownoresult=false; //关闭未中奖界面
    vm.hasnopoints=false; //没有抽中奖没有积分可以抽奖页面开关
    vm.nowinning=false;  //没有抽中奖可以继续抽页面开关
    vm.hasnocounts=false; //推荐商品页面开关

    vm.isMutiShake=''; //是否可以多次中奖,当为1时表示不能多次中奖
    vm.buttons=[];//底部导航栏

    /*手机摇动的时候参数*/
    var SHAKE_THRESHOLD = 2000;
    var last_update = 0;
    var x,y,z,last_x,last_y,last_z=0;
    /*手机摇动的时候*/

    vm.mathproduct={};
    vm.getActiveInfo=getActiveInfo; //获取活动信息
    vm.getLotteryInfo=getLotteryInfo;//获取抽奖信息(第一个)
    vm.KSCJ=KSCJ;
    vm.getAwardInfo=getAwardInfo;//获取抽奖信息(中奖)
    vm.getPrizeInfo=getPrizeInfo;//获取抽奖信息(未中奖)
    vm.startShake=startShake;//开始抽奖
    vm.deviceMotionHandler=deviceMotionHandler; //判断设备是否支持摇一摇
    //vm.getRandomProduct=getRandomProduct;//再去商品列表中用随机数字取得商品
   // vm.getProductList=getProductList;//获取商品列表
    vm.getCurrUserInfo=getCurrUserInfo;//获取当前用户信息
    vm.closeNoPointBtn=closeNoPointBtn;//关闭积分用完的界面
    vm.shakeUsePoint=shakeUsePoint;//用积分抽奖
  //  vm.getAward=getAward;//测试用，后面删
    vm.getBottomNav=getBottomNav;//获取底部导航按钮
    vm.goToLink=goToLink;//底部导航点击方法

    //if ($rootScope.iscomeshakessss == undefined) {
    //  $rootScope.iscomeshakessss = 0;
    //} else {
    //  location.reload();
    //  $rootScope.iscomeshakessss = undefined;
    //}
    var audioID=document.getElementById("showAudio");
    document.title='摇一摇';

    isLogin();
    //判断登录
    function isLogin(){
      nAPI.isLogin()
        .then(
        function(data){
          console.log(data);
          if(data.is_login){
            //登录的情况下才显示购物车的内容，否则不显示的
            vm.getActiveInfo();
          }
          else{
            wLoading.show("请先登录！");
            $timeout(function () {
              wLoading.hide()
            }, 2000)
          }

          //登录的情况下才显示购物车的内容，否则不显示的
          //if(data.IsSuccess){
          //  console.log("已经登陆");
          //  vm.getActiveInfo();
          //}
          //else{
          //  alert('您还没有登录');
          //}
        }
      )
        .catch(
        function(data){
          wLoading.show("请先登录！");
          $timeout(function () {
            wLoading.hide()
          }, 2000);
        }
      );
      //nAPI.isLogin(function() {
      //  // 登录的情况下才显示购物车的内容，否则不显示的
      //  console.log("已经登陆");
      //  vm.getActiveInfo();
      //}, function() {
      //  alert('请先登录');
      //  //loading("请先登录",200,function(){
      //  //  // 测试跳转我们内部的好测试
      //  //  // $state.go("login");
      //  //  //// 正式跳转
      //  //  //window.location.href=$rootScope.ykzcurl;
      //  //});
      //});
    }
    //获取抽奖信息
    function getLotteryInfo(){
      nAPI.getLotteryInfo(vm.activeID)
        .then(function(data){
          console.log('活动信息',data);
          // 此处为判断是否有活动
          if(data.Status!=0){
            wLoading.show("未找到抽奖活动，请与管理员联系");
            $timeout(function () {
              wLoading.hide()
            }, 2000);
           // alert('未找到抽奖活动，请与管理员联系');
          }else{
            vm.award_datas=data.Result.awards;
            vm.active_data=data.Result;
            vm.titleNm=data.Result.websiteownername;
            var today=(new Date()).getTime();
            var startTime=(new Date(data.Result.startTime)).getTime();
            var endTime=(new Date(data.Result.endTime)).getTime();
            if(today>startTime&&today<endTime)
            {
              //true表示在正常时间内，可以正常抽奖
              vm.isStarted=0;
            }
            else{
              //开始时间是否到了 1表示还没到时间
              if(today<startTime){
                vm.isStarted=1;
                wLoading.show("活动还未开启");
                $timeout(function () {
                  wLoading.hide();
                }, 2000);
              }
              //是否过了结束时间 2表示过了结束时间
              else if(today>endTime){
                vm.isStarted=2;
                wLoading.show("活动已结束");
                $timeout(function () {
                  wLoading.hide();
                }, 2000);
              }
            }
            getBottomNav();
            vm.active_data.startTime=data.Result.startTime.substring(0,data.Result.startTime.length-3).replace(/\//g,'-');
            vm.active_data.endTime=data.Result.endTime.substring(0,data.Result.endTime.length-3).replace(/\//g,'-');
            // 获取超过次数后每次需要多少积分
          //  vm.use_points=data.Result.usePoints;
            // 剩余的摇奖次数
            if((data.Result.luckRest)>0){
              vm.hasshaketotals = data.Result.luckRest;
            }else{
              vm.hasshaketotals = 0;
            }
            vm.shouldusepoints = data.Result.usePoints; // 获取超过次数后每次需要多少积分
            //wxAPI.share({
            //  title: data.Result.name,
            //  desc: data.Result.shareDesc,
            //  imgUrl: data.Result.shareImg,
            //  link: window.location.href
            //});
            wx.ready(function () {
              wxapi.wxshare({
                title: data.Result.name,
                desc: data.Result.shareDesc,
                link: window.location.href,
                imgUrl:data.Result.shareImg
              }, '')
            });
          }
          // 由于后台转码问题，需将内联样式中文分号换为英文分号
          // $scope.relustxt=$sce.trustAsHtml(data.Result.content.replace(/；/g, ";"));
        })
        .catch(function(data){
          console.log(data)
        });

      //$http({
      //  method: "GET",
      //  url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=getLottery&id="+vm.activeID
      //}).success(function(data, status) {
      //  console.log(data)
      //  // 此处为判断是否有活动
      //  if(data.Status!=0){
      //    popUp('未找到抽奖活动，请与管理员联系');
      //  }else{
      //    vm.award_datas=data.Result.awards;
      //    vm.active_data=data.Result;
      //    vm.active_data.startTime=data.Result.startTime.substring(0,data.Result.startTime.length-3).replace(/\//g,'-');
      //    vm.active_data.endTime=data.Result.endTime.substring(0,data.Result.endTime.length-3).replace(/\//g,'-');
      //    // 获取超过次数后每次需要多杀积分
      //    vm.use_points=data.Result.usePoints
      //    // 剩余的摇奖次数
      //    if((data.Result.luckRest)>0){
      //      vm.hasshaketotals = data.Result.luckRest;
      //    }else{
      //      vm.hasshaketotals = 0;
      //    }
      //    vm.shouldusepoints = data.Result.usePoints;
      //  }
      //  // 由于后台转码问题，需将内联样式中文分号换为英文分号
      //  // $scope.relustxt=$sce.trustAsHtml(data.Result.content.replace(/；/g, ";"));
      //}).error(function(data, status) {
      //  console.log(data)
      //});
    }
    // 获取抽奖信息(中奖)
    function getAwardInfo(dataobj){
      nAPI.getLotteryInfo(vm.activeID)
        .then(function(data){
          wLoading.hide();
          console.log('中奖',data);
          // 剩余的摇奖次数
          if((data.Result.luckRest)>0){
            vm.hasshaketotals = data.Result.luckRest;
            /*ls改 默认0不允许中多次，1为允许中多次 */
            if(data.Result.winLimitType==0){
              /*ls 改 如果限制为不能多次中奖，再次抽奖dataobj.isAward值为true，10029说明已经中过奖*/
              if(dataobj.errorCode==10029){
                //alert('您已中奖');
                vm.shownoresult=true;
                vm.hasnopoints=false;
                vm.nowinning=true;
                return;
              }
              /*ls改 end*/
            }
            /*ls改 end */
          }else{
            vm.hasshaketotals = 0;
            /*ls改 默认0不允许中多次，1为允许中多次 */
            if(data.Result.winLimitType==0){
              if(dataobj.errorCode==10029){
                vm.isMutiShake=1;
                vm.hasnocounts=true;
                return;
              }
            }
            /*ls改 end */
          }

          // 0是自定义、1是积分、2是优惠卷
          if(dataobj.awardsType == 0){
            vm.customName=dataobj.awardName;
            vm.showcustom=true;
          }else if (dataobj.awardsType == 1) {
            vm.Points=dataobj.value;
            vm.showpoints=true;
          }else if(dataobj.awardsType == 2) {
            vm.showintegral = true;
            // 免邮费和满多少减多少暂时分开
            if(dataobj.cardcoupon_type=='MallCardCoupon_FreeFreight'){
              vm.hasnopostage=true;
              vm.hascoupons=false;
              vm.noPostage=dataobj;
            }else{
              vm.hasnopostage=false;
              vm.hascoupons=true;
              vm.couponName=dataobj;
            }
          }


        })
        .catch(function(data){
          console.log(data)
        });
      //$http({
      //  method: "GET",
      //  url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=getLottery&id="+vm.activeID
      //}).success(function(data, status) {
      //  // 剩余的摇奖次数
      //  if((data.Result.luckRest)>0){
      //    vm.hasshaketotals = data.Result.luckRest;
      //  }else{
      //    vm.hasshaketotals = 0;
      //  }
      //}).error(function(data, status) {
      //  console.log(data)
      //});
    }
    //获取抽奖信息(未中奖)
    function getPrizeInfo(){
      nAPI.getLotteryInfo(vm.activeID)
        .then(function(data){
          console.log('未中奖',data);
          // 剩余的摇奖次数
          if((data.Result.luckRest)>0){
            vm.hasshaketotals = data.Result.luckRest;
          }else{
            vm.hasshaketotals = 0;
          }
          vm.shownoresult=true;
          vm.hasnopoints=false;
          vm.nowinning=true;
        })
        .catch(function(data){
          console.log(data);
        });
      //$http({
      //  method: "GET",
      //  url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=getLottery&id="+vm.activeID
      //}).success(function(data, status) {
      //  // 剩余的摇奖次数
      //  if((data.Result.luckRest)>0){
      //    vm.hasshaketotals = data.Result.luckRest;
      //  }else{
      //    vm.hasshaketotals = 0;
      //  }
      //}).error(function(data, status) {
      //  console.log(data)
      //});
    }
  //  KSCJ();
    //开始抽奖
    function KSCJ(){
      nAPI.scratchAward(vm.activeID)
        .then(function(data){
          // 抽奖成功后还原上帝数字
          setTimeout(function(){
            vm.isable=1;
            vm.useTen=false;
          },2000);
          console.log('开始抽奖',data);
          //隐藏抽奖等待
          //$ionicLoading.hide();
          // 中奖
          if (data.isAward == true) {
            // 获取抽奖信息
            vm.getAwardInfo(data);

           // alert(data.awardsType);
           // // 0是自定义、1是积分、2是优惠卷
           // if(data.awardsType == 0){
           //   vm.customName=data.awardName;
           //   vm.showcustom=true;
           // }else if (data.awardsType == 1) {
           //   vm.Points=data.value;
           //   vm.showpoints=true;
           // }else if(data.awardsType == 2) {
           //   vm.showintegral = true;
           //   // 免邮费和满多少减多少暂时分开
           //   if(data.cardcoupon_type=='MallCardCoupon_FreeFreight'){
           //     vm.hasnopostage=true;
           //     vm.hascoupons=false;
           //     vm.noPostage=data;
           //   }else{
           //     vm.hasnopostage=false;
           //     vm.hascoupons=true;
           //     vm.couponName=data;
           //   }
           // }
          }
          // 未中奖
          else {
            wLoading.hide();
            // 活动状态正常
            if(data.errorCode==0){
              // 获取抽奖信息
              vm.getPrizeInfo();
              //vm.shownoresult=true;
              //vm.hasnopoints=false;
              //vm.nowinning=true;
            }
            // 活动未开启
            else if(data.errorCode==10025){
              wLoading.show("活动还未开启，请稍候");
              $timeout(function () {
                wLoading.hide()
              }, 2000);
             // alert('活动还未开启，请稍候');
            }
            // 活动已结束
            else if(data.errorCode==10026){
              wLoading.show("活动已结束");
              $timeout(function () {
                wLoading.hide()
              }, 2000);
             // alert('活动已结束');
            }
            // 活动奖品全部中完了
            else if(data.errorCode==10027){
              wLoading.show("活动奖品全部被人领走咯");
              $timeout(function () {
                wLoading.hide()
              }, 2000);
              //alert('活动奖品全部被人领走咯');
            }
          }
        })
        .catch(function(data){
          console.log(data);
        });
      //$http({
      //  method: "GET",
      //  url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=scratch&id="+vm.activeID
      //}).success(function(data, status) {
      //  // 抽奖成功后还原上帝数字
      //  setTimeout(function(){
      //    vm.isable=1;
      //    vm.useTen=false;
      //  },2000);
      //  // 隐藏抽奖等待
      //  $ionicLoading.hide();
      //  // 中奖
      //  if (data.isAward == true) {
      //    // 获取抽奖信息
      //    vm.getAwardInfo();
      //    // 0是自定义、1是积分、2是优惠卷
      //    if(data.awardsType == 0){
      //      vm.customName=data.awardName;
      //      vm.showcustom=true;
      //    }else if (data.awardsType == 1) {
      //      vm.Points=data.value;
      //      vm.showpoints=true;
      //    }else if(data.awardsType == 2) {
      //      vm.showintegral = true;
      //      // 免邮费和满多少减多少暂时分开
      //      if(data.cardcoupon_type=='MallCardCoupon_FreeFreight'){
      //        vm.hasnopostage=true;
      //        vm.hascoupons=false;
      //        vm.noPostage=data;
      //      }else{
      //        vm.hasnopostage=false;
      //        vm.hascoupons=true;
      //        vm.couponName=data;
      //      }
      //    }
      //  }
      //  // 未中奖
      //  else {
      //    // 活动状态正常
      //    if(data.errorCode==0){
      //      // 获取抽奖信息
      //      vm.getPrizeInfo();
      //      vm.shownoresult=true;
      //      vm.hasnopoints=false;
      //      vm.nowinning=true;
      //    }
      //    // 活动未开启
      //    else if(data.errorCode==10025){
      //      popUp('活动还未开启，请稍候');
      //    }
      //    // 活动已结束
      //    else if(data.errorCode==10026){
      //      popUp('活动已结束');
      //    }
      //    // 活动奖品全部中完了
      //    else if(data.errorCode==10027){
      //      popUp('活动奖品全部被人领走咯');
      //    }
      //  }
      //}).error(function(data, status) {
      //  console.log(data)
      //});
    }
    //开始抽奖
    function startShake(){
      vm.isable=0;
      vm.shownoresult=false;
      vm.showintegral=false;
      vm.hasnocounts=false;
      vm.showcustom=false;
      vm.showpoints=false;
      KSCJ();
    }
    ////再去商品列表中用随机数字取得商品
    //function getRandomProduct(){
    //  mixbluAPI.productList("/mall/product.ashx", {
    //    action: "list",
    //    pageindex:$scope.allnums,
    //    pagesize: 1,
    //    keyword: '',
    //    category_id: '',
    //    tags: '',
    //    color_name: '',
    //    size_name: '',
    //    sort: ''
    //  }, function(data) {
    //    vm.mathproduct=data.list[0];
    //  },function(data){
    //    console.log(data)
    //  });
    //}
    ////获取商品列表
    //function getProductList(){
    //  mixbluAPI.productList("/mall/product.ashx", {
    //    action: "list",
    //    pageindex: 1,
    //    pagesize: 1,
    //    keyword: '',
    //    category_id: '',
    //    tags: '',
    //    color_name: '',
    //    size_name: '',
    //    sort: ''
    //  }, function(data) {
    //    console.log(["获取商品列表成功", data]);
    //    // 得到商品列表的总数并随机
    //    $scope.allnums=Math.ceil(Math.random()*data.totalcount);
    //    console.log($scope.allnums);
    //    // 再去商品列表中用随机数字取得商品
    //    getRandomProduct();
    //  }, function(data) {
    //    console.log(["获取商品列表请求失败", data]);
    //  })
    //}
    //获取当前用户信息
    function getCurrUserInfo(){
      mixbluAPI.currentUserInfo("/user/info.ashx",{
        action:"currentuserinfo"
      },function(data){
        console.log(['data.totalscore',data.totalscore])
        // $scope.totalscore = data.totalscore;
        // 当可用积分大于每次抽奖所需的积分时
        if(data.totalscore>=vm.shouldusepoints){
          if(vm.isStarted==0){
            startShake();
            wLoading.show('抽奖中,请稍后...');
          }else if(vm.isStarted==1){
            wLoading.show("活动还未开启");
            $timeout(function () {
              wLoading.hide();
            }, 2000);
          }
          else if(vm.isStarted==2){
            wLoading.show("活动还未开启");
            $timeout(function () {
              wLoading.hide();
            }, 2000);
          }
          //wLoading.show("抽奖中,请稍后...");
          //$timeout(function () {
          //  wLoading.hide()
          //}, 500);
          //$ionicLoading.show({
          //  template: "抽奖中,请稍后..."
          //});
        }
        // 当积分小于每次抽奖所需的积分时
        else {
          vm.shownoresult = true;
          vm.hasnopoints=true;
          vm.nowinning=false;
        }
        console.log(["获取积分成功",data]);
      },function(data){
        console.log(["获取积分请求失败",data]);
      });
    }
    //检测手机支不支持摇一摇功能
    function deviceMotionHandler(eventData) {
      var acceleration = eventData.accelerationIncludingGravity;
      var curTime = new Date().getTime();
      if ((curTime - last_update) > 100) {
        var diffTime = curTime - last_update;
        last_update = curTime;
        x = acceleration.x;
        y = acceleration.y;
        z = acceleration.z;
        var speed = Math.abs(x + y + z - last_x - last_y - last_z) / diffTime * 10000;
        var status = document.getElementById("status");
        //alert(speed);
       if (speed > SHAKE_THRESHOLD && vm.isable==1 && window.location.href.indexOf('shake')>=0) {
       // if ( vm.isable==1 && window.location.href.indexOf('shake')>=0) {
         // alert('摇一摇');
         if(vm.isStarted==0){
           vm.isable=0;
           // 摇动手机即播放音乐
           audioID.play();
           // 请求活动详情的参数
           nAPI.getLotteryInfo(vm.activeID)
             .then(function(data){
               console.log(data)
               // 此处为判断是否有活动
               if(data.Status!=0){
                 wLoading.show("未找到抽奖活动，请与管理员联系");
                 $timeout(function () {
                   wLoading.hide()
                 }, 2000);
                 //  alert('未找到抽奖活动，请与管理员联系');
               }else{
                 // 剩余的摇奖次数
                 // 当有摇奖次数的时候加载正常的摇奖步骤
                 if((data.Result.luckRest)>0){
                   startShake();
                   wLoading.show('抽奖中,请稍后...');
                   //wLoading.show("抽奖中,请稍后...");
                   //$timeout(function () {
                   //  wLoading.hide()
                   //}, 500);
                   //$ionicLoading.show({
                   //  template: "抽奖中,请稍后..."
                   //});
                 }
                 // 当摇奖次数超过允许的最大摇奖次数时
                 // 1、积分够
                 // 2、积分不够
                 else if((data.Result.luckRest)<=0){
                   // 设置总的摇奖次数为0
                   vm.hasshaketotals=0;
                   // 再判断用户是否还需要再用积分来摇一摇
                   if(vm.useTen==true){
                     //获取可使用积分
                     getCurrUserInfo();
                   }else {
                     vm.hasnocounts=true;
                     //  getProductList();
                     setTimeout(function() {
                       vm.isable=1;
                     },2000)
                   }
                 }

               }
               // 由于后台转码问题，需将内联样式中文分号换为英文分号
               // $scope.relustxt=$sce.trustAsHtml(data.Result.content.replace(/；/g, ";"));
             })
             .catch(function(data){
               console.log(data);
             });

           //$http({
           //  method: "GET",
           //  url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=getLottery&id="+vm.activeID
           //}).success(function(data, status) {
           //  console.log(data)
           //  // 此处为判断是否有活动
           //  if(data.Status!=0){
           //    popUp('未找到抽奖活动，请与管理员联系');
           //  }else{
           //    // 剩余的摇奖次数
           //    // 当有摇奖次数的时候加载正常的摇奖步骤
           //    if((data.Result.luckRest)>0){
           //      startShake();
           //      $ionicLoading.show({
           //        template: "抽奖中,请稍后..."
           //      });
           //    }
           //    // 当摇奖次数超过允许的最大摇奖次数时
           //    // 1、积分够
           //    // 2、积分不够
           //    else if((data.Result.luckRest)<=0){
           //      // 设置总的摇奖次数为0
           //      vm.hasshaketotals=0;
           //      // 再判断用户是否还需要再用积分来摇一摇
           //      if(vm.useTen==true){
           //        //获取可使用积分
           //        getCurrUserInfo();
           //      }else {
           //        vm.hasnocounts=true;
           //        getProductList();
           //        setTimeout(function() {
           //          vm.isable=1;
           //        },2000)
           //      }
           //    }
           //
           //  }
           //  // 由于后台转码问题，需将内联样式中文分号换为英文分号
           //  // $scope.relustxt=$sce.trustAsHtml(data.Result.content.replace(/；/g, ";"));
           //}).error(function(data, status) {
           //  console.log(data)
           //});
         }
         else if(vm.isStarted==1){
           wLoading.show("活动还未开启");
           $timeout(function () {
             wLoading.hide();
           }, 2000);
         }
         else if(vm.isStarted==2){
           wLoading.show("活动已结束");
           $timeout(function () {
             wLoading.hide();
           }, 2000);
         }

        }
        last_x = x;
        last_y = y;
        last_z = z;
      }
    }
    //关闭积分用完的界面
    function closeNoPointBtn(){
      vm.isable=1;
      vm.useTen=true;
      vm.shownoresult = false;
      vm.hasnopoints=false;
    }
    // 用积分抽奖
    function shakeUsePoint(){
        vm.isable=1;
        vm.useTen=true;
        vm.hasnocounts=false;
    }
    //获取活动信息
    function getActiveInfo(){
      getLotteryInfo();
      // 用积分抽奖
      //$scope.goshake=function(){
      //  vm.isable=1;
      //  vm.useTen=true;
      //  vm.hasnocounts=false;
      //};
     // getAward();测试
      if (window.DeviceMotionEvent) {
        // alert('支持摇一摇')
        window.addEventListener('devicemotion', deviceMotionHandler, false);
         //alert(vm.isable)
      } else {
        wLoading.show("本设备不支持摇一摇功能");
        $timeout(function () {
          wLoading.hide()
        }, 2000);
       // alert('本设备不支持摇一摇功能');
      }
      //// 显示活动规则
      //$scope.showactiveBtn=function(){
      //  $scope.showactive=!$scope.showactive;
      //}
      //// 关闭活动规则
      //$scope.closeactiveBtn=function(){
      //  $scope.showactive=false;//是否显示活动规则
      //}
      //// 关闭未中奖界面
      //$scope.closenoresultBtn=function(){
      //  vm.shownoresult=false;
      //};
      //// 关闭积分用完的界面
      //vm.closenopointsBtn=function(){
      //  vm.isable=1;
      //  vm.useTen=true;
      //  vm.shownoresult = false;
      //  vm.hasnopoints=false;
      //};
      //// 关闭优惠卷中奖界面
      //$scope.closeintegralBtn=function(){
      //  vm.showintegral=false;
      //}
      //// 关闭推荐商品
      //$scope.closenocountsBtn=function(){
      //  vm.hasnocounts=false;
      //  vm.useTen=false;
      //}
      //// 关闭自定义中奖
      //$scope.closecustomBtn=function(){
      //  vm.showcustom=false;
      //}
      //// 关闭自定义中奖
      //$scope.closepointsBtn=function(){
      //  vm.showpoints=false;
      //}
    }
    //获取底部导航
    function getBottomNav(){
      nAPI.getNavList(vm.active_data.toolbarbutton)
        .then(function(data){
          vm.buttons=data;
        })
        .catch(function(data){

        });
    }
    //点击底部导航跳转
    function goToLink(button){
      window.location.href=button.navigation_link;
    }

    //分界线
   // console.log($rootScope.iscomeshakessss);

  }
})();
