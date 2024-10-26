"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const socket_io_1 = require("socket.io");
const student_model_1 = __importDefault(require("./Models/student_model"));
module.exports = (server) => {
    const io = new socket_io_1.Server(server, { cors: { origin: 'http://192.168.1.185:3000' } });
    io.on('connection', (socket) => {
        socket.on('GetPersonalDataServer', (args, ack) => __awaiter(void 0, void 0, void 0, function* () {
            var studentId = args.id;
            var resFinal = true;
            var student = yield student_model_1.default.students.findById(studentId).lean();
            const res = yield socket.emitWithAck('GetPersonalDataClient', { id: student._id, name: student.name, group: student.group, sessionAmount: student.sessions.length, type: args.type });
            if (res == false)
                resFinal = false;
            ack(resFinal);
        }));
        socket.on('GetPersonalSessionServer', (args, ack) => __awaiter(void 0, void 0, void 0, function* () {
            var studentId = args.id;
            var sessionIdentifier = Number.parseInt(args.sessionIdentifier);
            var resFinal = true;
            var student = yield student_model_1.default.students.findById(studentId).lean();
            var info = [];
            var session = yield student_model_1.default.sessions.findById(student.sessions[sessionIdentifier]);
            info = Array.from(Array.from(session.info).map((category) => category[1]));
            const res = yield socket.emitWithAck('GetPersonalSessionClient', { id: studentId, date: session.date, params: info });
            if (res == false)
                resFinal = false;
            ack(resFinal);
        }));
        socket.on('checkStudentIsExistsServer', (args, ack) => __awaiter(void 0, void 0, void 0, function* () {
            var st = yield student_model_1.default.students.findById(args.id, { _id: 1 }).lean();
            if (st != null)
                ack(true);
            else
                ack(false);
        }));
        socket.on('getStudentsId', (args, ack) => __awaiter(void 0, void 0, void 0, function* () {
            var studentsId = yield student_model_1.default.students.find({}, { _id: 1 }).lean();
            var resFinal = true;
            studentsId.forEach((st) => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield socket.emitWithAck('getStudentsIdClient', { id: st });
                if (res == false)
                    resFinal = false;
            }));
            ack(resFinal);
        }));
        socket.on('checkUpdateDataServer', (args, ack) => __awaiter(void 0, void 0, void 0, function* () {
            var resFinal = true;
            var student = yield student_model_1.default.students.findById(args.id, { _id: 1, name: 1, group: 1, sessions: 1 }).lean();
            const res = yield socket.emitWithAck('checkUpdateDataClient', { id: student._id, name: student.name, group: student.group, sessionAmount: student.sessions.length });
            if (res == true) {
                const sessions = yield student_model_1.default.sessions.find({ sessionOwner: student._id });
                sessions.forEach((session) => __awaiter(void 0, void 0, void 0, function* () {
                    const res = yield socket.emitWithAck('checkUpdateDataSessionsClient', { id: student._id, date: session.date });
                    if (res == false)
                        resFinal = false;
                }));
            }
            if (res == false)
                resFinal = false;
            ack(resFinal);
        }));
        socket.on('getDataBaseLengthServer', (args, ack) => __awaiter(void 0, void 0, void 0, function* () {
            ack(student_model_1.default.students.length);
        }));
        socket.on('checkForGetDataServer', (args, ack) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            var isExist = Array.from(args.idList).length;
            var studentList = isExist != 0 ? isExist : false;
            if (studentList != false) {
                var students = yield student_model_1.default.students.find({}, { _id: 1, sessions: 1 }).lean();
                try {
                    for (var _d = true, students_1 = __asyncValues(students), students_1_1; students_1_1 = yield students_1.next(), _a = students_1_1.done, !_a; _d = true) {
                        _c = students_1_1.value;
                        _d = false;
                        const element = _c;
                        const res = yield socket.emitWithAck('checkForGetDataClient', { id: element._id });
                        if (res == false)
                            ack(false);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = students_1.return)) yield _b.call(students_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                ack(true);
            }
            else
                ack(true);
        }));
        console.log("Socket was connected");
    });
    return io;
};
//# sourceMappingURL=socket_server.js.map