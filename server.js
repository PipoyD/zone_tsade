app.use(express.static(path.join(__dirname)));Add commentMore actions

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "register.html"));
});

app.listen(PORT, () => {
