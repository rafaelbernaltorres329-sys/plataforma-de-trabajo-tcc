import mongoose from "mongoose";
import { config } from "./app.config";

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("Conectado a Mongo db ");
  } catch (error) {
    console.log("Error conectando a  Mongo db ");
    process.exit(1);
  }
};

export default connectDatabase;
