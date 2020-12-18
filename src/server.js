const express = require("express");
const cors = require("cors");
const listEndpoints = require("express-list-endpoints");
const moviesRoutes = require("./movies/index");
const {
  notFoundHandler,
  badRequestHandler,
  unauthorizedHandler,
  genericErrorHandler,
} = require("./errorHandler");

const server = express();

const port = process.env.PORT || 4004;

const loggerMiddleware = (req, res, next) => {
  console.log(`Logged ${req.url} ${req.method} -- ${new Date()}`);
  next();
};

const whiteList =
  process.env.NODE_ENV === "production"
    ? [process.env.FE_URL_PROD]
    : [process.env.FE_URL_DEV];

const corsOptions =
  process.env.NODE_ENV === "production"
    ? {
        origin: function (origin, callback) {
          if (whiteList.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error("NOT ALLOWED - CORS ISSUES"));
          }
        },
      }
    : {};

server.use(cors(corsOptions));
server.use(express.json());
server.use("/movies", moviesRoutes);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);

console.log(listEndpoints(server));

server.listen(port, () => {
  if (process.env.NODE_ENV === "production") {
    console.log("Running on cloud on port", port);
  } else {
    console.log("Running locally on port", port);
  }
});
