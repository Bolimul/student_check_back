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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const service_account_1 = require("./service_account");
const http_1 = __importDefault(require("http"));
const student_model_1 = __importDefault(require("./Models/student_model"));
const socket_server_1 = __importDefault(require("./socket_server"));
const app = (0, express_1.default)();
const port = 3000;
const service_credentials = service_account_1.service_account;
const server = http_1.default.createServer(app);
(0, socket_server_1.default)(server);
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(service_credentials),
    databaseURL: "https://makeittogether-6d49b-default-rtdb.europe-west1.firebasedatabase.app",
    databaseAuthVariableOverride: { uid: "school-server" }
});
const db = firebase_admin_1.default.database();
var refToStudents = db.ref("Students");
var refToQuestionnaires = db.ref("StudentQuestionnaire");
mongoose_1.default.connect("mongodb://localhost/StudentDatabase");
server.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    //syncDB().then(() => console.log(`Listening to port ${port}`))
}));
// refToStudents.on('child_added', async(snapshot) => {
//     var info = Object(snapshot.val())
//     await addStudent(snapshot.key, info)
// })
// refToStudents.on('child_changed', async(snapshot) => {
//     var info = Object(snapshot.val())
//     await updateStudent(snapshot.key, info)
// })
// refToStudents.on('child_removed', async(snapshot) => {
//     await deleteStudent(snapshot.key) 
//     await refToQuestionnaires.child(snapshot.key).remove()
// })
// refToQuestionnaires.on("child_changed", async(snapshot) => {
//     await getSession(snapshot.key)
// })
// refToQuestionnaires.on("child_added", async(snapshot) => {
//     await getSession(snapshot.key)
// })
const syncDB = () => __awaiter(void 0, void 0, void 0, function* () {
    var studentsId = (yield student_model_1.default.students.find({}, { _id: 1 }).lean()).map((id) => id._id);
    var snapshot = yield db.ref("Students").once("value");
    var studentsIdInFirebase = Object.keys(snapshot.val());
    var deletedStudents = Array.of();
    yield Promise.all(studentsId.map((id) => __awaiter(void 0, void 0, void 0, function* () {
        if (studentsIdInFirebase.includes(id)) {
            updateStudent(id, snapshot.child(id).val()).then(() => __awaiter(void 0, void 0, void 0, function* () { return yield getSession(id); }), (e) => __awaiter(void 0, void 0, void 0, function* () { return console.log(e); }));
        }
        else {
            yield deleteStudent(id).then(() => deletedStudents.push(id));
        }
    })));
    studentsIdInFirebase = studentsIdInFirebase.filter((id) => studentsId.includes(id) == false);
    if (studentsIdInFirebase.length > 0) {
        yield Promise.all(studentsIdInFirebase.map((id) => __awaiter(void 0, void 0, void 0, function* () {
            addStudent(id, snapshot.child(id).val()).then((res) => __awaiter(void 0, void 0, void 0, function* () { return res ? yield getSession(id) : null; }), (e) => __awaiter(void 0, void 0, void 0, function* () { return console.log(e); }));
        })));
    }
});
const getSession = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var snapshot = yield db.ref("StudentQuestionnaire").child(id).once('value');
    var sessions = yield student_model_1.default.sessions.find({ sessionOwner: id }).sort({ date: -1 }).limit(1).lean().exec();
    if (sessions.length != 0) {
        var sessionDate = sessions[0].date;
        var questionnaireDate = snapshot.val().date;
        if (sessionDate != questionnaireDate) {
            yield addSessionSync(id, snapshot.val());
        }
    }
    else {
        yield addSessionSync(id, snapshot.val());
    }
});
const addStudent = (studentId, studentData) => __awaiter(void 0, void 0, void 0, function* () {
    var student = yield student_model_1.default.students.exists({ _id: studentId }).lean();
    if (student == null) {
        try {
            if (student == null) {
                let NewStudent = new student_model_1.default.students({ _id: studentId, name: studentId, group: studentData.group });
                yield NewStudent.save();
                return true;
            }
            else
                return false;
        }
        catch (error) {
            return false;
        }
    }
    else {
        return false;
    }
});
const addSessionSync = (studentId, sessionData) => __awaiter(void 0, void 0, void 0, function* () {
    let NewSession = new student_model_1.default.sessions({
        sessionOwner: studentId,
        date: sessionData.date,
        info: {
            //-----------For Line Chart-----------------//
            '_constructSumWithCoinsAndBills': sessionData._constructSumWithCoinsAndBills,
            '_constructSumWithCoins': sessionData._constructSumWithCoins,
            '_recognizeNumber': sessionData._recognizeNumber,
            '_calcChange': sessionData._calcChange,
            //------------------------------------------//
            //-----------For True-False Table-----------//
            '_chooseProductMatchingToOwnMoney': sessionData._chooseProductMatchingToOwnMoney,
            '_recognizeSmallestOrBiggestNumber': sessionData._recognizeSmallestOrBiggestNumber,
            '_comparingOwnSumToProductPrice': sessionData._comparingOwnSumToProductPrice,
            '_recognizeChangeGet': sessionData._recognizeChangeGet,
            '_recognizeNoChange': sessionData._recognizeNoChange,
            '_distinguishCheapExpensive': sessionData._distinguishCheapExpensive,
            '_matchCoinToValue1': sessionData._matchCoinToValue1,
            '_matchCoinToValue2': sessionData._matchCoinToValue2,
            '_matchCoinToValue5': sessionData._matchCoinToValue5,
            '_matchCoinToValue10': sessionData._matchCoinToValue10,
            '_matchBillToValue20': sessionData._matchBillToValue20,
            '_matchBillToValue50': sessionData._matchBillToValue50,
            '_matchBillToValue100': sessionData._matchBillToValue100,
            '_matchBillToValue200': sessionData._matchBillToValue200,
            '_recognizeCoin1': sessionData._recognizeCoins1,
            '_recognizeCoin2': sessionData._recognizeCoins2,
            '_recognizeCoin5': sessionData._recognizeCoins5,
            '_recognizeCoin10': sessionData._recognizeCoins10,
            '_recognizeBill20': sessionData._recognizeBills20,
            '_recognizeBill50': sessionData._recognizeBills50,
            '_recognizeBill100': sessionData._recognizeBills100,
            '_recognizeBill200': sessionData._recognizeBills200,
            //------------------------------------------//
        }
    });
    try {
        var res1 = yield (yield student_model_1.default.sessions.create(NewSession)).save();
        var res2 = yield student_model_1.default.students.findByIdAndUpdate(studentId, { $push: { sessions: { $each: [NewSession._id] } } });
        if (res1 != null && res2 != null)
            return true;
    }
    catch (error) {
        console.log(error);
        return false;
    }
});
const updateStudent = (studentId, studentData) => __awaiter(void 0, void 0, void 0, function* () {
    var res = yield student_model_1.default.students.exists({ _id: studentId }).lean();
    if (res != null) {
        yield student_model_1.default.students.findByIdAndUpdate(studentId, { name: studentId, group: studentData.group });
        return true;
    }
    else
        return false;
});
const deleteStudent = (studentId) => __awaiter(void 0, void 0, void 0, function* () {
    var res = yield student_model_1.default.students.exists({ _id: studentId }).lean();
    if (res != null) {
        yield student_model_1.default.sessions.deleteMany({ sessionOwner: studentId });
        yield student_model_1.default.students.findByIdAndDelete(studentId);
    }
});
//# sourceMappingURL=index.js.map