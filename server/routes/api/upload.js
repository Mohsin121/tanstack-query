var router = require("express").Router();
const path = require("path");
var fs = require("fs");

const backend = require("../../config").backend;
var multer = require("../../utilities/multer");
var cpUpload = multer.fields([{ name: "file", maxCount: 1 }]);
const sharp = require("sharp");


const compressImage = async (filePath) => {
  const compressedFilePath = filePath.replace(/(\.\w+)$/, "-compressed$1");

  try {
    // Compress the image
    await sharp(filePath)
      .resize({ width: 800 }) // Resize the image to a width of 800px
      .jpeg({ quality: 80 }) // Compress the image to 80% quality
      .toFile(compressedFilePath);

    try {
    
		  	fs.unlinkSync(filePath);
      console.log("Original file deleted successfully");
    } catch (err) {
      console.error("Error deleting the original file:", err);
    }

    return compressedFilePath;
  } catch (error) {
    console.error("Error processing the image:", error);
    throw error;
  }
};

router.post("/", cpUpload, async function (req, res, next) {
  try {
    const file = req.files["file"][0];
    const compressedFilePath = await compressImage(file.path);
    console.log("Compressing file:", compressedFilePath);
		
    return res.json({ url: `${backend}/uploads/${path.basename(compressedFilePath)}` });
  } catch (error) {
    console.error("Error processing the image:", error);
    return res.status(500).json({ error: "Error processing the image" });
  }
});



router.post("/delete", function (req, res, next) {
	if (req.body.url) {
		fs.unlink(path.join(process.cwd(), "server/public", req.body.url), function (err) {
			if (err) {
				return res.sendStatus(204);
			}
			// if no error, file has been deleted successfully
			return res.json({ status: 200, event: "File deleted Successfully" });
		});
	} else {
		if (!event) return res.sendStatus(204);
	}
	// unlink the files
});

module.exports = router;
