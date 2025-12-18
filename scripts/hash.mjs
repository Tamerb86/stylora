import bcrypt from 'bcryptjs';
const hash = bcrypt.hashSync('demo12345', 10);
console.log(hash);
