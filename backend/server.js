import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import notifyRoutes from "./routes/notifyRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/notify", notifyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
