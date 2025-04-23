import express from "express";
import cors from "cors";
import { port } from "./config/config.js";
import auth from "./routes/auth.js";
import modules from "./routes/modules.js";
import users from "./routes/users.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static("public"));

app.use("/api/auth", auth);
app.use("/api/modules", modules);
app.use("/api/users", users);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
