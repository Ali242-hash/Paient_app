const express = require('express');
const router = express.Router();
const { User } = require('../dbHandler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const secretKey = 'madaretosagbegad666';

function Auth() {
  return (req, res, next) => {
    const autHead = req.headers.authorization;
    if (!autHead) {
      return res.status(401).json({ message: 'Authorization header is missing' }).end();
    }

    const tokenParts = autHead.split(' ');
    if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
      return res.status(401).json({ message: 'Invalid Authorization format' }).end();
    }

    const token = tokenParts[1];

    try {
      const deccodToken = jwt.verify(token, secretKey);
      req.user = deccodToken;
      req.role = deccodToken.role;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Internal error', error: error.message });
    }
  };
}

module.exports = { Auth,router }