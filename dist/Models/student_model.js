"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const studentSchema = new mongoose_1.default.Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    group: {
        type: String,
        required: true
    },
    sessions: {
        type: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Session' }],
        required: true
    }
});
const sessionSchema = new mongoose_1.default.Schema({
    sessionOwner: {
        type: String,
        ref: 'Student',
        required: true,
        immutable: true
    },
    date: {
        type: String,
        required: true,
        immutable: true
    },
    info: {
        type: Map,
        of: Number,
        required: true,
        immutable: true
    }
});
const Student = mongoose_1.default.model('Student', studentSchema);
const Session = mongoose_1.default.model('Session', sessionSchema);
exports.default = { students: Student, sessions: Session };
//# sourceMappingURL=student_model.js.map