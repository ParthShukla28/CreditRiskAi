
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/loanrisk'

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log(' Connected to MongoDB')

   
    const userSchema = new mongoose.Schema({
      firstName: String,
      lastName:  String,
      email:     { type: String, unique: true },
      password:  String,
      role:      { type: String, default: 'admin' },
      isActive:  { type: Boolean, default: true },
    }, { timestamps: true })

    const User = mongoose.models.User || mongoose.model('User', userSchema)

 
    const existing = await User.findOne({ email: 'admin@bank.com' })
    if (existing) {
      console.log(' Admin user already exists: admin@bank.com')
      process.exit(0)
    }

   
    const hashed = await bcrypt.hash('password123', 12)

    await User.create({
      firstName: 'Admin',
      lastName:  'User',
      email:     'admin@bank.com',
      password:  hashed,
      role:      'admin',
      isActive:  true,
    })

    console.log(' Admin user created!')
    console.log('   Email:    admin@bank.com')
    console.log('   Password: password123')
    console.log('')
    console.log(' Now run: npm run dev')
    process.exit(0)
  } catch (err) {
    console.error(' Seed failed:', err.message)
    process.exit(1)
  }
}

seed()
