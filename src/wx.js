// 快速验证
// <button open-type="getPhoneNumber" bindgetphonenumber="getPhoneNumber"></button>
// 用户点击微信登陆按钮
const getPhoneNumber = async ({detail: {encrytedData, iv, code}}) => {
  // 在最新的微信手机号登陆中，可以使用code请求微信的接口获取用户的手机号了
  // ❕❕❕❕❕这里的code不同于wx.login获取的code，这两个code不能相互使用❕❕❕❕❕
  // ❕❕❕❕❕每个code有效期为5分钟，且只能消费一次❕❕❕❕❕
  // 这里还能获取到encrytedData, iv这两个参数，但是新的登录方式中可以不使用了


  // 让后端使用code完成所有的登录操作
  wx.request({
    methods: 'POST',
    url: "http://localhost:9013/getPhoneNumber/",
    data: {
      code
    },
    success: ({data: {data}}) => {
      console.log(data);
    }
  })
}

// 实时验证
// <button open-type="getRealtimePhoneNumber" bindgetrealtimephonenumber="getrealtimephonenumber"></button>
const getrealtimephonenumber = ({code}) => {
  // 在最新的微信手机号登陆中，可以使用code请求微信的接口获取用户的手机号了
  // ❕❕❕❕❕这里的code不同于wx.login获取的code，这两个code不能相互使用❕❕❕❕❕
  // ❕❕❕❕❕每个code有效期为5分钟，且只能消费一次❕❕❕❕❕
  // 这里不能获取到encrytedData, iv这两个参数
  // 让后端使用code完成所有的登录操作
  wx.request({
    methods: 'POST',
    url: "http://localhost:9013/getPhoneNumber/",
    data: {
      code
    },
    success: ({data: {data}}) => {
      console.log(data);
    }
  })
}
