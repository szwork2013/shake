/**
 * Created by add on 2016/1/22.
 */
(function () {
  'use strict';

  angular
    .module('shake')
    .controller('shakeCtrl', shakeCtrl);

  /** @ngInject */
  /* jshint validthis: true */
  function shakeCtrl($scope, $stateParams, $timeout, nAPI, wLoading) {
    /* jshint validthis: true */
    var vm = this;
    vm.titleNm = '';
    vm.activeID = $stateParams.activityId; // 活动的ID
    vm.dataInfo = [];//活动信息存放
    vm.awardInfo = [];//中奖信息存放
    vm.currUserScore = 0;//当前用户积分
    vm.isStarted = 0;  //是否到了抽奖或者过了抽奖时间  0表示正常 1表示还没到抽奖时间，2表示过了抽奖时间
    vm.shakeLeftNm = '0';//0是每人多少次，1是每天多少次 当没有获取到数据时默认为显示0次
    vm.showNoPointNm = '';//当为每人多少次时显示  请下次活动再来；   当为每天多少次显示 请明天再来
    vm.showNoTimeNm = '';//当为每人多少次时显示  您的次数用完；   当为每天多少次显示 今日次数用完
    vm.buttons = [];//底部导航栏
    vm.isCouldShake = true;//是否可以摇动手机,进入抽奖后设置为false,抽完奖后再次设置为true
    vm.isUseScore = false;//是否使用积分
    vm.isShowUseScore = false;//是否显示使用积分按钮
    vm.showNoPoint = false;//显示积分不足页面
    vm.showLostLottery = false;//显示未中奖页面
    vm.showCoupon = false;//显示免邮券页面
    vm.showFull = false;//显示满减页面
    vm.showPoints = false;//显示积分中奖页面
    vm.showCustomize = false;//显示自定义中奖页面
    vm.showNoTimes = false;//显示没有次数页面
    vm.result = 0;  //显示还能摇多少次
    vm.runtimes = 0;//运行次数，测试变量测试用
    /*手机摇动的时候参数*/
    var SHAKE_THRESHOLD = 2000;
    var last_update = 0;
    var x, y, z, last_x, last_y, last_z = 0;
    /*手机摇动的时候*/
    vm.getCurrUserInfo = getCurrUserInfo;//获取当前用户信息
    vm.getActiveInfo = getActiveInfo; //获取活动信息
    vm.getLotteryInfo = getLotteryInfo;//获取抽奖信息
    vm.deviceMotionHandler = deviceMotionHandler; //判断设备是否支持摇一摇
    vm.startShake = startShake;//开始抽奖
    vm.getBottomNav = getBottomNav;//获取底部导航按钮
    vm.goToLink = goToLink;//底部导航点击方法
    vm.beforeShakeCheck = beforeShakeCheck;//摇奖前检查
    vm.shakeUsePointFunc = shakeUsePointFunc;  //没有积分时点击使用积分
    var audioID = document.getElementById("showAudio");
    document.title = '摇一摇';

    isLogin();
    //判断登录
    function isLogin() {
      nAPI.isLogin()
        .then(
        function (data) {
          console.log(data);
          if (data.is_login) {
            //登录时获取用户信息
            vm.getCurrUserInfo();
          }
          else {
            wLoading.show("请先登录！");
            $timeout(function () {
              wLoading.hide()
            }, 2000)
          }
        }
      )
        .catch(
        function (data) {
          wLoading.show("请先登录！");
          $timeout(function () {
            wLoading.hide()
          }, 2000);
        }
      );
    }

    //获取当前用户信息
    function getCurrUserInfo() {
      nAPI.userInfo('')
        .then(function (data) {
          console.log(['data.totalscore', data.totalscore]);
          //获取当前用户的积分
          vm.currUserScore = data.totalscore;
          //获取当前活动信息
          getActiveInfo();
        })
        .catch(function (data) {
          console.log(["获取积分请求失败", data]);
        });
    }

    //获取活动信息
    function getActiveInfo() {
      getLotteryInfo();
      if (window.DeviceMotionEvent) {
        window.addEventListener('devicemotion', deviceMotionHandler, false);
      } else {
        wLoading.show("本设备不支持摇一摇功能");
        $timeout(function () {
          wLoading.hide()
        }, 2000);
      }
    }

    //获取抽奖信息
    function getLotteryInfo() {
      nAPI.getLotteryInfo(vm.activeID)
        .then(function (data) {
          console.log('活动信息', data);
          // 此处为判断是否有活动
          if (data.Status != 0) {
            wLoading.show("未找到抽奖活动，请与管理员联系");
            $timeout(function () {
              wLoading.hide()
            }, 2000);
          } else {
            vm.dataInfo = data.Result;
            console.log('vm.dataInfo',vm.dataInfo);
            //luckLimitType  参与次数类型，0是每人多少次，1是每天多少次
            if (data.Result.luckLimitType == 0) {
              vm.shakeLeftNm = '您还能摇';
              vm.showNoPointNm = '请下次活动再来';
              vm.showNoTimeNm = '您的次数用完';
            } else if (data.Result.luckLimitType == 1) {
              vm.shakeLeftNm = '今天还能摇';
              vm.showNoPointNm = '请明天再来';
              vm.showNoTimeNm = '今日次数用完';
            }
            //判断当次数为负的时候设置为0
            if(data.Result.luckRest<0){
              vm.result = 0;
            }
            else{
              vm.result = data.Result.luckRest;
            }
            vm.titleNm = data.Result.websiteownername; //获取站点名称
            var today = (new Date()).getTime();
            var startTime = (new Date(data.Result.startTime)).getTime();
            var endTime = (new Date(data.Result.endTime)).getTime();
            if (today > startTime && today < endTime) {
              //true表示在正常时间内，可以正常抽奖
              vm.isStarted = 0;
            }
            else {
              //开始时间是否到了 1表示还没到时间
              if (today < startTime) {
                vm.isStarted = 1;
                wLoading.show("活动还未开启");
                $timeout(function () {
                  wLoading.hide();
                }, 2000);
              }
              //是否过了结束时间 2表示过了结束时间
              else if (today > endTime) {
                vm.isStarted = 2;
                wLoading.show("活动已结束");
                $timeout(function () {
                  wLoading.hide();
                }, 2000);
              }
            }
            getBottomNav();
            vm.dataInfo.startTime = data.Result.startTime.substring(0, data.Result.startTime.length - 3).replace(/\//g, '-');
            vm.dataInfo.endTime = data.Result.endTime.substring(0, data.Result.endTime.length - 3).replace(/\//g, '-');
            ////测试
            //if (vm.runtimes == 0) {
            //  beforeShakeCheck();
            //  vm.runtimes = 1;
            //}
            wx.ready(function () {
              wxapi.wxshare({
                title: data.Result.name,
                desc: data.Result.shareDesc,
                link: window.location.href,
                imgUrl: data.Result.shareImg
              }, '')
            });
          }
        })
        .catch(function (data) {
          console.log(data)
        });
    }

    //调用抽奖接口时检查
    function beforeShakeCheck() {
      if (vm.isStarted == 0) {
        vm.isCouldShake = false; //在活动进行中的时候设置为false，防止抽奖的时候再次摇动手机进来一直调接口
        if (vm.dataInfo.luckRest > 0) {
          startShake();
        }
        if (vm.dataInfo.luckRest == 0) {
          //强制渲染 双向绑定
          $scope.$apply(function () {
            vm.showNoTimes = true; //显示次数不足页面
          });
          //vm.showNoTimes = true; //显示次数不足页面
          if (vm.dataInfo.winLimitType == 0) {
            $scope.$apply(function () {
              vm.isShowUseScore = false;//不开放积分摇奖
            });
          }
          else if (vm.dataInfo.winLimitType == 1&&vm.dataInfo.usePoints>0) {
            $scope.$apply(function () {
              vm.isShowUseScore = true;//开放积分摇奖
            });
          }
        }
        if (vm.dataInfo.luckRest < 0) {
          //积分够
          if (vm.currUserScore >= vm.dataInfo.usePoints) {
            if (vm.isUseScore) {
              startShake();
            }
          } else {//积分不够
            $scope.$apply(function () {
              vm.isShowUseScore = false; //是否显示使用积分按钮
              vm.showNoPoint = true; //显示积分不足页面
            });
          }
        }
      }
      else if (vm.isStarted == 1) {
        wLoading.show("活动还未开启");
        $timeout(function () {
          wLoading.hide();
        }, 2000);
      }
      else if (vm.isStarted == 2) {
        wLoading.show("活动已结束");
        $timeout(function () {
          wLoading.hide();
        }, 2000);
      }
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
        if (speed > SHAKE_THRESHOLD && vm.isCouldShake && window.location.href.indexOf('shake') >= 0) {
          // 摇动手机即播放音乐
          audioID.play();
          beforeShakeCheck();
        }
        last_x = x;
        last_y = y;
        last_z = z;
      }
    }

    //开始抽奖
    function startShake() {
      wLoading.show('抽奖中,请稍后...');
      nAPI.scratchAward(vm.activeID)
        .then(function (data) {
          //  vm.isCouldShake = true;
          wLoading.hide();
          console.log('开始抽奖', data);
          vm.awardInfo = data;  //将摇奖结果存,.起来，便于没有区分允许多次中奖和不允许多次中奖判断

          //新加
          if (vm.dataInfo.winLimitType == 0) {
            if (data.isAward) {
              vm.dataInfo.luckRest = vm.dataInfo.luckRest - 1;
              if (data.errorCode == 10029) {
                if (vm.dataInfo.luckRest >= 0) {
                  vm.result = vm.dataInfo.luckRest;
                  vm.showLostLottery = true;  //当有次数的时候已中奖显示未中奖页面
                }
                else {
                  vm.result = 0;
                  vm.showNoTimes = true; //显示次数不足页面
                  vm.isShowUseScore = false; //已中奖摇奖次数为0不开放积分摇奖
                }
              }
              else {
                if (vm.dataInfo.luckRest >= 0) {
                  vm.result = vm.dataInfo.luckRest;
                }
                else {
                  vm.result = 0;
                }
                // 0是自定义、1是积分、2是优惠卷
                if (data.awardsType == 0) {
                  vm.showCustomize = true;
                } else if (data.awardsType == 1) {
                  vm.showPoints = true;
                } else if (data.awardsType == 2) {
                  // 免邮费和满多少减多少暂时分开
                  if (data.cardcoupon_type == 'MallCardCoupon_FreeFreight') {
                    vm.showCoupon = true;
                    vm.showFull = false;
                  } else {
                    vm.showCoupon = false;
                    vm.showFull = true;
                  }
                }
              }
            }
            else if (!data.isAward) {
              vm.dataInfo.luckRest = vm.dataInfo.luckRest - 1;
              if (vm.dataInfo.luckRest > 0) {
                vm.result = vm.dataInfo.luckRest;
                // 活动状态正常
                if (data.errorCode == 0) {
                  vm.showLostLottery = true;
                }
                // 活动未开启
                else if (data.errorCode == 10025) {
                  wLoading.show("活动还未开启");
                  $timeout(function () {
                    wLoading.hide();
                  }, 2000);
                }
                // 活动已结束
                else if (data.errorCode == 10026) {
                  wLoading.show("活动已结束");
                  $timeout(function () {
                    wLoading.hide()
                  }, 2000);
                }
                // 活动奖品全部中完了
                else if (data.errorCode == 10027) {
                  wLoading.show("活动奖品全部被人领走啦~");
                  $timeout(function () {
                    wLoading.hide()
                  }, 2000);
                }
                // 摇奖次数超限
                else if (data.errorCode == 10028) {
                  wLoading.show("摇奖次数超限");
                  $timeout(function () {
                    wLoading.hide()
                  }, 2000);
                }
              }
              if (vm.dataInfo.luckRest == 0) {
                vm.result = 0;
                vm.showNoTimes = true; //显示次数不足页面
                if(vm.dataInfo.usePoints>0){
                  vm.isShowUseScore = true;//开放积分摇奖
                }
              }
              if (vm.dataInfo.luckRest < 0) {
                vm.result = 0;
                if (vm.currUserScore == 0) {
                  vm.isShowUseScore = false; //是否显示使用积分按钮
                  vm.showNoPoint = true; //显示积分不足页面
                }
                else {
                  //积分够
                  if (vm.currUserScore >= vm.dataInfo.usePoints) {
                    if (vm.isUseScore) {
                      vm.currUserScore = vm.currUserScore - vm.dataInfo.usePoints; //用积分的话减去所用积分
                    }
                    // 活动状态正常
                    if (data.errorCode == 0) {
                      vm.showLostLottery = true;
                    }
                    // 活动未开启
                    else if (data.errorCode == 10025) {
                      wLoading.show("活动还未开启");
                      $timeout(function () {
                        wLoading.hide();
                      }, 2000);
                    }
                    // 活动已结束
                    else if (data.errorCode == 10026) {
                      wLoading.show("活动已结束");
                      $timeout(function () {
                        wLoading.hide()
                      }, 2000);
                    }
                    // 活动奖品全部中完了
                    else if (data.errorCode == 10027) {
                      wLoading.show("活动奖品全部被人领走啦~");
                      $timeout(function () {
                        wLoading.hide()
                      }, 2000);
                    }
                    // 摇奖次数超限
                    else if (data.errorCode == 10028) {
                      wLoading.show("摇奖次数超限");
                      $timeout(function () {
                        wLoading.hide()
                      }, 2000);
                    }

                  } else {//积分不够
                    vm.isShowUseScore = false; //是否显示使用积分按钮
                    vm.showNoPoint = true; //显示积分不足页面
                  }
                }
              }
            }
          }
          else if (vm.dataInfo.winLimitType == 1) {
            if (data.isAward) {
              vm.dataInfo.luckRest = vm.dataInfo.luckRest - 1;
              if (vm.dataInfo.luckRest >= 0) {
                vm.result = vm.dataInfo.luckRest;
              }
              else {
                vm.result = 0;
              }
              // 0是自定义、1是积分、2是优惠卷
              if (data.awardsType == 0) {
                vm.showCustomize = true;
              } else if (data.awardsType == 1) {
                vm.showPoints = true;
              } else if (data.awardsType == 2) {
                // 免邮费和满多少减多少暂时分开
                if (data.cardcoupon_type == 'MallCardCoupon_FreeFreight') {
                  vm.showCoupon = true;
                  vm.showFull = false;
                } else {
                  vm.showCoupon = false;
                  vm.showFull = true;
                }
              }
            }
            else if (!data.isAward) {
              vm.dataInfo.luckRest = vm.dataInfo.luckRest - 1;
              if (vm.dataInfo.luckRest > 0) {
                vm.result = vm.dataInfo.luckRest;
                // 活动状态正常
                if (data.errorCode == 0) {
                  vm.showLostLottery = true;
                }
                // 活动未开启
                else if (data.errorCode == 10025) {
                  wLoading.show("活动还未开启");
                  $timeout(function () {
                    wLoading.hide();
                  }, 2000);
                }
                // 活动已结束
                else if (data.errorCode == 10026) {
                  wLoading.show("活动已结束");
                  $timeout(function () {
                    wLoading.hide()
                  }, 2000);
                }
                // 活动奖品全部中完了
                else if (data.errorCode == 10027) {
                  wLoading.show("活动奖品全部被人领走啦~");
                  $timeout(function () {
                    wLoading.hide()
                  }, 2000);
                }
                // 摇奖次数超限
                else if (data.errorCode == 10028) {
                  wLoading.show("摇奖次数超限");
                  $timeout(function () {
                    wLoading.hide()
                  }, 2000);
                }
              }
              if (vm.dataInfo.luckRest == 0) {
                vm.result = 0;
                vm.showNoTimes = true; //显示次数不足页面
                if(vm.dataInfo.usePoints>0){
                  vm.isShowUseScore = true;//开放积分摇奖
                }
              }
              if (vm.dataInfo.luckRest < 0) {
                vm.result = 0;
                if (vm.currUserScore == 0) {
                  vm.isShowUseScore = false; //是否显示使用积分按钮
                  vm.showNoPoint = true; //显示积分不足页面
                }
                else {
                  //积分够
                  if (vm.currUserScore >= vm.dataInfo.usePoints) {
                    if (vm.isUseScore) {
                      vm.currUserScore = vm.currUserScore - vm.dataInfo.usePoints; //用积分的话减去所用积分
                    }
                    // 活动状态正常
                    if (data.errorCode == 0) {
                      vm.showLostLottery = true;
                    }
                    // 活动未开启
                    else if (data.errorCode == 10025) {
                      wLoading.show("活动还未开启");
                      $timeout(function () {
                        wLoading.hide();
                      }, 2000);
                    }
                    // 活动已结束
                    else if (data.errorCode == 10026) {
                      wLoading.show("活动已结束");
                      $timeout(function () {
                        wLoading.hide()
                      }, 2000);
                    }
                    // 活动奖品全部中完了
                    else if (data.errorCode == 10027) {
                      wLoading.show("活动奖品全部被人领走啦~");
                      $timeout(function () {
                        wLoading.hide()
                      }, 2000);
                    }
                    // 摇奖次数超限
                    else if (data.errorCode == 10028) {
                      wLoading.show("摇奖次数超限");
                      $timeout(function () {
                        wLoading.hide()
                      }, 2000);
                    }

                  } else {//积分不够
                    vm.isShowUseScore = false; //是否显示使用积分按钮
                    vm.showNoPoint = true; //显示积分不足页面
                  }
                }
              }
            }
          }
          //end新加
        })
        .catch(function (data) {
          // vm.isCouldShake = true;
          wLoading.hide();
          console.log(data);
        });
    }

    //获取底部导航
    function getBottomNav() {
      if (vm.dataInfo.toolbarbutton != '') {
        nAPI.getNavList(vm.dataInfo.toolbarbutton)
          .then(function (data) {
            vm.buttons = data;
          })
          .catch(function (data) {

          });
      }
    }

    //点击底部导航跳转
    function goToLink(button) {
      window.location.href = button.navigation_link;
    }

    //没有积分时点击使用积分
    function shakeUsePointFunc() {
        vm.isUseScore = true; //使用积分
        vm.showNoTimes = false; //关闭该弹出框
        vm.dataInfo.luckRest = vm.dataInfo.luckRest - 1; //将摇奖次数减1
        vm.isCouldShake = true;  //该参数控制手机摇动时是否调用抽奖接口
    }
  }
})();
