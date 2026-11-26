const mongoose = require('../backend/node_modules/mongoose');
const User = require('../backend/models/User');

async function testUserHook() {
  const user = new User({ name: 'Alice', email: 'alice@example.com', password: 'mySecurePassword123' });
  console.log('User created in memory, raw password:', user.password);

  const pres = User.schema.s.hooks._pres.get('save');
  console.log('Total pre-save hooks on User:', pres ? pres.length : 0);
  
  const customHook = pres.find(p => p.fn.toString().includes('bcrypt') || p.fn.toString().includes('isModified'));
  if (customHook) {
    console.log('Found custom bcrypt pre-save hook!');
    await customHook.fn.call(user);
    console.log('Password after hook execution:', user.password);
    console.log('Is password bcrypt hashed ($2a$...)?', user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

    const isCorrect = await user.matchPassword('mySecurePassword123');
    const isWrong = await user.matchPassword('wrongPassword');
    console.log('Password comparison check -> Correct:', isCorrect, 'Wrong:', isWrong);
  } else {
    console.log('Custom hook not found in pre hooks!');
  }
}

testUserHook().catch(console.error);
