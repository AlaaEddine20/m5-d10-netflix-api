const express = require("express");
const { check, validationResult } = require("express-validator");
const uniqid = require("uniqid");
const axios = require("axios");
const { join } = require("path");

const { getMovies, writeMovies } = require("../sfUtilities");

const moviesRouter = express.Router();
const moviesFilePath = join(__dirname, "movies.json");
const moviesValidation = [
  check("Title").exists().withMessage("Title of the movie is required"),
  check("Year").exists().withMessage("Realease years is required"),
  check("Type").exists().withMessage("Type of movie required!"),
];

const reviewsValidation = [
  check("comment").exists().withMessage("Please leave a comment"),
  check("elementId")
    .exists()
    .withMessage("Provide the element id you want to review"),
];

moviesRouter.post("/", moviesValidation, async (req, res, next) => {
  try {
    const errors = moviesValidation(req);

    if (!errors.isEmpty()) {
      const err = new Error();
      err.message = "Fill the required fields!";
      err.httpStatusCode = 400;
      next(err);
    } else {
      const movies = await getMovies();
      const movie = {
        ...req.body,
        IMDBID: uniqid(),
      };
      movies.push(movie);
      await writeMovies(movies);
      res.status(200).send({ message: "Created" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

moviesRouter.post(
  "/:elementId/reviews",
  reviewsValidation,
  async (req, res, next) => {
    try {
      const errors = reviewsValidation(req);

      if (!errors.isEmpty()) {
        const err = new Error();
        err.message = "Fill the required fields!";
        err.httpStatusCode = 400;
        next(err);
      } else {
        const movies = await getMovies();
        const movieFound = movies.find(
          (movie) => movie.IMDBID === req.params.IMDBID
        );

        if (movieFound) {
          res.send(movieFound.reviews);
        } else {
          next(err);
        }
      }
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = moviesRouter;
