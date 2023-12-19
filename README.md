# wx-new-login-backend
微信小程序更改了手机登陆方式后，node实现微信小程序的后端开发流程

⚠️⚠️注意⚠️⚠️
⚠️bindgetphonenumber接口中的code不同于wx.login获取的code，这两个code不能相互使用
⚠️每个code有效期为5分钟，且只能消费一次
⚠️ccess_token 的有效期目前为 2 个小时，需定时刷新，重复获取将导致上次获取的 access_token 失效；
⚠️access_token 的有效期通过返回的 expires_in 来传达，目前是7200秒之内的值，中控服务器需要根据这个有效时间提前去刷新。在刷新过程中，中控服务器可对外继续输出的老 access_token，此时公众平台后台会保证在5分钟内，新老 access_token 都可用，这保证了第三方业务的平滑过渡

1. 点击微信登录的button，向后端传递参数，实现登录
```html
<button open-type="getPhoneNumber" bindgetphonenumber="getPhoneNumber">微信登录</button>
```
```js
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
```
2. 后端接收到前端传来的code，调用两个微信的api，获取用户的手机号，相比于之前的操作，这个操作流程省事儿了很多
获得到手机号之后，要判断这个手机号有没有注册过
* 如果注册过
  就直接走后端的登陆流程，注意这个登陆流程不需要密码和验证码，因为微信小程序提供这个微信登录就是为了让用户不输入密码，我们既然信任了微信，要使用微信登登录，那我们就没必要去验证密码
  当然上面说的不进行密码和验证码的校验也是推荐，如果非要校验也不是不可以，但这样微信登录也就失去了意义
* 如果没有注册过
  那就应该响应给前端，该用户没有注册，让前端可以跳转到注册页面，在这个注册页面上还可以使用微信头像，微信昵称，但是不能获得用户的手机号，所以这里有一个建议，可以在用户没有注册的时候，把用户的手机号返回给前端，让前端把用户的手机号显示在注册页面中，省去用户输入的步骤
```js
async (ctx) => {
  const { code } = ctx.request.body;

  // 获取access_token
  /**
   * ❕❕❕❕❕access_token 的有效期目前为 2 个小时，需定时刷新，重复获取将导致上次获取的 access_token 失效；
   * ❕❕❕❕❕access_token 的有效期通过返回的 expires_in 来传达，目前是7200秒之内的值，中控服务器需要根据这个有效时间提前去刷新。在刷新过程中，中控服务器可对外继续输出的老 access_token，此时公众平台后台会保证在5分钟内，新老 access_token 都可用，这保证了第三方业务的平滑过渡
   */
  const { access_token, expires_in } = await axios.get(
    "https://api.weixin.qq.com/cgi-bin/token",
    {
      params: {
        appid,
        secret,
        grant_type: "client_credential", // 要获取access_token就要求grant_type的值为"client_credential"
      },
    }
  );

  // 使用access_token获取用户的手机号，完成登录
  const data = await axios.post(
    "https://api.weixin.qq.com/wxa/business/getuserphonenumber",
    {
      code,
      params: {
        access_token,
      },
    }
  );

  // data示例
  /**
   * {
   *     "errcode":0,
   *     "errmsg":"ok",
   *     "phone_info": {
   *         "phoneNumber":"xxxxxx",
   *         "purePhoneNumber": "xxxxxx",
   *         "countryCode": 86,
   *         "watermark": {
   *             "timestamp": 1637744274,
   *             "appid": "xxxx"
   *         }
   *     }
   * }
   */

  const { phoneNumber, countryCode } = data.phone_info;

  if (phoneNumber) {
    // 如果data中能解析出手机号
    // 去存储服务中查找这个手机号注册过没有？
    // 如果没有
    ctx.body = {
      data: {
        code: 404,
        msg: "没有注册",
        phoneNumber
      },
    };
    // 如果注册了，就要进入下一个中间件————我们后端的登陆的中间件，给前端返回一个我们自己服务器使用jwt生成的token
    await next();
  }
}
```
