import app from "./app.js";
import '@dotenvx/dotenvx/config';


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚕 Serveur fandanina en marche sur le port ${PORT}`);
});
