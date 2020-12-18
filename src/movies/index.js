const express = require("express");
const { check, validationResult } = require("express-validator");
const uniqid = require("uniqid");
const axios = require("axios");
const { join } = require("path");

const { getMovies, writeMovies } = require("../sfUtilities");

const moviesRouter = express.Router();
// const moviesPath = join(__dirname, "movies.json");

moviesRouter.post(
  "/",
  [
    check("Title").exists().withMessage("Title of the movie is required"),
    check("Year").exists().withMessage("Realease years is required").isInt(),
    check("Type").exists().withMessage("Type of movie required!"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const err = new Error();
        err.message = errors;
        err.httpStatusCode = 400;
        next(err);
      } else {
        const movies = await getMovies();
        movies.push({
          ...req.body,
          IMDBID: uniqid(),
          reviews: [],
        });
        await writeMovies(movies);
        res.status(200).send({ message: "Created" });
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

moviesRouter.get("/", async (req, res, next) => {
  try {
    const movies = await getMovies();

    if (req.query && req.query.category) {
      const filteredMovies = movies.filter(
        (movie) =>
          movie.hasOwnProperty("category") &&
          movie.category === req.query.category
      );
      res.send(filteredMovies);
    } else {
      res.send(movies);
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

moviesRouter.post(
  "/:elementId/reviews",
  [
    check("comment").exists().withMessage("Please leave a comment"),
    check("rate").exists().withMessage("Rate us please!"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      const movies = await getMovies();
      const movieFound = movies.find(
        (movie) => movie.IMDBID === req.params.elementId
      );

      if (movieFound) {
        movies[movieFound].reviews.push({
          ...req.body,
          _id: uniqid(),
          createdAt: new Date(),
        });
        await writeMovies(movies);
        res.status(201).send(movies);
      } else {
        const err = new Error();
        err.message = errors;
        err.httpStatusCode = 404;
        next(err);
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = moviesRouter;
