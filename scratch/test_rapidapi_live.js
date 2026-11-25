require('../backend/node_modules/dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });
const { searchRapidApi } = require('../backend/utils/rapidApiService');

async function test() {
  console.log('Testing RapidAPI search with a query...');
  const results = await searchRapidApi('Sony WH-1000XM5 wireless headphones', 5);
  console.log('Results returned:', results ? results.length : null);
  if (results && results[0]) {
    console.log('First result title:', results[0].product_title);
    console.log('Price:', results[0].price || results[0].offer?.price);
    console.log('Typical price range:', results[0].typical_price_range);
    console.log('Photos:', results[0].product_photos?.slice(0, 2));
    console.log('Offers:', results[0].offer);
  }
}

test().catch(console.error);
