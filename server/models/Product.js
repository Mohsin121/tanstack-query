
let mongoose = require("mongoose");

const mongoosePaginate = require("mongoose-paginate-v2");


const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }], 
  description: { type: String },
  category: { type: String, required: true }, 
  season: { type: String, optional: true }, 
  gender: { type: String, optional: true },
  variations: [{
    color: { type: String, required: true },
    colorHex: { type: String },
    stock: { type: Number, required: true }
  }],
  isAvailable: { type: Boolean, default: true },
});

productSchema.plugin(mongoosePaginate);


productSchema.methods.toJSON = function () {
	return {
		_id: this._id,
		name: this.name,
		images: this.images,
		description: this.description,
		category: this.category,
		season: this.season,
		gender: this.gender,
    variations: this.variations,
    price: this.price,
    isAvailable: this.isAvailable,

	};
};

module.exports = mongoose.model("Product", productSchema);
