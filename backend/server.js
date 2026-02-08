import connectDB from "./src/config/db.js";
import app from "./app.js";

connectDB();


app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
