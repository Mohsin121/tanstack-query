let mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");



const variationSchema = new mongoose.Schema({
  colorName: { type: String, required: true },
  colorHex: { type: String, optional: true },
  stock: { type: Number, required: true }
});


variationSchema.methods.toJSON = function () {
	return {
		_id: this._id,
		colorName: this.colorName,
		colorHex: this.colorHex,
		stock: this.stock,
	};
};

module.exports = mongoose.model("Variation", variationSchema);
