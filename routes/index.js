import {
  cek_saldo,
} from "../controllers/dana.id.js";

var express = require('express');
var router = express.Router();

/* GET home page. */
router.post('/cek-saldo', cek_saldo);

module.exports = router;
