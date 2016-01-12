(function() {
    'use strict';

    angular
        .module('shake')
        .controller('shakeCenterCtrl', shakeCenterCtrl);

    /** 搜索附近商店 */
    function shakeCenterCtrl($http,$scope,$stateParams,$rootScope) {
      // if($rootScope.iscomeshake==true){
      //       location.reload();
      // }
        console.log($rootScope.iscomeshakessss)
        if ($rootScope.iscomeshakessss == undefined) {
            $rootScope.iscomeshakessss = 0;
        } else {
            location.reload();
            $rootScope.iscomeshakessss = undefined;
        }
        isLogin(function() {
            // 登录的情况下才显示购物车的内容，否则不显示的
            console.log("已经登陆");
            getactive();
        }, function() {
            loading("请先登录",200,function(){
                // 测试跳转我们内部的好测试
                // $state.go("login");
                // 正式跳转
                window.location.href=$rootScope.ykzcurl;
            });
        });
        var audioID=document.getElementById("showAudio");
        function getactive(){
            // 活动的ID
            var activeID=$stateParams.SC_ID;
            // 获取抽奖信息
            function getnums(){
                          $scope.isable=1;
            $scope.useTen=false;
                $http({
                    method: "GET",
                    url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=getLottery&id="+activeID
                }).success(function(data, status) {
                    console.log(data)
                    // 此处为判断是否有活动
                    if(data.Status!=0){
                        popUp('未找到抽奖活动，请与管理员联系');
                    }else{
                        $scope.award_datas=data.Result.awards;
                        $scope.active_data=data.Result;
                        $scope.active_data.startTime=data.Result.startTime.substring(0,data.Result.startTime.length-3).replace(/\//g,'-');
                        $scope.active_data.endTime=data.Result.endTime.substring(0,data.Result.endTime.length-3).replace(/\//g,'-');
                        // 获取超过次数后每次需要多杀积分
                        $scope.use_points=data.Result.usePoints
                        // 剩余的摇奖次数
                        if((data.Result.luckRest)>0){
                            $scope.hasshaketotals = data.Result.luckRest;
                        }else{
                            $scope.hasshaketotals = 0;
                        }
                        $scope.shouldusepoints = data.Result.usePoints;
                    }
                    // 由于后台转码问题，需将内联样式中文分号换为英文分号
                    // $scope.relustxt=$sce.trustAsHtml(data.Result.content.replace(/；/g, ";"));
                }).error(function(data, status) {
                    console.log(data)
                });
            }
            getnums();

            function KSCJ(){
                $http({
                    method: "GET",
                    url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=scratch&id="+activeID
                }).success(function(data, status) {
                    // 抽奖成功后还原上帝数字
                    setTimeout(function(){
                        $scope.isable=1;
                        $scope.useTen=false;
                    },2000)
                    // 隐藏抽奖等待
                    $ionicLoading.hide();
                    // 中奖
                    if (data.isAward == true) {
                        // 获取抽奖信息
                        $http({
                            method: "GET",
                            url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=getLottery&id="+activeID
                        }).success(function(data, status) {
                            // 剩余的摇奖次数
                            if((data.Result.luckRest)>0){
                                $scope.hasshaketotals = data.Result.luckRest;
                            }else{
                                $scope.hasshaketotals = 0;
                            }
                        }).error(function(data, status) {
                            console.log(data)
                        });
                        // 0是自定义、1是积分、2是优惠卷
                        if(data.awardsType == 0){
                            $scope.customName=data.awardName;
                            $scope.showcustom=true;
                        }else if (data.awardsType == 1) {
                            $scope.Points=data.value;
                            $scope.showpoints=true;
                        }else if(data.awardsType == 2) {
                            $scope.showintegral = true;
                            // 免邮费和满多少减多少暂时分开
                            if(data.cardcoupon_type=='MallCardCoupon_FreeFreight'){
                                $scope.hasnopostage=true;
                                $scope.hascoupons=false;
                                $scope.noPostage=data;
                            }else{
                                $scope.hasnopostage=false;
                                $scope.hascoupons=true;
                                $scope.couponName=data;
                            }
                        }
                    }
                    // 未中奖
                    else {
                        // 活动状态正常
                        if(data.errorCode==0){
                            // 获取抽奖信息
                            $http({
                                method: "GET",
                                url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=getLottery&id="+activeID
                            }).success(function(data, status) {
                                // 剩余的摇奖次数
                                if((data.Result.luckRest)>0){
                                    $scope.hasshaketotals = data.Result.luckRest;
                                }else{
                                    $scope.hasshaketotals = 0;
                                }
                            }).error(function(data, status) {
                                console.log(data)
                            });
                            $scope.shownoresult=true;
                            $scope.hasnopoints=false;
                            $scope.nowinning=true;
                        }
                        // 活动未开启
                        else if(data.errorCode==10025){
                            popUp('活动还未开启，请稍候');
                        }
                        // 活动已结束
                        else if(data.errorCode==10026){
                            popUp('活动已结束');
                        }
                        // 活动奖品全部中完了
                        else if(data.errorCode==10027){
                            popUp('活动奖品全部被人领走咯');
                        }
                    }
                }).error(function(data, status) {
                    console.log(data)
                });
            }
            // 用积分抽奖
            $scope.goshake=function(){
                $scope.isable=1;
                $scope.useTen=true;
                $scope.hasnocounts=false;
            }
            // 开始抽奖　
            function startshake() {
                $scope.isable=0;
                $scope.shownoresult=false;
                $scope.showintegral=false;
                $scope.hasnocounts=false;
                $scope.showcustom=false;
                $scope.showpoints=false;
                KSCJ();

            }
            var SHAKE_THRESHOLD = 2000;
            var last_update = 0;
            var x,y,z,last_x,last_y,last_z=0;
            if (window.DeviceMotionEvent) {
                // alert('支持摇一摇')
                window.addEventListener('devicemotion', deviceMotionHandler, false);
                // alert($scope.isable)
            } else {
                popUp('本设备不支持摇一摇功能');
            }
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
                    if (speed > SHAKE_THRESHOLD && $scope.isable==1 && window.location.href.indexOf('shakeCenter')>=0) {
                        $scope.isable=0;
                        // 摇动手机即播放音乐
                        audioID.play();
                        // 请求活动详情的参数
                        $http({
                            method: "GET",
                            url: $rootScope.mainsiteurl+"/serv/AWARDAPI.ashx?action=getLottery&id="+activeID
                        }).success(function(data, status) {
                            console.log(data)
                            // 此处为判断是否有活动
                            if(data.Status!=0){
                                popUp('未找到抽奖活动，请与管理员联系');
                            }else{
                                // 剩余的摇奖次数
                                // 当有摇奖次数的时候加载正常的摇奖步骤
                                if((data.Result.luckRest)>0){
                                    startshake();
                                    $ionicLoading.show({
                                        template: "抽奖中,请稍后..."
                                    });
                                }
                                // 当摇奖次数超过允许的最大摇奖次数时
                                // 1、积分够
                                // 2、积分不够
                                else if((data.Result.luckRest)<=0){
                                    // 设置总的摇奖次数为0
                                    $scope.hasshaketotals=0;
                                    // 再判断用户是否还需要再用积分来摇一摇
                                    if($scope.useTen==true){
                                        //获取可使用积分
                                        mixbluAPI.currentUserInfo("/user/info.ashx",{
                                            action:"currentuserinfo"
                                        },function(data){
                                            console.log(['data.totalscore',data.totalscore])
                                            // $scope.totalscore = data.totalscore;
                                            // 当可用积分大于每次抽奖所需的积分时
                                            if(data.totalscore>=$scope.use_points){
                                                startshake();
                                                $ionicLoading.show({
                                                    template: "抽奖中,请稍后..."
                                                });
                                            }
                                            // 当积分小于每次抽奖所需的积分时
                                            else {
                                                $scope.shownoresult = true;
                                                $scope.hasnopoints=true;
                                                $scope.nowinning=false;
                                            }
                                            console.log(["获取积分成功",data]);
                                        },function(data){
                                            console.log(["获取积分请求失败",data]);
                                        });
                                    }else {
                                        $scope.hasnocounts=true;
                                        $scope.mathproduct={};
                                        mixbluAPI.productList("/mall/product.ashx", {
                                            action: "list",
                                            pageindex: 1,
                                            pagesize: 1,
                                            keyword: '',
                                            category_id: '',
                                            tags: '',
                                            color_name: '',
                                            size_name: '',
                                            sort: ''
                                        }, function(data) {
                                            console.log(["获取商品列表成功", data]);
                                            // 得到商品列表的总数并随机
                                            $scope.allnums=Math.ceil(Math.random()*data.totalcount);
                                            console.log($scope.allnums)
                                            // 再去商品列表中用随机数字去得商品
                                            mixbluAPI.productList("/mall/product.ashx", {
                                                action: "list",
                                                pageindex:$scope.allnums,
                                                pagesize: 1,
                                                keyword: '',
                                                category_id: '',
                                                tags: '',
                                                color_name: '',
                                                size_name: '',
                                                sort: ''
                                            }, function(data) {
                                                $scope.mathproduct=data.list[0];
                                            },function(data){
                                                console.log(data)
                                            })
                                        }, function(data) {
                                            console.log(["获取商品列表请求失败", data]);
                                        })
                                        setTimeout(function() {
                                          $scope.isable=1;
                                        },2000)
                                    }
                                }

                            }
                            // 由于后台转码问题，需将内联样式中文分号换为英文分号
                            // $scope.relustxt=$sce.trustAsHtml(data.Result.content.replace(/；/g, ";"));
                        }).error(function(data, status) {
                            console.log(data)
                        });
                    }
                    last_x = x;
                    last_y = y;
                    last_z = z;
                }
            }
            // 显示活动规则
            $scope.showactiveBtn=function(){
                $scope.showactive=!$scope.showactive;
            }
            // 关闭活动规则
            $scope.closeactiveBtn=function(){
                $scope.showactive=false;
            }
            // 关闭未中奖界面
            $scope.closenoresultBtn=function(){
                $scope.shownoresult=false;
            }
            // 关闭积分用完的界面
            $scope.closenopointsBtn=function(){
                $scope.isable=1;
                $scope.useTen=true;
                $scope.shownoresult = false;
                $scope.hasnopoints=false;
            }
            // 关闭优惠卷中奖界面
            $scope.closeintegralBtn=function(){
                $scope.showintegral=false;
            }
            // 关闭推荐商品
            $scope.closenocountsBtn=function(){
                $scope.hasnocounts=false;
                $scope.useTen=false;
            }
            // 关闭自定义中奖
            $scope.closecustomBtn=function(){
                $scope.showcustom=false;
            }
            // 关闭自定义中奖
            $scope.closepointsBtn=function(){
                $scope.showpoints=false;
            }
        }
    }
})();
