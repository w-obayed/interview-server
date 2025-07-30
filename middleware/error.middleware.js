// error handler function
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;

  // error response
  const response = {
    message: err.message || "Internal Server Error",
    success: false,
  };

  // if the error is a validation error, set the status code to 400
  switch (err.name) {
    case "ValidationError":
      response.message = "Validation Error";
      res.status(400);
      break;
    case "UnauthorizedError":
      response.message = "Unauthorized";
      res.status(401);
      break;
    case "ForbiddenError":
      response.message = "Forbidden";
      res.status(403);
      break;
    case "NotFoundError":
      response.message = "Not Found";
      res.status(404);
      break;
    case "InternalServerError":
      response.message = "Internal Server Error";
      res.status(500);
      break;
    default:
      res.status(statusCode);
      break;
  }

  // send the response
  return res.status(statusCode).json(response);
};

// export the error handler
export default errorHandler;
