const Koa = require("koa");
const KoaRouter = require("koa-router");
const axios = require("axios");
const bodyParser = require("koa-bodyparser");
const { appid, secret } = require("./config");

const app = new Koa();
app.use(bodyParser())

const phoneRouter = new KoaRouter({ prefix: "/getPhoneNumber" });
phoneRouter.post("/", async (ctx) => {
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
});

app.use(phoneRouter.routes());

app.listen(9013, "0.0.0.0", () => {
  console.log("listening in 9012");
});
