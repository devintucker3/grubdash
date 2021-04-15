const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
    res.json({data: orders});
}

//Order read middleware and CRUD
function orderExists(req, res, next) {
    const foundOrder = orders.find(order => order.id === req.params.orderId);
    if (!foundOrder) {
        return next({status: 404, message: `Order ${req.params.orderId} does not exist`});
    }

    res.locals.order = foundOrder
    return next();
}

function read(req, res, next) {
    const {order} = res.locals;
    res.json({data: order});
}

//Order destroy middleware and CRUD
function pendingStatusDestroy(req, res, next) {
    const order = res.locals.order;

    if(order.status !== "pending") {
        return next({status: 400, message: "An order cannot be deleted unless it is pending"});
    }

    next();
}

function destroy(req, res, next) {
    const orderToDelete = orders.findIndex(order => order.id === res.locals.order.id);
    orders.splice(orderToDelete, 1);

    res.sendStatus(204);
}

//Order create middleware and CRUD
function orderHasProps(req, res, next) {
    const {data} = req.body;
    const {deliverTo, mobileNumber, dishes} = data;

    if (!data) {
        return next({status: 400, message: "Please include a request body with the order's attributes"});
    }

    if (!deliverTo || deliverTo.trim().length === 0) {
        return next({status: 400, message: "Order must include a deliverTo"});
    }

    if (!mobileNumber || mobileNumber.trim().length === 0) {
        return next({status: 400, message: "Order must include a mobileNumber"});
    }

    if (!dishes) {
        return next({status: 400, message: "Order must include a dish"});
    }

    if (!Array.isArray(dishes) || dishes.length === 0) {
        return next({status: 400, message: "Order must include at least one dish"});
    }

    dishes.forEach((dish, index) => {
        const {quantity} = dish;
        if (!quantity || typeof quantity !== "number" || quantity - Math.floor(quantity) !== 0 || quantity < 1) {
            return next({status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`});
        }
    });

    next();
}

function create(req, res, next) {
    const {deliverTo, mobileNumber, dishes} = req.body.data;
    const id = nextId();

    res.status(201).json({data: {deliverTo, mobileNumber, dishes, id}});
}

//Order update middleware and CRUD
function pendingStatusUpdate(req, res, next) {
    const order = req.body.data;

    if (!order.status || order.status === "invalid") {
        return next({status: 400, message: "A pending status is required to update an order."})
    }

    next();
}

function matchingId(req, res, next) {
    if (!req.body.data.id) return next();

    if(req.body.data.id !== req.params.orderId) {
        return next({status: 400, message: `Order id does not match route id. Order: ${req.body.data.id}, Route: ${req.params.orderId}`});
    }

    return next();
}

function update(req, res, next) {
    const {deliverTo, mobileNumber, dishes} = req.body.data;
    const {order} = res.locals;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;

    res.json({data: order});
}

module.exports = {
    list,
    read: [orderExists, read],
    create: [orderHasProps, create],
    destroy: [orderExists, pendingStatusDestroy, destroy],
    update: [orderExists, orderHasProps, pendingStatusUpdate, matchingId, update],
}