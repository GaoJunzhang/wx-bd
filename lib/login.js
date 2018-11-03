var utils = require('./utils.js');
var constants = require('./constants.js');
var Session = require('./session.js');
var app = getApp();

/**
 * @class
 * 登录过程中异常
 */
var LoginError = (function() {
  function LoginError(type, message) {
    Error.call(this, message);
    this.type = type;
    this.message = message;
  }

  LoginError.prototype = new Error();
  LoginError.prototype.constants = LoginError;
  return LoginError;
})();

var getWxLoginResult = function getLoginCode(callback) {
  wx.login({
    success: function(loginResult) {
      callback(null, {
        code: loginResult.code
      });
    },
    fail: function(loginError) {
      var error = new LoginError(constants.ERR_WX_LOGIN_FAILED, '微信登录失败，请检查网络状态');
      error.detail = loginError;
      callback(error, null);
    }
  })
}

var noop = function noop() {};
var defaultOptions = {
  method: 'GET',
  success: noop,
  fail: noop,
  loginUrl: null,
  dataUrl: null,
}

var login = function login(options) {
  options = utils.extend({}, defaultOptions, options);
  if (!defaultOptions.loginUrl) {
    options.fail(new LoginError(constants.ERR_INVALID_PARAMS, '登录错误，登录地址为空，请通过setLoginUrl()方法设置登录地址'));
    return;
  }

  var doLogin = () => getWxLoginResult(function(wxLoginError, wxLoginResult) {
    if (wxLoginError) {
      options.fail(wxLoginError);
      return;
    }
    var userInfo = wxLoginResult.userInfo;
    //构造请求头，包括code、encryptedData 和 iv
    // var encryptedData = wxLoginResult.encryptedData;
    // var iv = wxLoginResult.iv;
    var code = wxLoginResult.code;
    var data = [];
    data[constants.WX_HEADER_CODE] = code;
    wx.request({
      url: options.loginUrl,
      method: 'POST',
      header: {
        "content-type": "application/x-www-form-urlencoded"
      },
      data: data,
      success: function(result) {
        var data = result.data;
        //成功地响应会话信息
        if (data.errcode != null) {
          if (typeof data == 'string') {
            data = data.trim();
            data = JSON.parse(data);
          }
          if (data) {
            if (data.errocode == 0 && data.token) {
              let session = {
                token: data.token,
                isRegister: data.isRegister
              }
              Session.set(session);
              //options.success(userInfo);
            } else {
              var errorMessage = '登录失败(' + data.errcode + ')：' + (data.msg || '请刷新重试');
              var noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage);
              options.fail(noSessionError);
            }
          } else {
            //没有正确的响应会话信息
            var errorMessage = '登录请求没有包涵会话响应，请确保服务器处理 `' + options.loginUrl + '` 的时候正确的使用了SDK输出登录结果';
            var noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage);
            options.fail(noSessionError);
          }
        } else {
          var errorMessage = '当前用户过多,请稍后使用';
          var noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage);
          options.fail(noSessionError);
        }
      },
      fail: function(loginResponseError) {
        var error = new LoginError(constants.ERR_LOGIN_FAILED, '登录失败，可能是网络错误或者服务器发生异常');
        options.fail(error);
      },
    });
  });

  var session = Session.get();
  if (session) {
    wx.checkSession({
      success: function() {
        // options.success(session.userInfo);
      },
      fail: function() {
        Session.clear();
        doLogin();
      },
    });
  } else {
    doLogin();
  }
};

var setLoginUrl = function(loginUrl) {
  defaultOptions.loginUrl = loginUrl;
};

var setDataUrl = function(dataUrl) {
  defaultOptions.dataUrl = dataUrl;
};

var buttonLogin = function(e, options) {
  var session = Session.get();
  if (session) {
    wx.checkSession({
      success: function() {

      },
      fail: function() {
        Session.clear();
        getWxButtonLoginResult(e, function(result) {

        });
      },
    });
  } else {
    getWxButtonLoginResult(e, function(result) {
      loginSession(result)
    });
  }
};

var getWxButtonLoginResult = function getLoginCode(e, callback) {
  wx.login({
    success: function(loginResult) {
      callback({
        code: loginResult.code,
      });
    },
    fail: function(loginError) {
      var error = new LoginError(constants.ERR_WX_LOGIN_FAILED, '微信登录失败，请检查网络状态');
      error.detail = loginError;
      callback(error, null);
    }
  });
}

var loginSession = function getLoginSession(wxLoginResult) {
  var code = wxLoginResult.code;
  var data = [];
  data[constants.WX_HEADER_CODE] = code;
  var options = utils.extend({}, defaultOptions, '');
  wx.request({
    url: options.dataUrl,
    method: 'POST',
    header: {
      "content-type": "application/x-www-form-urlencoded"
    },
    data: data,
    success: function(result) {
      var data = result.data;
      if (typeof data == 'string') {
        data = data.trim();
        data = JSON.parse(data);
      }
      if (data) {
        if (data.errcode == 0 && data.token) {
          let session = {
            token: data.token,
          }
          Session.set(session);
          let dataData = [];
          dataData[constants.WX_HEADER_TOKEN] = data.token;
          wx.request({
            url: options.dataUrl,
            method: 'POST',
            header: {
              "content-type": "application/x-www-form-urlencoded"
            },
            data: dataData,
            success: function(result) {
              var data = result.data;
              if (typeof data == 'string') {
                data = data.trim();
                data = JSON.parse(data);
              }
              if (data) {
                if (data.errcode != 0) {
                  var errorMessage = '登录失败(' + data.errcode + ')：' + (data.msg || '未知错误');
                  var noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage);
                }
              } else {
                var errorMessage = '登录请求没有包含会话响应，请确保服务器处理 `' + options.loginUrl + '` 的时候正确使用了 SDK 输出登录结果';
                var noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage);
              }
            },
            fail: function(loginResponseError) {
              var error = new LoginError(constants.ERR_LOGIN_FAILED, '登录失败，可能是网络错误或者服务器发生异常');
            },
          });
        } else {
          var errorMessage = '登录失败(' + data.errcode + ')：' + (data.msg || '未知错误');
          var noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage);
        }
      } else {
        var errorMessage = '登录请求没有包含会话响应，请确保服务器处理 `' + options.loginUrl + '` 的时候正确使用了 SDK 输出登录结果';
        var noSessionError = new LoginError(constants.ERR_LOGIN_SESSION_NOT_RECEIVED, errorMessage);
      }
    },
    fail: function(loginResponseError) {
      var error = new LoginError(constants.ERR_LOGIN_FAILED, '登录失败，可能是网络错误或者服务器发生异常');
    }
  })
}
module.exports = {
  LoginError: LoginError,
  login: login,
  setLoginUrl: setLoginUrl,
  setDataUrl: setDataUrl,
  buttonLogin: buttonLogin
};