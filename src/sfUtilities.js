const { readJSON, writeJSON } = require("fs-extra");
const { join } = require("path");

const moviesPath = join(__dirname, "./movies/movies.json");

const readDB = async (filePath) => {
  try {
    const fileJson = await readJSON(filePath);
    return fileJson;
  } catch (error) {
    throw new Error(error);
  }
};

const writeDB = async (filePath, fileContent) => {
  try {
    await writeJSON(filePath, fileContent);
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getMovies: async () => readDB(moviesPath),
  writeMovies: async (moviesData) => writeDB(moviesPath, moviesData),
  getReviews: async () => readDB(reviewsPath),
  writeReviews: async (reviewsData) => writeDB(reviewsPath, reviewsData),
};
