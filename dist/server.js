"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_js_1 = __importDefault(require("./app.js"));
require("@dotenvx/dotenvx/config");
const PORT = process.env.PORT || 3000;
app_js_1.default.listen(PORT, () => {
    console.log(`🚕 Serveur fandanina en marche sur le port ${PORT}`);
});
//# sourceMappingURL=server.js.map