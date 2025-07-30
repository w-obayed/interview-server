import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import dotenv, { config } from "dotenv";
import User from "../model/user.model.js";

// config dotenv
dotenv.config();

// create option for jwt strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

// create jwt strategy
const jwtLogin = new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findById(payload.sub).select("-password");
    if (user) {
      done(null, user);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, false);
  }
});

// export jwt strategy
export default jwtLogin;
