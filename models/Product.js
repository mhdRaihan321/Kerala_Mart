const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;


const productSchema = new mongoose.Schema({
  mainname: { type: String, required: true },
  dname: { type: String, required: true },
  brandinfo: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  images: [{ type: String, required: true }],
  imageUrl: { type: String, required: true },
  mrp: { type: Number, required: true },
  offerPrice: { type: Number, required: true }
});


// Static method to fetch all products
productSchema.statics.getAllProducts = function() {
  return new Promise((resolve, reject) => {
    this.find().lean()
      .then(products => {
        resolve(products);
      })
      .catch(error => {
        reject(error);
      });
  });
};

// Static method to remove product by ID
productSchema.statics.removeById = function(id) {
  return new Promise((resolve, reject) => {
    this.findByIdAndDelete(id)
      .then(result => {
        resolve(result);
      })
      .catch(error => {
        reject(error);
      });
  });
};

// Static method to get product details by ID
productSchema.statics.getProductDetails = function(id) {
  return new Promise((resolve, reject) => {
    this.findOne({ _id: new ObjectId(id) }).lean()
      .then(product => {
        resolve(product);
      })
      .catch(error => {
        reject(error);
      });
  });
};

// Static method to update product by ID
productSchema.statics.updateProduct = function(id, proDetails) {
  return new Promise((resolve, reject) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reject(new Error('Invalid ID format'));
    }
    this.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      {
        $set: {
          mainname: proDetails.mainname,
          dname: proDetails.dname,
          brandinfo: proDetails.brandinfo,
          category: proDetails.category,
          price: proDetails.price,
          description: proDetails.description,
          images: proDetails.images,
          imageUrl: proDetails.imageUrl,
          mrp: proDetails.mrp,
          offerPrice: proDetails.offerPrice
        }
      }
    ).lean()
      .then(result => {
        resolve(result);
      })
      .catch(error => {
        reject(error);
      });
  });
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
