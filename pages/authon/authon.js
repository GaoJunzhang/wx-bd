var app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userInfo']) {
          wx.navigateTo({
            url: '/pages/authon/authon',
          })
        } else {
          wx.getUserInfo({
            success: function (res) {
              app.globalData.userInfo = res.rawData
            }
          })
        }
      }
    })
  },
  onGotUserInfo: function (e) {
    console.log(e.detail.userInfo)
    if (e.detail.userInfo) {
      wx.navigateBack({
        delta: 2
      })
    }
  }
})