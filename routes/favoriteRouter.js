const express = require("express");
const bodyParser = require("body-parser");
var authenticate = require("../authenticate");
const cors = require("./cors");
const Favorites = require("../models/favorite");
const Dishes = require("../models/dishes");

const favoriteRouter = express.Router();
favoriteRouter.use(bodyParser.json());

favoriteRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user.id })
      .populate("dishes")
      .then(
        (favorites) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(favorites);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user.id })
      .then((favorites) => {
        if (!favorites.length)
          favorites = new Favorites({ user: req.user.id, dishes: [] });
        else favorites = favorites[0];

        // Add those dish Ids in to dishes that are not already present
        favorites.dishes.push(
          ...req.body
            .map((dish) => dish._id)
            .filter((dishId) => !favorites.dishes.includes(dishId))
        );

        return favorites.save();
      })
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((e) => next(e));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.remove({ user: req.user.id })
      .then(
        (resp) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

favoriteRouter
  .route("/:dishId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user.id })
      .then(
        (favorites) => {
          if (!favorites.length) {
            let err = new Error("Favorites not found!");
            err.status = 404;
            throw err;
          }
          favoriteDishes = favorites[0].dishes.filter(
            (dishId) => req.params.dishId == dishId
          );
          if (favoriteDishes.length) {
            return Dishes.findById(favoriteDishes[0]);
          } else {
            let err = new Error("Dish not found in the favorites");
            err.status = 404;
            throw err;
          }
        },
        (err) => next(err)
      )
      .then((dish) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(dish);
      })
      .catch((err) => next(err));
  })
  .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user.id })
      .then((favorites) => {
        if (!favorites.length)
          favorites = new Favorites({ user: req.user.id, dishes: [] });
        else favorites = favorites[0];

        if (!favorites.dishes.includes(req.params.dishId)) {
          favorites.dishes.push(req.params.dishId);
        }

        return favorites.save();
      })
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  })
  .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorites.find({ user: req.user.id })
      .then((favorites) => {
        if (!favorites.length) {
          let err = new Error("Favorites not found!");
          err.status = 404;
          throw err;
        }

        favorites[0].dishes = favorites[0].dishes.filter(
          (dishId) => req.params.dishId != dishId
        );

        return favorites[0].save();
      })
      .then((favorites) => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(favorites);
      })
      .catch((err) => next(err));
  });

module.exports = favoriteRouter;
