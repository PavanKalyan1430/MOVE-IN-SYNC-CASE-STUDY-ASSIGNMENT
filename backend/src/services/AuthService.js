const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

class AuthService {
  constructor() {
    this.SALT_ROUNDS = 10;
  }

  async register({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    return {
      id: user._id,
      name: user.name,
      email: user.email
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "dev_jwt_secret_change_this",
      { expiresIn: "1d" }
    );

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    };
  }
}

module.exports = new AuthService();
