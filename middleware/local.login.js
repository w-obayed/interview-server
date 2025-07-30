import { Strategy as LocalStrategy } from "passport-local";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../model/user.model.js";

// create local strategy
const localLogin = new LocalStrategy(
  {
    usernameField: "email",
    passwordField: "password",
  },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return done(null, false);
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        return done(null, user);
      }
      done(null, false);
    } catch (error) {
      done(error, false);
    }
  }
);

// export local strategy
export default localLogin;
