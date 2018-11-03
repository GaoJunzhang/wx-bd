var api = require('../../config/api.js');
var util = require('../../utils/utils.js');

const app = getApp()

Page({
  data: {
    imgs: [{
      img: 'https://wxapp.seeyoo-tech.cn/bd/wx/banner.jpg'
    }],
    vertical: false,
    autoplay: true,
    circular: false,
    interval: 2000,
    duration: 500,
    previousMargin: 0,
    nextMargin: 0,
  },

  onLoad: function() {
    let that = this
    goods(that,null)
  }
})
function goods (that,param){
  util.request(api.IndexUrl).then(function (res) {
    if (res.errcode === 0) {
      that.setData({
        categorys: res.categorys,
        select:res.categorys[0].id
      });
    }
  });
}