import { DataSource } from "typeorm";
import { Wallet } from "../entities/wallet";
import { Transaction } from "../entities/Transaction";
import { ActivityType } from "../entities/ActivityType";



export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "aandrea",
  database: process.env.DB_NAME || "depensepersonnel",
  // entities: ["dist/entities/*.js"],
    entities: [Wallet,Transaction,ActivityType],
  synchronize: true,
});
