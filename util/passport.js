import passport from "passport";
import jwtLogin from "../middleware/jwt.login.js";
import localLogin from "../middleware/local.login.js";

// tell passport to use this strategy
passport.use(jwtLogin);
passport.use(localLogin);
