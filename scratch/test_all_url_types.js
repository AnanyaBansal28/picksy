const productController = require('../backend/controllers/productController');

async function testUrl(url, label) {
  const req = { body: { url } };
  let responseData = null;
  const res = {
    status: (code) => ({
      json: (data) => {
        responseData = { statusCode: code, ...data };
        return responseData;
      },
    }),
    json: (data) => {
      responseData = data;
      return responseData;
    },
  };

  await productController.analyzeUrl(req, res, (err) => {
    if (err) throw err;
  });

  console.log(`\n--- Test: ${label} ---`);
  console.log('Query/Title:', responseData.product.title);
  console.log('SubCategory:', responseData.product.subCategory);
  console.log('Brand:', responseData.product.brand);
  console.log('Price:', responseData.product.lowestPrice);
  return responseData.product;
}

async function run() {
  const phone = await testUrl('https://www.amazon.in/Apple-iPhone-15-128-GB/dp/B0CHX1W1XY', 'iPhone');
  if (phone.subCategory !== 'Smartphones' || phone.lowestPrice < 15000) {
    throw new Error('iPhone test failed!');
  }

  const audio = await testUrl('https://www.amazon.in/boAt-Airdopes-141-Bluetooth-Earbuds/dp/B09N3ZNHTY', 'boAt Earbuds');
  if (audio.subCategory !== 'Audio & Wearables') {
    throw new Error('boAt Earbuds test failed!');
  }

  const toy = await testUrl('https://www.amazon.in/SCOOBA-Fabric-Piggy-toy20cm-Height/dp/B08XYS1234', 'SCOOBA Piggy Toy');
  if (toy.subCategory !== 'Toys & Kids') {
    throw new Error('Toy test failed!');
  }

  console.log('\nAll URL types correctly classified and analyzed!');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
