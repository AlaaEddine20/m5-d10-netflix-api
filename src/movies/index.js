const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../cloudinary");
const { check, validationResult } = require("express-validator");
const uniqid = require("uniqid");
// ROUTES FROM FS UTILITIES
const {
  getMovies,
  writeMovies,
  writeReviews,
  getReviews,
} = require("../sfUtilities");

const moviesRouter = express.Router();

// FORM VALIDATION
const moviesValidator = [
  check("title").exists().withMessage("Title of the movie is required"),
  check("year").exists().withMessage("Realease years is required").isInt(),
  check("type").exists().withMessage("Type of movie required!"),
];

// IMAGE VALIDATION
const imageValidator = check("image")
  .custom((value, { req }) => {
    return req.file.mimetype === "image/png";
  })
  .withMessage("Only images accepted");

// STORAGE
const storage = new CloudinaryStorage({
  cloudinary, // USE MY CREDENTIALS (IN THE .ENV FILE)
  params: {
    // VARIOUS OPTIONS
    folder: "netflix-clone", // SAVE IN THIS FOLDER IN CLOUDINARY
  },
});

// TELL MULTER WHATEVER IT COMES FROM THE REQ SAVE IT IN THIS STORAGE
const cloudinaryStorage = multer({ storage: storage });

// POST A MOVIE WITH AN IMAGE
moviesRouter.post(
  "/upload",
  cloudinaryStorage.single("image"), // MULTER + MULTER STORAGE CLOUDINARY
  moviesValidator,
  // imageValidator,
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
          // image: req.file.path, // THIS IS GOING TO BE THE CLOUDINARY URL
          reviews: [],
        });
        await writeMovies(movies);
        res.status(200).send({
          message: `${req.body.title} added to the database successfully!`,
        });
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

// DELETE MOVIE
moviesRouter.delete("/:elementId/", async (req, res, next) => {
  try {
    const movies = await getMovies();
    const movieFound = movies.find(
      (movie) => movie.IMDBID === req.params.elementId
    );
    if (movieFound) {
      const filteredMovies = movies.filter(
        (movie) => movie.IMDBID !== req.params.elementId
      );
      await writeMovies(filteredMovies);
      res.status(204).send();
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// POST REVIEW
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
      const movieIndex = movies.findIndex(
        (movie) => movie.IMDBID === req.params.elementId
      );

      if (movieIndex !== -1) {
        movies[movieIndex].reviews.push({
          ...req.body,
          _id: uniqid(),
          createdAt: new Date(),
        });
        await writeMovies(movies);
        res.status(201).send("Review posted successfully");
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

// DELETE REVIEW
moviesRouter.delete("/:elementId/reviews/:reviewId", async (req, res, next) => {
  try {
    const movies = await getMovies();
    const movieIndex = movies.findIndex(
      (movie) => movie.IMDBID === req.params.elementId
    );

    if (movieIndex !== -1) {
      const filteredReviews = movies[movieIndex].reviews.filter(
        (review) => review._id !== req.params.reviewId
      );
      movies[movieIndex].reviews = filteredReviews;
      await writeMovies(movies);
      res.status(204).send({ message: "The review has been deleted" });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});
module.exports = moviesRouter;
