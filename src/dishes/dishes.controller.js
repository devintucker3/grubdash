const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next) {
  res.json({ data: dishes });
}

function dishExists(req, res, next) {
  const foundDish = dishes.find((dish) => dish.id === req.params.dishId);
  if (!foundDish) {
    return next({ status: 404, message: "Dish does not exist" });
  }

  res.locals.dish = foundDish;
  return next();
}

function read(req, res, next) {
  const { dish } = res.locals;
  res.json({ data: dish });
}

function dishHasProps(req, res, next) {
  const { data } = req.body;

  if (!data) {
    return next({
      status: 400,
      message: "Include a request body with the dish's attributes.",
    });
  }

  if (!data.name || data.name.trim().length === 0) {
    return next({ status: 400, message: "Dish must include a name" });
  }

  if (!data.description || data.description.trim().length === 0) {
    return next({ status: 400, message: "Dish must include a description" });
  }

  if (!data.price) {
    return next({ status: 400, message: "Dish must include a price" });
  }

  if (
    typeof data.price !== "number" ||
    data.price - Math.floor(data.price) !== 0 ||
    data.price <= 0
  ) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }

  if (!data.image_url || data.image_url.trim().length === 0) {
    return next({ status: 400, message: "Dish must include a image_url" });
  }

  return next();
}

function create(req, res, next) {
  const { name, description, image_url, price } = req.body.data;
  const id = nextId();

  res
    .status(201)
    .json({ data: { id, name, description, image_url, price } });
}

function matchingId( req, res, next) {
    if (!req.body.data.id) return next();

    if (req.body.data.id !== req.params.dishId) {
        return next({status: 400, message: `Dish id does not match route id. Dish: ${req.body.data.id}, Route: ${req.params.dishId}`});
    }


    return next();
}

function update(req, res, next) {
    const {name, description, image_url, price} = req.body.data;
    const {dish} = res.locals;

    dish.name = name;
    dish.description = description;
    dish.image_url = image_url;
    dish.price = price;

    res.json({data: dish})
}

module.exports = {
  list,
  read: [dishExists, read],
  create: [dishHasProps, create],
  update: [dishExists, dishHasProps, matchingId, update],
};
