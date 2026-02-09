import connectDB from "./src/config/db.js";
import app from "./app.js";
import http from "http"
import { initSocket } from "./src/sockets/socket.js";
connectDB();

const server = http.createServer(app);
initSocket(server);

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
