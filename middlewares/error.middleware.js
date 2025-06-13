const errorMiddleware = (err, req, res, next) => {
  try {
    const statusCode = err.statusCode || 500;

    // console.log(err.data);

    const response = {
      isSuccess: false,
      message: err.message || 'Internal Server Error',
    };

    // Optionally include old input (e.g., for form resubmission)
    if (err.oldInput) response.oldInput = err.oldInput;

    // Include validation errors or any additional metadata
    if (err.data) response.data = err.data;

    // Only log full errors in development
    if (process.env.NODE_ENV !== 'production') {
      // console.error('Error middleware:', err);
      response.stack = err.stack;
    }

    return res.status(statusCode).json(response);
  } 

  catch (error) {
    console.error('Error in error handler:', error);
    return res.status(500).json({
      isSuccess: false,
      message: 'Unexpected error occurred in error handler',
    });
  }
};

export default errorMiddleware;