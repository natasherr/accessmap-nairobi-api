import app from "./app.js"
import { PORT } from "./app.js";

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});