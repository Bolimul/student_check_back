import http from "http"
import {Server} from "socket.io"
import Models from "./Models/student_model"


export = (server: http.Server) => {
    const io = new Server(server, {cors: {origin: 'http://192.168.1.185:3000'}})
    io.on('connection', (socket) => {
        socket.on('GetPersonalDataServer', async(args, ack) => {
            var studentId = args.id
            var resFinal = true
            var student = await Models.students.findById(studentId).lean()
            const res = await socket.emitWithAck('GetPersonalDataClient', {id: student._id, name: student.name, group: student.group, sessionAmount: student.sessions.length, type: args.type})
            if(res == false)
                resFinal = false;
            ack(resFinal)
        })

        socket.on('GetPersonalSessionServer', async(args, ack) => {
            var studentId = args.id
            var sessionIdentifier = args.type == 'update'?args.sessionIdentifier:Number.parseInt(args.sessionIdentifier)
            var resFinal = true
            var session = null
            if(args.type == 'get')
                session = await Models.sessions.findById((await Models.students.findById(studentId,{sessions: 1}).lean()).sessions[sessionIdentifier]._id, {date: 1, info: 1}).exec()
            else
                session = await Models.sessions.findOne({sessionOwner: args.id, date: sessionIdentifier}).lean().exec()
            var info = Array(Array.from(session.get('info')).map((item) => item[1]))
            const res = await socket.emitWithAck('GetPersonalSessionClient', {id: studentId, date: session.date, params: info})
            if(res == false)
                resFinal = false
            ack(resFinal)
        })

        socket.on('checkStudentIsExistsServer', async(args, ack) => {
            var st = await Models.students.findById(args.id, {_id: 1}).lean()
            if(st != null)
                ack(true)
            else
                ack(false)
        })

        socket.on('getStudentsId', async(args, ack) => {
            var studentsId = await Models.students.find({}, {_id: 1}).lean();
            var resFinal = true
            studentsId.forEach(async(st) => {
                const res = await socket.emitWithAck('getStudentsIdClient', {id: st})
                if(res == false)
                    resFinal = false
            })
            ack(resFinal)
        })

        socket.on('checkUpdateDataServer', async(args, ack) => {
            var resFinal = true
            var student = await Models.students.findById(args.id, {_id: 1, name: 1, group: 1, sessions: 1}).lean()
            const res = await socket.emitWithAck('checkUpdateDataClient', {id: student._id, name: student.name, group: student.group, sessionAmount: student.sessions.length})
            if(res == true){
                const sessions = await Models.sessions.find({sessionOwner: student._id})
                sessions.forEach(async(session) => {
                    const res = await socket.emitWithAck('checkUpdateDataSessionsClient', {id: student._id, date: session.date})
                    if(res == false)
                        resFinal = false
                })         
            }
            if(res == false)
                resFinal = false
            ack(resFinal)
            
        })

        socket.on('getDataBaseLengthServer', async(args, ack) => {
            ack(Models.students.length)
        })

        socket.on('checkForGetDataServer', async(args, ack) => {
            var isExist = Array.from(args.idList).length
            var studentList = isExist != 0? isExist : false
            if(studentList != false){
                var students = await Models.students.find({}, {_id: 1, sessions: 1}).lean()
                for await (const element of students) {
                    const res = await socket.emitWithAck('checkForGetDataClient', {id: element._id})
                    if(res == false)
                        ack(false)
                }
                ack(true)
            }else
                ack(true)
            
        })
        console.log("Socket was connected")
    })
    return io;
}