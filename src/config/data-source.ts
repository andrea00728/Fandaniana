import { DataSource } from "typeorm";
import { Wallet } from "../entities/wallet";
import { Transaction } from "../entities/Transaction";
import { ActivityType } from "../entities/ActivityType";



export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "dpg-d425fkpr0fns738v2280-a",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || "depensepersonnel_user",
  password: process.env.DB_PASSWORD || "fiuHfhEQUZwhHi6QsexhT8FH5gOenQaz",
  database: process.env.DB_NAME || "depensepersonnel",
  // entities: ["dist/entities/*.js"],
    entities: [Wallet,Transaction,ActivityType],
  synchronize: true,
});
