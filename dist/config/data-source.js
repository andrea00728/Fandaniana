"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const wallet_1 = require("../entities/wallet");
const Transaction_1 = require("../entities/Transaction");
const ActivityType_1 = require("../entities/ActivityType");
// export const AppDataSource = new DataSource({
//   type: "postgres",
//   host: process.env.DB_HOST || "dpg-d425fkpr0fns738v2280-a",
//   port: Number(process.env.DB_PORT || 5432),
//   username: process.env.DB_USER || "depensepersonnel_user",
//   password: process.env.DB_PASSWORD || "fiuHfhEQUZwhHi6QsexhT8FH5gOenQaz",
//   database: process.env.DB_NAME || "depensepersonnel",
//   // entities: ["dist/entities/*.js"],
//     entities: [Wallet,Transaction,ActivityType],
//   synchronize: true,
// });
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "aandrea",
    database: process.env.DB_NAME || "depensepersonnel",
    // entities: ["dist/entities/*.js"],
    entities: [wallet_1.Wallet, Transaction_1.Transaction, ActivityType_1.ActivityType],
    synchronize: true,
});
//# sourceMappingURL=data-source.js.map