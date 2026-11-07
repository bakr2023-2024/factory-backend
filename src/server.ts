import "./dotenv";
import app from "./app";

(function bootstrap() {
  const PORT = Number(process.env["PORT"]) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`server running at http://localhost:${PORT}`);
  });
})();
