'use strict';

class ApiResponse {
  constructor(statusCode, message, data = null) {
    this.success    = statusCode < 400;
    this.statusCode = statusCode;
    this.message    = message;
    this.data       = data;
  }

  static ok(res, message, data = null) {
    return res.status(200).json(new ApiResponse(200, message, data));
  }

  static created(res, message, data = null) {
    return res.status(201).json(new ApiResponse(201, message, data));
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
