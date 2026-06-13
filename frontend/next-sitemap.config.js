module.exports = {
  siteUrl: "https://tayibatai.com",
  generateRobotsTxt: true,
  exclude: [
    "/account",
    "/admin",
    "/admin/*",
    "/chat",
    "/payment/*",
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account",
          "/admin",
          "/admin/",
          "/chat",
          "/payment/success",
          "/payment/cancel",
        ],
      },
    ],
  },
};
