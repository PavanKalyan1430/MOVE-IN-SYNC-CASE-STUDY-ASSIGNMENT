const authService = require("../services/AuthService");

class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: "name, email, and password are required" });
      }

      const user = await authService.register({ name, email, password });
      return res.status(201).json({
        message: "User registered successfully",
        data: user
      });
    } catch (error) {
      if (error.message === "Email already registered") {
        return res.status(409).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "email and password are required" });
      }

      const result = await authService.login({ email, password });
      return res.status(200).json({
        message: "Login successful",
        data: result
      });
    } catch (error) {
      if (error.message === "Invalid email or password") {
        return res.status(401).json({ message: error.message });
      }
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = AuthController;
