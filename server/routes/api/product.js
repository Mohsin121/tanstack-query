let mongoose = require("mongoose");
let router = require("express").Router();

let Product = mongoose.model("Product");
let auth = require("../auth");


let { OkResponse, BadRequestResponse, UnauthorizedResponse } = require("express-http-response");

router.post('/', auth.required, auth.admin, async (req, res, next) => {


  console.log("req body", req.body)
  try {
    let product = new Product({
      name: req.body.name,
      description: req.body.description,
      images: req.body.images,
      price: req.body.price,
      category: req.body.category,
      season: req.body.season,
      gender: req.body.gender,
      variations: req.body.variations // Assuming variations is an array of objects
    });

    await product.save();
    return next(new OkResponse(product));
  } catch (error) {
    return next(new BadRequestResponse(error.message));
  }
});



router.get('/admin-products', auth.required, async (req, res, next) => {
  try {  
    const { page , limit} = req.query;

   

    const options = {
			sort: { createdAt: -1 },
			limit: parseInt(req.query.limit) || 2 ,
			page: parseInt(req.query.page) || 1,
		};

    const products = await Product.paginate({}, options)
   


    return next(new OkResponse( products ));
  } catch (error) {
    return next(new BadRequestResponse(error.message));
  }
});




router.get('/', auth.required, async (req, res, next) => {
  const {category, gender} = req.query;

  const filter = {};

  if(category !== ""){
    filter.category = category
  }

  if(gender){
    filter.gender = gender
  }

  const options = {
		sort: { createdAt: -1 },
	};

  try {
    const products = await Product.find( filter , null, options);
    return next(new OkResponse(products));
  } catch (error) {
    return next(new BadRequestResponse(error.message));
  }
});



router.put('/:id', auth.required, auth.admin, async (req, res, next) => {
  try {
    const productId = req.params.id;
    const updateData = {
      name: req.body.name ,
      description: req.body.description,
      images: req.body.images,
      price: req.body.price,
      mainCategory: req.body.mainCategory,
      subCategory: req.body.subCategory,
      season: req.body.season,
      gender: req.body.gender,
      variations: req.body.variations // Assuming variations is an array of objects
    };

    const product = await Product.findByIdAndUpdate(productId, updateData, { new: true, runValidators: true });

    if (!product) {
      return next(new BadRequestResponse("Product not found"));
    }

    return next(new OkResponse(product));
  } catch (error) {
    return next(new BadRequestResponse(error.message));
  }
});



router.get('/product-detail/:id', auth.required, async (req, res, next) => {
  try {
    const productId = req.params.id;
   

    const product = await Product.findById(productId);

    if (!product) {
      return next(new BadRequestResponse("Product not found"));
    }

    return next(new OkResponse(product));
  } catch (error) {
    return next(new BadRequestResponse(error.message));
  }
});



module.exports = router;