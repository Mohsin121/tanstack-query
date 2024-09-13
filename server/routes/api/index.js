let router = require("express").Router();

router.use("/user", require("./user"));
router.use("/upload", require("./upload"));
router.use("/notification", require("./notification"));
router.use("/public", require("./public"));
router.use("/product", require("./product"));
router.use("/reel", require("./reel"));
router.use("/like", require("./like"));
router.use("/comment", require("./comment"));
router.use("/chatgroup", require("./chatgroup"));
router.use("/message", require("./message"));





// router.use("/variation", require("./variation"));



module.exports = router;
