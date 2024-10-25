import mongoose from 'mongoose';


const studentSchema = new mongoose.Schema({
    _id: {
        type:String,
        required: true
    },
    name:{
        type:String,
        required:true
    },
    group:{
        type:String,
        required:true
    },
    sessions: {
        type:[{type: mongoose.Schema.Types.ObjectId, ref: 'Session'}],
        required:true
    }
})

const sessionSchema = new mongoose.Schema({
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
})

const Student = mongoose.model('Student', studentSchema)
const Session = mongoose.model('Session', sessionSchema)


export default {students: Student, sessions: Session}