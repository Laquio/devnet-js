const express = require('express');
const router = express.Router();

router.use(function(req, res, next) {
    console.log('Something is happening.');
    next();
  });
  
  router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our rest video api!' });  
  });

  module.exports.router = router;