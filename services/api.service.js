"use strict";

const ApiGateway = require("moleculer-web");
const { UnAuthorizedError, ERR_NO_TOKEN } = require("../errors");

module.exports = {
	name: "api",
	mixins: [ApiGateway],

	// More info about settings: https://moleculer.services/docs/0.13/moleculer-web.html
	settings: {
		port: process.env.PORT || 3000,

		routes: [
			{
				path: "/public/",
				whitelist: [
					"users.login",
					"users.register"
				],
				// Route error handler
				onError(req, res, err) {
					res.setHeader("Content-Type", "application/json; charset=utf-8");
					res.writeHead(err.code || 500);
					res.end(JSON.stringify(err.message));
				}
			}
			, {
				path: "/user/",
				authorization: true,
				bodyParsers: {
					json: true,
					urlencoded: { extended: true }
				},
				aliases: {
					// Products
					"POST products/create": "products.create",
					"POST products/query": "products.query",
					// my cart
					"POST cart/add": "cart.addOne",
					"GET  cart/summary": "cart.summary",
				}
			}
		],
		// Serve assets from "public" folder
		assets: {
			folder: "public"
		}
	},
	methods: {
		authorize(ctx, route, req) {
			let token;
			if (req.headers.authorization) {
				let type = req.headers.authorization.split(" ")[0];
				if (type === "Bearer") {
					token = req.headers.authorization.split(" ")[1];
				}
			}
			if (!token) {
				return Promise.reject(new UnAuthorizedError(ERR_NO_TOKEN));
			}
			// Verify JWT token
			return ctx.call("users.resolveToken", { token })
				.then(user => {
					if (user) {
						ctx.meta.userId = user._id;
						return this.Promise.resolve(ctx);
					}
				});
		}
	}
};
