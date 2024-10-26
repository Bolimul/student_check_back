import express from "express"
import mongoose from "mongoose"
import admin from "firebase-admin"
//import { service_account } from "./service_account"
import http from "http"
import Models from "./Models/student_model"
import socket_server from "./socket_server"
const app = express()
const port = 3000

//const service_credentials = service_account as admin.ServiceAccount
const server = http.createServer(app)
socket_server(server);
admin.initializeApp({
    //credential: admin.credential.cert(service_credentials),
    //databaseURL: "https://makeittogether-6d49b-default-rtdb.europe-west1.firebasedatabase.app",
    databaseAuthVariableOverride: {uid: "school-server"}
})



const db = admin.database()
var refToStudents = db.ref("Students")
var refToQuestionnaires = db.ref("StudentQuestionnaire")
mongoose.connect("mongodb://localhost/StudentDatabase")
server.listen(port, async() => {
    syncDB().then(() => console.log(`Listening to port ${port}`))
})

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

const syncDB = async() => {
    var studentsId = (await Models.students.find({}, {_id: 1}).lean()).map((id) => id._id);
    var snapshot = await db.ref("Students").once("value")
    var studentsIdInFirebase = Object.keys(snapshot.val())
    var deletedStudents = Array.of<String>()
    await Promise.all(studentsId.map(async(id) => {
        if(studentsIdInFirebase.includes(id)){
            updateStudent(id, snapshot.child(id).val()).then(async() => await getSession(id), async(e) => console.log(e))
        }
        else{
            await deleteStudent(id).then(() => deletedStudents.push(id))
        }
    }))
    studentsIdInFirebase = studentsIdInFirebase.filter((id) => studentsId.includes(id) == false)
    if(studentsIdInFirebase.length > 0)
    {
        await Promise.all(studentsIdInFirebase.map(async(id) => {
            addStudent(id, snapshot.child(id).val()).then(async(res) => res?await getSession(id):null, async(e) => console.log(e))
        }))
    }
}

const getSession = async(id: string) => {
    var snapshot = await db.ref("StudentQuestionnaire").child(id).once('value')
    var sessions = await Models.sessions.find({sessionOwner: id}).sort({date: -1}).limit(1).lean().exec()
    if(sessions.length != 0)
    {
        var sessionDate = sessions[0].date
        var questionnaireDate = snapshot.val().date
            if(sessionDate != questionnaireDate)
            {
                await addSessionSync(id, snapshot.val())
            }
    }
    else
    {
        await addSessionSync(id, snapshot.val())
    }
}



const addStudent = async(studentId: any, studentData: any) => {
    var student = await Models.students.exists({_id: studentId}).lean()
    if(student == null)
    {
        try {
            if(student == null)
            {
                let NewStudent = new Models.students({_id: studentId, name: studentId, group: studentData.group})
                await NewStudent.save()
                return true
            }
            else
                return false
        } catch (error) {
            return false
        }
        
    }
    else
    {
        return false
    }
}

const addSessionSync = async(studentId: any, sessionData: any) => {
    var finalDate: String = sessionData.date
    var parts = finalDate.split('T')[0].split('-')
    if(parts[1].length < 2){
        parts[1] = "0" + parts[1]
    }
    if(parts[2].length < 2 ){
        parts[2] = "0" + parts[2]
    }
    var date = parts[0] + '-' + parts[1] + '-' + parts[2]
    finalDate.replace(finalDate.split('T')[0], date)
    let NewSession = new Models.sessions({
        sessionOwner: studentId,
        date: finalDate,
        info: 
        {
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
    })
    try {
        var res1 = await (await Models.sessions.create(NewSession)).save()
        var res2 = await Models.students.findByIdAndUpdate(studentId, {$push: {sessions: {$each: [NewSession._id]}}})
        if(res1 != null && res2 != null)
            return true;
    } catch (error) {
        console.log(error)
        return false
    }
    
    
}

const updateStudent = async(studentId: any, studentData: any) => {
    var res = await Models.students.exists({_id: studentId}).lean()
    if(res != null)
    {
        await Models.students.findByIdAndUpdate(studentId, {name: studentId, group: studentData.group})
        return true
    }
    else
        return false
    
        
}

const deleteStudent = async(studentId: any) => {
    var res = await Models.students.exists({_id: studentId}).lean()
    if(res != null)
    {
        await Models.sessions.deleteMany({sessionOwner: studentId})
        await Models.students.findByIdAndDelete(studentId)
    }
}
