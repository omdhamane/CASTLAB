const adminProtect = (req, res, next) => {
  const key = req.headers["x-admin-key"];
  const expected = process.env.ADMIN_KEY || "castlab-admin";

  if (!key || key !== expected) {
    return res.status(401).json({ message: "Invalid or missing admin key" });
  }

  next();
};

module.exports = adminProtect;
