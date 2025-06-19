const express = require("express");Add commentMore actions
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.listen(PORT, () => {
  console.log(`Zone TSADE is running on port ${PORT}`);
});
