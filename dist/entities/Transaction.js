"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const typeorm_1 = require("typeorm");
const wallet_1 = require("./wallet");
const ActivityType_1 = require("./ActivityType");
let Transaction = class Transaction {
};
exports.Transaction = Transaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Transaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Transaction.prototype, "wallet_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Transaction.prototype, "activity_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Transaction.prototype, "montant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Transaction.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Transaction.prototype, "date_transaction", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => wallet_1.Wallet, wallet => wallet.transactions),
    (0, typeorm_1.JoinColumn)({ name: 'wallet_id' }),
    __metadata("design:type", wallet_1.Wallet)
], Transaction.prototype, "wallet", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ActivityType_1.ActivityType, activityType => activityType.transactions),
    (0, typeorm_1.JoinColumn)({ name: 'activity_type_id' }),
    __metadata("design:type", ActivityType_1.ActivityType)
], Transaction.prototype, "activityType", void 0);
exports.Transaction = Transaction = __decorate([
    (0, typeorm_1.Entity)('transactions'),
    (0, typeorm_1.Check)(`"montant" > 0`)
], Transaction);
//# sourceMappingURL=Transaction.js.map