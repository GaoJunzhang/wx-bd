const Util = require('./utils/util.js');
var qcloud = require('./index.js');
var constants = require('./lib/constants');
var utils = require('./lib/utils');
var Session = require('./lib/session');
let session = Session.get();
var loginLib = require('./lib/login');
//app.js
App({
  globalData:{
    hasLogin: false,
    tag: 1,
    name: '',
    isTime: 0,
    startDate: '',
    endDate: '',
    isLimit: 0,
  },
  onLaunch: function () {
    let that = this;
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate
    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      console.log(res.hasUpdate)
    })
    updateManager.onUpdateReady(function () {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: function (res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })
    updateManager.onUpdateFailed(function () {
      // 新的版本下载失败
      wx.showModal({
        title: '更新提示',
        content: '新版本下载失败',
        showCancel: false
      })
    })
    //检查网络
    wx.onNetworkStatusChange(function (res) {
      that.globalData.isConnected = res.isConnected
      if (!res.isConnected) {
        wx.showModal({
          content: '请检查您的网络状态',
          showCancel: false
        })
      }
    })
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo']) {
          wx.navigateTo({
            url: '/pages/authon/authon',
          })
        } else {
          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = res.rawData
            }
          })
        }
      }
    })
    wx.getSystemInfo({
      success: function (res) {
        wx.setStorageSync('systemInfo', res)
        var ww = res.windowWidth;
        var hh = res.windowHeight;
        that.globalData.ww = ww;
        that.globalData.hh = hh;
      }
    })
  },
  globalData: {
    userInfo: null,
    API_URL: 'https://wxapp.seeyoo-tech.cn/',
    IMG_URL: 'https://wxapp.seeyoo-tech.cn',
    carts: [],
    coupons: [],
    maps: [],
  }
})