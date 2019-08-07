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
const common_1 = require("@nestjs/common");
const trips_service_1 = require("./trips.service");
let TripsController = class TripsController {
    constructor(TripsService) {
        this.TripsService = TripsService;
    }
    findTrip() {
        return `This gets all the trips`;
    }
    createTrip() {
        return `This creates the trips`;
    }
    deleteTrip() {
        return `This deletes all the trips`;
    }
    updateATrip() {
        return `This updates all the trips`;
    }
};
__decorate([
    common_1.Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], TripsController.prototype, "findTrip", null);
__decorate([
    common_1.Post(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], TripsController.prototype, "createTrip", null);
__decorate([
    common_1.Delete(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], TripsController.prototype, "deleteTrip", null);
__decorate([
    common_1.Patch(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], TripsController.prototype, "updateATrip", null);
TripsController = __decorate([
    common_1.Controller('trips'),
    __metadata("design:paramtypes", [trips_service_1.TripsService])
], TripsController);
exports.TripsController = TripsController;
//# sourceMappingURL=trips.controller.js.map