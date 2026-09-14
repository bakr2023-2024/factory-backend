import "./dotenv";
import app from "./app";

(function bootstrap() {
  const PORT = process.env["PORT"];
  app.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
  });
})();
