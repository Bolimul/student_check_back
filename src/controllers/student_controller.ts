import mongoose from "mongoose"
import IStudent from "../Models/student_model"

class StudentController<ModelType>{
    itemModel:mongoose.Model<ModelType>
    constructor(itemModel:mongoose.Model<ModelType>){
        this.itemModel = itemModel
    }

    async AddStudent(student: any){
        try {
            const item = await this.itemModel.create(student)
            return item
        } catch (error) {
            console.log(error)
        }
        
    }
}

export default StudentController