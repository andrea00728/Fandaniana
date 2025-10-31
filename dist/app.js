"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("@dotenvx/dotenvx/config");
const express_1 = __importDefault(require("express"));
require("reflect-metadata");
const data_source_js_1 = require("./config/data-source.js");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const auth_routes_js_1 = __importDefault(require("./routes/auth.routes.js"));
const cors_1 = __importDefault(require("cors"));
const active_routes_js_1 = __importDefault(require("./routes/active.routes.js"));
const wallet_routes_js_1 = __importDefault(require("./routes/wallet.routes.js"));
const transaction_route_js_1 = __importDefault(require("./routes/transaction.route.js"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
console.log('EMAIL_USER=', process.env.SMTP_USER);
console.log('EMAIL_PASS=', process.env.SMTP_PASS);
//configuration cors
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:8081", // si tu utilises le web via Expo
        "exp://192.168.1.189:8081", // ton adresse Expo Go
        "http://localhost:19006", // port Expo Web
        "http://localhost:19000", // port Expo dev tools
        "http://192.168.1.189:19000", // IP de ton téléphone sur le même réseau
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// --- Swagger configuration ---
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "TaxiBe API",
            version: "1.0.0",
            description: "Documentation de l'API TaxiBe",
        },
        servers: [
            { url: "http://localhost:3000/api" },
        ],
        // Ajoutez la configuration de security
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Entrer le token JWT depuis l’authentification (format: Bearer <votre_token>)"
                }
            }
        },
        // Ajoutez la configuration de security
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ["./dist/routes/*.js", "./src/routes/*.js"],
};
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
// Route pour accéder à Swagger UI
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerSpec));
// --- Routes ---
app.use("/api/auth", auth_routes_js_1.default);
app.use("/api/Activity", active_routes_js_1.default);
app.use("/api/Transactions", transaction_route_js_1.default);
app.use("/api/Wallet", wallet_routes_js_1.default);
data_source_js_1.AppDataSource.initialize()
    .then(() => console.log("📦 Base de données connectée"))
    .catch((err) => console.error("Erreur de connexion DB :", err));
exports.default = app;
//# sourceMappingURL=app.js.map